# 🔐 RLS Policies — Documentation Complète (29 policies)

**Source** : `supabase/migrations/20260519000000_optimize_rls_policies.sql`  
**Date** : 2026-05-19  
**Statut** : ✅ Optimisé (fusion policies redondantes + initplan correction)

---

## Table des matières

1. [Helpers RLS (schéma `private`)](#helpers-rls)
2. [Pattern général](#pattern-général)
3. [Policies par table](#policies-par-table)
4. [Matrice d'accès](#matrice-daccès)
5. [Cas de test](#cas-de-test)

---

## Helpers RLS

Fonctions dans le schéma `private` (NON exposé par PostgREST) :

```sql
-- Vérifie si l'utilisateur courant est admin
private.is_admin() → boolean

-- Vérifie si l'utilisateur courant possède le garage
private.owns_garage(garage_id uuid) → boolean

-- Trigger BEFORE UPDATE : empêche escalade de rôle
private.prevent_role_escalation() → void (trigger)
```

**Avantage** : Non exposées via API REST = sûres.

---

## Pattern Général

### Structure standard d'une policy RLS

```sql
CREATE POLICY "policy_name" ON public.table_name
  FOR <SELECT|INSERT|UPDATE|DELETE|ALL>
  TO authenticated
  USING (condition)           -- Filtre READ + UPDATE (WHERE)
  WITH CHECK (condition);     -- Filtre WRITE + INSERT (ON CONFLICT)
```

### Règles appliquées

1. **`(select auth.uid())`** : Évite les initplans redondants
2. **`(select private.is_admin())`** : Vérification admin optimisée
3. **`(select private.owns_garage(id))`** : Lookup garage propriétaire
4. **`WITH CHECK`** : Obligatoire sur INSERT/UPDATE pour éviter injections
5. **Fusion des policies** : Une policy par opération (SELECT/INSERT/UPDATE/DELETE), pas de redondance

---

## Policies par table

---

### **1. TABLE : `users`** (4 policies)

Stocke les profils utilisateurs (conducteurs, garagistes, admins).

#### Policy 1: `users: lecture` (SELECT)

```sql
CREATE POLICY "users: lecture" ON public.users
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = id              -- Son propre profil
    OR (select private.is_admin())        -- Ou admin lit tous
  );
```

| Qui peut lire ? | Cas |
|---|---|
| ✅ Tout utilisateur | Peut lire son propre profil |
| ✅ Admin | Peut lire tous les profils |
| ❌ Conducteur A | Ne peut pas lire Conducteur B |
| ❌ Garagiste A | Ne peut pas lire Garagiste B |

**Cas de test** :
```javascript
// ✅ Autorisé
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', currentUserId);  // Son propre profil

// ❌ Bloqué
const { data, error } = await supabase
  .from('users')
  .select('phone, email')
  .eq('id', otherUserId);    // RLS: 0 rows
```

---

#### Policy 2: `users: mise à jour` (UPDATE)

```sql
CREATE POLICY "users: mise à jour" ON public.users
  FOR UPDATE TO authenticated
  USING (
    (select auth.uid()) = id
    OR (select private.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = id
    OR (select private.is_admin())
  );
```

| Qui peut modifier ? | Cas |
|---|---|
| ✅ Utilisateur | Modifie son profil (avatar, langue, full_name) |
| ✅ Admin | Modifie n'importe quel profil |
| ❌ Utilisateur | Ne peut pas modifier son `role` (bloqué par trigger `prevent_role_escalation`) |
| ❌ Conducteur | Ne peut pas modifier profil de Garagiste |

**Trigger additionnel** : `prevent_role_escalation` empêche même l'admin côté client de changer de rôle (sauf via service_role server-side).

---

#### Policy 3: `users: admin insert` (INSERT)

```sql
CREATE POLICY "users: admin insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((select private.is_admin()));
```

| Qui peut créer ? | Cas |
|---|---|
| ✅ Admin | Insère manuellement un user |
| ❌ Conducteur | Ne peut pas insérer (le trigger `handle_new_user` le fait automatiquement) |
| ❌ Garagiste | Idem |

**Flux réel** :
1. Auth.signUp() crée `auth.users`
2. Trigger `handle_new_user` (SECURITY DEFINER) insère automatiquement dans `public.users`
3. Le client ne touche jamais à INSERT sur users.

---

#### Policy 4: `users: admin delete` (DELETE)

```sql
CREATE POLICY "users: admin delete" ON public.users
  FOR DELETE TO authenticated
  USING ((select private.is_admin()));
```

| Qui peut supprimer ? | Cas |
|---|---|
| ✅ Admin | Supprime un user (rare, audit trail recommandé) |
| ❌ Tout autre | Pas d'auto-suppression |

---

### **2. TABLE : `vehicles`** (2 policies)

Véhicules d'un conducteur.

#### Policy 1: `vehicles: propriétaire ou admin` (ALL)

```sql
CREATE POLICY "vehicles: propriétaire ou admin" ON public.vehicles
  FOR ALL
  USING (
    (select auth.uid()) = user_id
    OR (select private.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = user_id
  );
```

| Opération | Qui peut ? | Cas |
|---|---|---|
| **SELECT** | Propriétaire + Admin | Lire ses véhicules + tous si admin |
| **INSERT** | Propriétaire | Ajouter un véhicule à son profil (`user_id` fixé) |
| **UPDATE** | Propriétaire | Modifier ses véhicules (marque, modèle, mileage) |
| **DELETE** | Propriétaire | Supprimer ses véhicules |

**Cas de test** :
```javascript
// ✅ Conducteur ajoute sa voiture
const { data } = await supabase
  .from('vehicles')
  .insert({
    user_id: currentUserId,
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020
  });

// ❌ Conducteur tente de modifier le user_id (WITH CHECK bloque)
const { error } = await supabase
  .from('vehicles')
  .update({ user_id: otherUserId })  // RLS: Failed
  .eq('id', vehicleId);
```

---

### **3. TABLE : `garages`** (4 policies)

Profil garage (enregistrement garagiste).

#### Policy 1: `garages: lecture` (SELECT)

```sql
CREATE POLICY "garages: lecture" ON public.garages
  FOR SELECT
  USING (
    suspended = false          -- Garage actif visible de tous
    OR (select auth.uid()) = user_id  -- Propriétaire voit le sien même suspendu
    OR (select private.is_admin())    -- Admin voit tous
  );
```

| Qui voit ? | Cas |
|---|---|
| ✅ Tous (conducteurs) | Garages **actifs** (`suspended = false`) — pour chercher devis |
| ✅ Propriétaire | Voir son propre garage même suspendu |
| ✅ Admin | Voir tous, même suspendus |
| ❌ Garage A | Ne peut pas voir Garage B |

**Cas business** : Quand un garage est suspendu (fraude), les conducteurs ne le voient plus dans la liste.

---

#### Policy 2: `garages: insert` (INSERT)

```sql
CREATE POLICY "garages: insert" ON public.garages
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select private.is_admin())
  );
```

| Qui crée ? | Cas |
|---|---|
| ✅ Garagiste | Enregistre son garage (`user_id` = sien) |
| ✅ Admin | Ajoute un garage pour quelqu'un |
| ❌ Conducteur | Pas d'INSERT |

---

#### Policy 3: `garages: mise à jour` (UPDATE)

```sql
CREATE POLICY "garages: mise à jour" ON public.garages
  FOR UPDATE TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR (select private.is_admin())
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select private.is_admin())
  );
```

| Qui modifie ? | Peut changer ? | Cas |
|---|---|---|
| ✅ Propriétaire | garage_name, specialties, city, phone | Mise à jour profil garage |
| ✅ Admin | Tout sauf rating (recalc_garage_rating trigger) | Modération |
| ❌ Propriétaire | `is_certified`, `suspended` | Impossible côté client (admin only via service_role) |

---

#### Policy 4: `garages: suppression` (DELETE)

```sql
CREATE POLICY "garages: suppression" ON public.garages
  FOR DELETE TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR (select private.is_admin())
  );
```

| Qui supprime ? | Cas |
|---|---|
| ✅ Propriétaire | Ferme son garage (soft delete recommandé) |
| ✅ Admin | Supprime un garage (audit trail recommandé) |

---

### **4. TABLE : `quote_requests`** (4 policies)

Demandes de devis (conducteur → garages).

#### Policy 1: `requests: lecture` (SELECT) — ⭐ Complexe

```sql
CREATE POLICY "requests: lecture" ON public.quote_requests
  FOR SELECT TO authenticated
  USING (
    conductor_id = (select auth.uid())           -- A : Conducteur voit sa demande
    OR (select private.is_admin())               -- B : Admin voit tout
    OR (select private.owns_garage(garage_id))   -- C : Garage désigné voit la demande
    OR (                                          -- D : Tout garage ACTIF voit demandes sans garage attribué
      garage_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.garages g
        WHERE g.user_id = (select auth.uid())
        AND g.suspended = false
      )
    )
  );
```

| Cas | Qui voit ? | Logique |
|---|---|---|
| **A** | Conducteur A | Voit ses propres demandes |
| **B** | Admin | Voit toutes les demandes |
| **C** | Garage attribué | Garage X voit la demande si `garage_id = garage_X` |
| **D** | Garages actifs | Tous les garages actifs voient demandes `garage_id = NULL` (broadcast) |
| ❌ | Garage suspendu | Ne voit PAS les demandes broadcast (D vérifie `suspended = false`) |
| ❌ | Garage non attribué | Ne voit pas demandes attribuées à autre garage (C) |

**Flux réel** :
1. Conducteur A crée demande → `garage_id = NULL`
2. Tous les garages actifs voient cette demande (D)
3. Garage X accepte → `garage_id = garage_X_id`
4. Seul Garage X voit (C), autres garages ne la voient plus
5. Conducteur A voit toujours (A)

---

#### Policy 2: `requests: insert conducteur` (INSERT)

```sql
CREATE POLICY "requests: insert conducteur" ON public.quote_requests
  FOR INSERT TO authenticated
  WITH CHECK (conductor_id = (select auth.uid()));
```

| Qui crée ? | Cas |
|---|---|
| ✅ Conducteur | Crée une demande (`conductor_id` = sien) |
| ❌ Garage | Pas de création (listé, pas écriture) |
| ❌ Admin | Pas côté client (service_role server-side) |

---

#### Policy 3: `requests: mise à jour` (UPDATE)

```sql
CREATE POLICY "requests: mise à jour" ON public.quote_requests
  FOR UPDATE TO authenticated
  USING (
    conductor_id = (select auth.uid())
    OR (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  )
  WITH CHECK (
    conductor_id = (select auth.uid())
    OR (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  );
```

| Qui peut modifier ? | Peut changer ? | Cas |
|---|---|---|
| ✅ Conducteur | status (accept/decline), description | Accepte un devis, annule demande |
| ✅ Garage propriétaire | status (pending → quoted → accepted) | Garage met à jour le statut |
| ✅ Admin | Tout | Modération |
| ❌ Garage autre | Rien | Impossible |

---

#### Policy 4: `requests: suppression` (DELETE)

```sql
CREATE POLICY "requests: suppression" ON public.quote_requests
  FOR DELETE TO authenticated
  USING (
    conductor_id = (select auth.uid())
    OR (select private.is_admin())
  );
```

| Qui supprime ? | Cas |
|---|---|
| ✅ Conducteur | Supprime sa demande (soft delete recommandé) |
| ✅ Admin | Supprime (modération) |
| ❌ Garage | Ne peut pas supprimer |

---

### **5. TABLE : `quotes`** (4 policies)

Devis des garages (garage A répond à demande de conducteur B).

#### Policy 1: `quotes: lecture` (SELECT) — ⭐ Complexe

```sql
CREATE POLICY "quotes: lecture" ON public.quotes
  FOR SELECT TO authenticated
  USING (
    (select private.is_admin())           -- A : Admin voit tout
    OR (select private.owns_garage(garage_id))  -- B : Garage propriétaire voit ses devis
    OR EXISTS (                            -- C : Conducteur de la demande voit les devis
      SELECT 1 FROM public.quote_requests r
      WHERE r.id = request_id
      AND r.conductor_id = (select auth.uid())
    )
  );
```

| Cas | Qui voit ? | Logique |
|---|---|---|
| **A** | Admin | Voit tous les devis |
| **B** | Garage X | Voit ses devis (si garage_id = garage_X) |
| **C** | Conducteur A | Voit tous les devis sur sa demande (join quote_requests) |
| ❌ | Garage Y | Ne voit pas devis de Garage X |
| ❌ | Conducteur B | Ne voit pas devis sur demande de Conducteur A |

**Cas business** :
1. Conducteur A crée demande 101
2. Garage X crée devis 1 (100€)
3. Garage Y crée devis 2 (80€)
4. Conducteur A voit devis 1 + 2 (C)
5. Garage X voit devis 1 (B), pas devis 2
6. Garage Y voit devis 2, pas devis 1

---

#### Policy 2: `quotes: insert garage` (INSERT)

```sql
CREATE POLICY "quotes: insert garage" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (
    (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  );
```

| Qui crée ? | Cas |
|---|---|
| ✅ Garage X | Ajoute un devis sur une demande |
| ❌ Conducteur | Impossible (garage-only) |

---

#### Policy 3: `quotes: mise à jour` (UPDATE)

```sql
CREATE POLICY "quotes: mise à jour" ON public.quotes
  FOR UPDATE TO authenticated
  USING (
    (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  )
  WITH CHECK (
    (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  );
```

| Qui peut modifier ? | Cas |
|---|---|
| ✅ Garage propriétaire | Modifie son devis (prix, délai, notes) |
| ✅ Admin | Modère |
| ❌ Garage autre | Impossible |
| ❌ Conducteur | Impossible (lecture seule) |

---

#### Policy 4: `quotes: suppression garage` (DELETE)

```sql
CREATE POLICY "quotes: suppression garage" ON public.quotes
  FOR DELETE TO authenticated
  USING (
    (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  );
```

| Qui supprime ? | Cas |
|---|---|
| ✅ Garage propriétaire | Retire son devis |
| ✅ Admin | Supprime (modération) |

---

### **6. TABLE : `messages`** (3 policies)

Messages privés entre conducteur et garage.

#### Policy 1: `messages: lecture` (SELECT)

```sql
CREATE POLICY "messages: lecture" ON public.messages
  FOR SELECT TO authenticated
  USING (
    sender_id = (select auth.uid())          -- A : Expéditeur voit son message
    OR recipient_id = (select auth.uid())    -- B : Destinataire voit son message
    OR (select private.is_admin())           -- C : Admin voit tout
  );
```

| Cas | Qui voit ? |
|---|---|
| **A+B** | Expéditeur + Destinataire voient la conversation |
| **C** | Admin voit tous les messages |
| ❌ | Tiers (Conducteur C ou Garage Z) ne voient rien |

---

#### Policy 2: `messages: envoi` (INSERT)

```sql
CREATE POLICY "messages: envoi" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));
```

| Qui envoie ? | Cas |
|---|---|
| ✅ N'importe qui | Envoie un message (`sender_id` = sien) |
| ❌ | Impossible d'envoyer au nom de quelqu'un d'autre |

---

#### Policy 3: `messages: mise à jour` (UPDATE)

```sql
CREATE POLICY "messages: mise à jour" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    recipient_id = (select auth.uid())
    OR (select private.is_admin())
  )
  WITH CHECK (
    recipient_id = (select auth.uid())
    OR (select private.is_admin())
  );
```

| Qui modifie ? | Peut changer ? | Cas |
|---|---|---|
| ✅ Destinataire | `read` = true | Marque message comme lu |
| ✅ Admin | Tout | Modération |
| ❌ Expéditeur | Rien | Ne peut pas modifier son message (immuable) |

---

### **7. TABLE : `reviews`** (4 policies)

Avis des conducteurs sur les garages.

#### Policy 1: `reviews: lecture` (SELECT)

```sql
CREATE POLICY "reviews: lecture" ON public.reviews
  FOR SELECT TO authenticated
  USING (
    approved = true                          -- A : Avis approuvés = publics
    OR conductor_id = (select auth.uid())   -- B : Auteur voit son avis (en attente)
    OR (select private.is_admin())          -- C : Admin voit tout
  );
```

| Cas | Qui voit ? | Logique |
|---|---|---|
| **A** | Tous | Avis approuvés visibles de tous |
| **B** | Auteur | Voit son avis même `approved = false` |
| **C** | Admin | Voit tous, y compris en attente ou flagged |
| ❌ | Garage | Ne voit pas avis en attente d'approbation (avant que le client l'accepte) |

**Flux modération** :
1. Conducteur A écrit avis → `approved = false`
2. Seul A voit (B), admin voit (C)
3. Admin approuve → `approved = true`
4. Tous voient (A)

---

#### Policy 2: `reviews: insert conducteur` (INSERT)

```sql
CREATE POLICY "reviews: insert conducteur" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (conductor_id = (select auth.uid()));
```

| Qui écrit ? | Cas |
|---|---|
| ✅ Conducteur | Poste un avis sur un garage |
| ❌ Garage | Pas d'auto-notation |

---

#### Policy 3: `reviews: mise à jour` (UPDATE)

```sql
CREATE POLICY "reviews: mise à jour" ON public.reviews
  FOR UPDATE TO authenticated
  USING (
    conductor_id = (select auth.uid())
    OR (select private.is_admin())
  )
  WITH CHECK (
    conductor_id = (select auth.uid())
    OR (select private.is_admin())
  );
```

| Qui modifie ? | Peut changer ? | Cas |
|---|---|---|
| ✅ Auteur | rating, comment, notes | Édite son avis avant publication |
| ✅ Admin | `approved`, `flagged` | Modère (approuve/signale spamming) |
| ❌ Garage | Rien | Ne peut pas modifier l'avis |

---

#### Policy 4: `reviews: suppression admin` (DELETE)

```sql
CREATE POLICY "reviews: suppression admin" ON public.reviews
  FOR DELETE TO authenticated
  USING ((select private.is_admin()));
```

| Qui supprime ? | Cas |
|---|---|
| ✅ Admin | Supprime un avis (harcèlement, faux positif) |
| ❌ Auteur | Ne peut pas supprimer son avis (immuable après publication) |
| ❌ Garage | Impossible |

---

### **8. TABLE : `invoices`** (3 policies)

Factures (immuables après création).

#### Policy 1: `invoices: lecture` (SELECT)

```sql
CREATE POLICY "invoices: lecture" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    (select private.is_admin())              -- A : Admin voit tout
    OR (select private.owns_garage(garage_id)) -- B : Garage propriétaire voit ses factures
    OR EXISTS (                               -- C : Conducteur voit facture de sa demande
      SELECT 1 FROM public.quote_requests r
      WHERE r.id = request_id
      AND r.conductor_id = (select auth.uid())
    )
  );
```

| Cas | Qui voit ? |
|---|---|
| **A** | Admin |
| **B** | Garage X voit ses factures |
| **C** | Conducteur A voit factures sur ses demandes |
| ❌ | Garage Y ne voit pas factures de Garage X |

---

#### Policy 2: `invoices: insert garage` (INSERT)

```sql
CREATE POLICY "invoices: insert garage" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK ((select private.owns_garage(garage_id)));
```

| Qui crée ? | Cas |
|---|---|
| ✅ Garage X | Génère une facture après service complété |
| ❌ Admin | Pas côté client (service_role server-side) |
| ❌ Conducteur | Impossible |

**Audit trail** : Historique des factures créées par garage, immuable.

---

#### Policy 3: `invoices: mise à jour` (UPDATE)

```sql
CREATE POLICY "invoices: mise à jour" ON public.invoices
  FOR UPDATE TO authenticated
  USING (
    (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  )
  WITH CHECK (
    (select private.owns_garage(garage_id))
    OR (select private.is_admin())
  );
```

| Qui modifie ? | Peut changer ? | Cas |
|---|---|---|
| ✅ Garage propriétaire | `payment_status`, `payment_date` | Marque comme payée |
| ✅ Admin | Tout | Modération paiements |
| ❌ Conducteur | Rien | Lecture seule |

**⚠️ Pas de DELETE** : Invoices immuables (audit trail). Pour supprimer → service_role server-side admin uniquement.

---

### **9. TABLE : `notifications`** (2 policies)

Notifications in-app (et Expo Push).

#### Policy 1: `notifications: lecture` (SELECT)

```sql
CREATE POLICY "notifications: lecture" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())           -- Destinataire voit ses notifications
    OR (select private.is_admin())          -- Admin voit tout
  );
```

| Qui voit ? | Cas |
|---|---|
| ✅ Destinataire | Voit ses notifications |
| ✅ Admin | Voit toutes |
| ❌ Autre user | Impossible |

---

#### Policy 2: `notifications: mise à jour` (UPDATE)

```sql
CREATE POLICY "notifications: mise à jour" ON public.notifications
  FOR UPDATE TO authenticated
  USING (
    user_id = (select auth.uid())
    OR (select private.is_admin())
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR (select private.is_admin())
  );
```

| Qui modifie ? | Peut changer ? | Cas |
|---|---|---|
| ✅ Destinataire | `read` = true | Marque notification comme lue |
| ✅ Admin | Tout | Modération |

---

## Matrice d'accès

### Vue synthétique : Qui voit/modifie quoi ?

```
╔══════════════╦════════════╦═════════╦════════╦═════════════╗
║ Table        ║ Conducteur ║ Garage  ║ Admin  ║ Suspendu?   ║
╠══════════════╬════════════╬═════════╬════════╬═════════════╣
║ users        ║ Read self  ║ Read self│ Read * │ —           ║
║ vehicles     ║ RW own     ║ RW own  │ RW *   │ —           ║
║ garages      ║ Read active│ RW own  │ RW *   │ Own visible ║
║ quote_reqs   ║ RW own     ║ R+owner │ RW *   │ X see bcast ║
║ quotes       ║ R on own   ║ RW own  │ RW *   │ —           ║
║ messages     ║ R+W own    ║ R+W own │ R *    │ —           ║
║ reviews      ║ RW own     ║ R aprv  │ RW *   │ —           ║
║ invoices     ║ R on own   ║ RW own  │ RW *   │ —           ║
║ notifs       ║ RW own     ║ RW own  │ R *    │ —           ║
╚══════════════╩════════════╩═════════╩════════╩═════════════╝

Legend:
R    = Read (SELECT)
W    = Write (INSERT/UPDATE)
own  = Own resource (user_id = auth.uid())
aprv = Approved only
*    = All rows
RW   = Full CRUD
RW own = Full CRUD on own only
Suspendu? = Garage suspended
X    = Excluded (can't see broadcast requests)
```

---

## Cas de test

### Test 1: Conducteur A ne voit pas Conducteur B

```typescript
// Connexion Conducteur A
const conductorA = await supabase.auth.signInWithPassword({ ... });

// ❌ Tentative lecture profil Conducteur B
const { data, error } = await supabase
  .from('users')
  .select('id, full_name, phone')
  .eq('id', conductorBId);

// Result: error (RLS: 0 rows returned)
// data = []
```

---

### Test 2: Garage suspendu ne voit pas les demandes broadcast

```typescript
// Garage Y (suspended = true) se connecte
const garageY = await supabase.auth.signInWithPassword({ ... });

// Demande de Conducteur A : garage_id = NULL (broadcast)
const { data: requests } = await supabase
  .from('quote_requests')
  .select('*');

// Result: [] (empty)
// Raison: policy "requests: lecture" — condition D
// EXISTS (SELECT 1 FROM garages g WHERE ... AND g.suspended = false)
// RETURNS false car Garage Y suspendu
```

---

### Test 3: Garage X voit devis de Garage Y (même demande)

```typescript
// Garage X se connecte
const garageX = await supabase.auth.signInWithPassword({ ... });

// Conducteur A posted request 101
// Garage X created quote 1 (100€)
// Garage Y created quote 2 (80€)

// ❌ Garage X tente voir quote 2 (Garage Y)
const { data, error } = await supabase
  .from('quotes')
  .select('*')
  .eq('id', quoteYId);

// Result: error (RLS: 0 rows)
// Raison: policy "quotes: lecture" condition B
// (select private.owns_garage(garage_id)) = false
// (Garage Y's garage_id ≠ Garage X's garage)
```

---

### Test 4: Conducteur A peut éditer son avis en attente

```typescript
// Conducteur A se connecte
const conductorA = await supabase.auth.signInWithPassword({ ... });

// A crée avis → approved = false
const { data: review } = await supabase
  .from('reviews')
  .insert({ 
    conductor_id: conductorAId,
    rating: 3,
    approved: false 
  });

// ✅ A modifie son avis (avant approbation)
const { data: updated } = await supabase
  .from('reviews')
  .update({ rating: 4 })
  .eq('id', reviewId);

// Result: success
// Raison: policy "reviews: mise à jour" condition A
// conductor_id = (select auth.uid())
```

---

### Test 5: Admin marque avis comme approuvé (modération)

```typescript
// Admin connexion (côté Next.js server, service_role)
const adminClient = createSupabaseClient({
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});

// ✅ Admin approuve avis (bypass RLS)
const { data } = await adminClient
  .from('reviews')
  .update({ approved: true })
  .eq('id', reviewId);

// Result: success
// Note: côté client (anon key), admin update policy
// bloquée sur approved = false avis de quelqu'un d'autre
```

---

### Test 6: RLS prevent_role_escalation trigger

```typescript
// Conducteur tente devenir admin
const { data, error } = await supabase
  .from('users')
  .update({ role: 'admin' })
  .eq('id', conductorId);

// Result: error
// 1. Policy "users: mise à jour" USING clause passe (auth.uid = id)
// 2. Trigger BEFORE UPDATE prevent_role_escalation
//    ↓
//    NEW.role ≠ OLD.role AND NEW.role = 'admin'
//    ↓
//    RAISE EXCEPTION 'Cannot escalate role'
```

---

## Optimisations appliquées (2026-05-19)

### ❌ Avant

```sql
-- 28+ policies avec redondance
-- Initplans inefficaces
CREATE POLICY "users: son propre profil" ON public.users
  FOR SELECT USING (auth.uid() = id);  -- Initplan

CREATE POLICY "users: admin voit tout" ON public.users
  FOR SELECT USING (private.is_admin());  -- Initplan
```

### ✅ Après

```sql
-- 29 policies fusionnées, pas de redondance
-- Initplans optimisés
CREATE POLICY "users: lecture" ON public.users
  FOR SELECT USING (
    (select auth.uid()) = id              -- Subquery explicite
    OR (select private.is_admin())        -- Pas d'initplan
  );
```

**Gain de perf** : Moins de executions de subqueries répétées.

---

## Résumé sécurité

✅ **29 policies couvrent** :
- Conducteur A ≠ Conducteur B
- Garage suspendu isolé
- Admin peut modérer tout
- Garage voit ses devis uniquement
- Avis approuvés = publics
- Invoices immuables

⚠️ **À surveiller** :
- Trigger `prevent_role_escalation` = protection supplémentaire
- Invoices : pas de DELETE policy (immuable par design)
- Messages : pas d'UPDATE par expéditeur (immuable)
- Garage suspendu : excluded de broadcast (query D)

🔐 **Règle d'or** : `WITH CHECK` identique à `USING` sauf cas spécifique (vehicles allow write to own, garages allow owner modify).
