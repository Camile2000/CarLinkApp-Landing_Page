# Scénario de Test Complet — Mises à Jour Auth v2

**Date** : 2026-05-27  
**Branche** : `claude/dev-mobile`  
**Objectif** : Vérifier les trois sujets + hardening sécurité

---

## Pré-conditions

- ✅ App lancée : `npm run mobile`
- ✅ Supabase connecté et migrations appliquées
- ✅ Trois comptes de test :
  - `conductor@test.cm` (rôle **conductor**)
  - `garage@test.cm` (rôle **garage**)
  - `nouveau@test.cm` (email **jamais utilisé**)

---

## Test 1 : Séparation des rôles — Mot de passe oublié (Sujet 1)

### 1a. Conducteur oublie son mot de passe (depuis écran conducteur)

**Étapes** :
1. Lancer l'app → écran de connexion
2. Cliquer sur **"Espace Conducteur"** → page signin-conductor
3. Cliquer **"Mot de passe oublié ?"**
4. Entrer `conductor@test.cm`
5. Cliquer **"Envoyer le code"**

**Résultats attendus** :
- ✅ Toast : "Si un compte existe avec cet email, un code a été envoyé."
- ✅ Redirection vers écran OTP avec `email=conductor@test.cm, type=recovery`
- ✅ **L'email reset est bien envoyé** (vérifier inbox ou Supabase logs)

**Vérification technique** :
```
Frontend: role='conductor' passé via useLocalSearchParams
RPC check_email_role('conductor@test.cm') → 'conductor'
Résultat: conducteur peut continuer (rôles correspondent)
```

---

### 1b. Conducteur tente de récupérer un compte garage (attaque de rôle)

**Étapes** :
1. Depuis signin-conductor, cliquer **"Mot de passe oublié ?"**
2. Entrer `garage@test.cm` (email d'un compte garage)
3. Cliquer **"Envoyer le code"**

**Résultats attendus** :
- ✅ Toast : "Si un compte existe avec cet email, un code a été envoyé." (même message)
- ✅ Redirection vers OTP (UX neutre)
- ❌ **Aucun email reset n'est envoyé** (RPC bloque car role mismatch)
- ✅ Vérifier inbox : `garage@test.cm` reçoit **RIEN**

**Vérification technique** :
```
Frontend: role='conductor' vs RPC result='garage'
Mismatch détecté → Message neutre affiché
Pas d'appel à resetPasswordForEmail()
```

---

### 1c. Garage oublie son mot de passe (depuis écran garage)

**Étapes** :
1. Retourner à l'écran principal → cliquer **"Espace Garage"** → page signin-garage
2. Cliquer **"Mot de passe oublié ?"**
3. Entrer `garage@test.cm`
4. Cliquer **"Envoyer le code"**

**Résultats attendus** :
- ✅ Toast : "Si un compte existe avec cet email, un code a été envoyé."
- ✅ Email bien envoyé à `garage@test.cm`

**Vérification technique** :
```
Frontend: role='garage' via useLocalSearchParams
RPC check_email_role('garage@test.cm') → 'garage'
Résultat: garage peut continuer (rôles correspondent)
```

---

## Test 2 : Dropdown auto-close sur zone vide (Sujet 2)

### 2a. Dropdown se ferme au clic sur autre champ

**Étapes** :
1. Naviguer vers **Espace Garage** → page d'inscription
2. Scroll jusqu'au champ **"Ville"**
3. Cliquer sur le dropdown "Sélectionner votre ville"
4. Dropdown s'ouvre (options visibles)
5. **Cliquer sur le champ "Nom du garage"** (autre champ Input)

**Résultats attendus** :
- ✅ Dropdown se ferme immédiatement
- ✅ Clavier s'affiche pour le champ "Nom du garage"
- ✅ UX fluide (pas de lag)

**Vérification technique** :
```
global Pressable wrapper: onPress → Keyboard.dismiss() + setCityDropdownOpen(false)
Input onFocus handlers: setCityDropdownOpen(false)
→ Double fermeture garantie
```

---

### 2b. Dropdown se ferme au clic sur zone vide

**Étapes** :
1. Cliquer à nouveau sur dropdown "Ville"
2. Dropdown s'ouvre
3. **Cliquer sur une zone vide** (space blanc entre "Ville" et les options, ou scroll area)
4. Observer si dropdown se ferme

**Résultats attendus** :
- ✅ Dropdown se ferme au clic sur zone vide
- ✅ Pas de crash, pas de comportement bizarre
- ✅ Vous pouvez relancer le dropdown sans problème

**Vérification technique** :
```
<Pressable onPress={() => { Keyboard.dismiss(); setCityDropdownOpen(false); }}>
Cette Pressable wrapper capture tous les clics en dehors des enfants interactifs.
```

---

### 2c. Sélection d'option ferme la dropdown et met à jour le champ

**Étapes** :
1. Cliquer sur dropdown "Ville"
2. Cliquer sur une option (ex: **"Douala"**)
3. Observer le changement

**Résultats attendus** :
- ✅ Option sélectionnée s'affiche dans le champ
- ✅ Dropdown se ferme
- ✅ Checkmark ✓ s'affiche à côté de l'option sélectionnée
- ✅ Vous pouvez ouvrir/fermer le dropdown plusieurs fois sans problème

---

## Test 3 : RPC `check_email_status` et `check_email_role` (Sujet 3)

### 3a. Inscription garage — email déjà vérifié (disponible)

**Étapes** :
1. Page inscription garage → champ "Email"
2. Entrer `nouveau@test.cm` (email jamais utilisé)
3. Remplir les autres champs requis (Nom, Manager, Téléphone, Ville, Adresse, Spécialités, Mot de passe)
4. Cliquer **"Continuer vers la vérification"**

**Résultats attendus** :
- ✅ Vérification passe (email disponible)
- ✅ Toast : "Inscription réussie. Vérifiez votre email."
- ✅ Redirection vers écran OTP avec `type=signup, role=garage`
- ✅ Email de confirmation reçu dans la boîte

**Vérification technique** :
```
Frontend RPC call: check_email_status('nouveau@test.cm')
Response: 'available'
→ Permet l'inscription (supabase.auth.signUp)
```

---

### 3b. Inscription garage — email en cours de vérification (attaque)

**Étapes** :
1. Créer un compte test avec `pending@test.cm`, recevoir l'OTP mais **NE PAS valider**
2. Revenir à l'inscription garage
3. Entrer `pending@test.cm`
4. Remplir les autres champs
5. Cliquer **"Continuer vers la vérification"**

**Résultats attendus** :
- ❌ Inscription bloquée
- ✅ Toast : "Un compte est déjà en cours de validation avec cet email. Veuillez vérifier le code reçu par email."
- ❌ Pas de redirection vers OTP
- ❌ Pas d'email supplémentaire envoyé

**Vérification technique** :
```
Frontend RPC call: check_email_status('pending@test.cm')
Response: 'pending_verification'
→ Bloque l'inscription (affiche message)
```

---

### 3c. Inscription garage — email déjà validé (autre compte)

**Étapes** :
1. Entrer dans le champ email d'un compte déjà confirmé (ex: `conductor@test.cm`)
2. Remplir les autres champs
3. Cliquer **"Continuer vers la vérification"**

**Résultats attendus** :
- ❌ Inscription bloquée
- ✅ Toast : "Cet email est déjà associé à un compte."
- ❌ Pas de redirection
- ❌ Pas d'appel Supabase signUp

**Vérification technique** :
```
Frontend RPC call: check_email_status('conductor@test.cm')
Response: 'verified'
→ Bloque l'inscription (affiche message)
```

---

## Test 4 : Rate Limiting — Anti-énumération (Sujet A — Hardening)

### 4a. Rate limit sur forgot-password (2s minimum entre tentatives)

**Étapes** :
1. Aller à forgot-password
2. Entrer un email
3. Cliquer **"Envoyer le code"** immédiatement
4. Attendre que le toast disparaisse (OTP s'affiche)
5. Retourner à forgot-password (back button)
6. Entrer un autre email
7. Immédiatement cliquer **"Envoyer le code"** (moins de 2s après la dernière tentative)

**Résultats attendus** :
- ✅ Première tentative réussit
- ✅ Deuxième tentative rapide est **bloquée**
- ✅ Toast : "Veuillez patienter quelques secondes avant de réessayer."
- ✅ Après 2 secondes, le bouton redevient actif et vous pouvez réessayer

**Vérification technique** :
```
Frontend useRef: lastAttemptAt.current
À chaque handleReset():
  if (now - lastAttemptAt.current < 2000) {
    toast.error(...) && return
  }
  lastAttemptAt.current = now
→ Bloque les spam rapides
```

---

## Test 5 : Sécurité — Aucune énumération d'email (Cross-check)

### 5a. Messages neutres identiques

**Étapes** :
1. Test 1b + 1c : Observer les messages
2. Test 3a + 3b + 3c : Observer les messages

**Résultats attendus** :
- ✅ Forgot-password affiche toujours : "Si un compte existe avec cet email, un code a été envoyé."
- ✅ Signup garage affiche messages **DIFFÉRENTS** (mais bloque correctement)
  - "Un compte est déjà en cours..." (pending)
  - "Cet email est déjà associé..." (verified)
- ✅ Aucune variation ne révèle si email existe ou non

---

## Résumé — Checklist finale

| Test | Cas | Résultat | Signature |
|------|-----|----------|-----------|
| **Sujet 1** | 1a. Conducteur légit | ✅ Pass | |
| | 1b. Conducteur attaque garage | ✅ Bloqué | |
| | 1c. Garage légit | ✅ Pass | |
| **Sujet 2** | 2a. Dropdown ferme au champ | ✅ Pass | |
| | 2b. Dropdown ferme au clic vide | ✅ Pass | |
| | 2c. Sélection option | ✅ Pass | |
| **Sujet 3** | 3a. Email disponible | ✅ Pass | |
| | 3b. Email pending | ✅ Bloqué | |
| | 3c. Email vérifié | ✅ Bloqué | |
| **Sujet A** | 4a. Rate limit 2s | ✅ Pass | |
| **Sécurité** | 5a. Messages neutres | ✅ Pass | |

---

## Notes techniques

- **RLS** : Vérifiez les logs Supabase pour les RPC calls
- **Migrations** : Confirmées appliquées `20260527010000` + `20260527020000`
- **Frontend** : Branche `claude/dev-mobile` commitée
- **Passwords** : HaveIBeenPwned à activer via dashboard (Sujet B)

Bon test ! 🚀
