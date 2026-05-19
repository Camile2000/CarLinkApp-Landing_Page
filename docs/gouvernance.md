# Gouvernance technique CarLink

> **Source de vérité pour les agents de contrôle, les reviewers et les développeurs.**
> Ce document formalise les règles non négociables du projet CarLink.
> Il est maintenu dans GitHub et doit être respecté à chaque PR, migration et déploiement.

---

## 1. Doctrine générale

- **Aucune modification directe en production.** Pas de changement de table, policy RLS ou configuration Supabase sans passer par : branche → PR → CI verte → merge.
- **Aucun push direct sur `main`, `staging`, `dev`.**
- **Une PR = un objectif.** Pas de PR qui mélange mobile + web + RLS + storage + paiement sauf nécessité absolue et justifiée.
- **Le vrai risque est souvent invisible** : une policy RLS trop ouverte, une clé exposée, une table sans index, une migration non versionnée, une requête lente à 1 000 utilisateurs.

---

## 2. Branches

| Branche | Usage |
|---------|-------|
| `main` | Production uniquement |
| `staging` | Test quasi réel avant production |
| `dev` | Intégration des fonctionnalités validées |
| `claude/mobile` | Développement mobile Expo |
| `claude/web-admin` | Dashboard admin Next.js |
| `claude/backend-supabase` | Base de données, RLS, migrations |
| `fix/...` | Correction urgente |
| `feature/...` | Nouvelle fonctionnalité précise |

**Règles strictes sur `main`, `staging`, `dev` :**
- Interdire les push directs.
- Exiger une Pull Request avec CI verte.
- Exiger lint + typecheck + build:web si web touché.
- Exiger la résolution des conversations avant merge.
- Interdire les force push.

---

## 3. Template obligatoire de Pull Request

Chaque PR doit répondre à ces 7 questions :

1. **Qu'est-ce qui a été modifié ?**
2. **Pourquoi cette modification est nécessaire ?**
3. **Quelles pages ou fonctionnalités sont impactées ?**
4. **Quelles tables Supabase sont impactées ?**
5. **Quelles policies RLS sont impactées ou créées ?**
6. **Quels tests ont été faits ?** (manuel ou automatique)
7. **Quel risque peut apparaître après merge ?**

**Si la PR touche le backend Supabase, ajouter :**
- Tables modifiées.
- Nouvelles colonnes et leur type.
- Index ajoutés.
- Policies RLS créées / modifiées / supprimées.
- Impact sur `auth`, `storage`, `realtime`, `admin`, `mobile`.
- Fichier de migration dans `supabase/migrations/` — obligatoire.

---

## 4. CODEOWNERS — chemins sensibles

| Chemin | Raison |
|--------|--------|
| `/supabase/` | Migrations + RLS → revue backend/sécurité obligatoire |
| `/packages/shared/` | Impact mobile + web → tout changement casse les deux |
| `/apps/web/app/admin/` | Zone admin → droits critiques |
| `/.github/` | Contrôle CI, workflows, règles de sécurité |

---

## 5. Règles sécurité absolues

1. **Aucun secret dans le code ou git.** Jamais de clé, token, URL projet réelle.
2. **RLS activé sur 100 % des tables.** Toute nouvelle table = RLS ON + policies `WITH CHECK`.
3. **Helpers RLS dans le schéma `private`**, jamais `public`.
4. **`service_role` server-side uniquement.** Jamais dans Expo, jamais en Client Component.
5. **Zod sur toute entrée externe** (API, formulaire, upload, webhook).
6. **Pas de PII d'autrui exposée.** Lookups cross-user via `user_profiles` uniquement.
7. **Grants SQL + policies RLS ensemble.** Les deux doivent être alignés.

---

## 6. Règles base de données

### Migrations
- **Toute modification de schéma = fichier `supabase/migrations/YYYYMMDDHHMMSS_description.sql`**, committé dans GitHub.
- Jamais de modification directe de la base Supabase sans migration correspondante.
- Une seule personne pousse les migrations en production à un moment donné.

### Index obligatoires
- `quote_requests.conductor_id`, `quote_requests.status`, `quote_requests.created_at`
- `quotes.request_id`, `quotes.garage_id`
- `messages.request_id`, `messages.created_at`
- `reviews.garage_id`, `reviews.approved`
- `notifications.user_id`
- Toute colonne utilisée dans une policy RLS doit être indexée.

### Grants + RLS
- Les grants disent ce qu'un rôle peut techniquement faire.
- Les policies RLS disent sur quelles lignes il peut le faire.
- Les deux doivent être définis et audités ensemble.

### Storage — buckets séparés
| Bucket | Accès |
|--------|-------|
| `garage-photos` | Lecture publique (marketing) |
| `quote-request-photos` | Privé — conducteur propriétaire + garage assigné |
| `intervention-before-after` | Privé — garage assigné + conducteur concerné |
| `invoices` | Privé — URL signée uniquement |
| `user-avatars` | Lecture publique |

Règle : jamais de listing global d'un bucket. Jamais un seul bucket fourre-tout.

---

## 7. Code — standards qualité

### TypeScript
- `strict: true` partout — interdire les `any` sauf cas exceptionnel justifié dans un commentaire.
- Types viennent de Supabase (`database.types.ts` généré) — jamais de types front qui divergent.
- Pas de `select *` sur les écrans importants — sélectionner uniquement les colonnes nécessaires.

### Client Supabase
- Une seule factory dans `packages/shared/src/supabase/`.
- Jamais `createClient(...)` directement dans un écran mobile ou une page web.
- Clients distincts : `createBrowserClient` (Next.js client), `createServerClient` (Next.js server/API), `createMobileClient` (Expo).

### Validation Zod
- Tout ce qui vient de l'extérieur (formulaire, upload, webhook, réponse API tierce) est validé par un schéma Zod dans `packages/shared/src/validators/`.
- Jamais de confiance aveugle sur des données reçues.

### Performance
- Pagination avec `limit/range` — jamais de chargement complet d'une liste.
- Filtrer côté base, pas côté front.
- RPC ou vues pour les écrans complexes avec plusieurs jointures.
- `EXPLAIN ANALYZE` sur les requêtes suspectes avant déploiement.

---

## 8. Realtime

- Activer uniquement sur les vrais besoins : messages d'une demande précise, notifications d'un utilisateur précis, changement de statut d'une intervention précise.
- Ne pas activer Realtime sur toutes les tables.
- Chat : messages paginés, index sur `(request_id, created_at)`, contrôle RLS strict (conducteur concerné + garage assigné + admin uniquement).

---

## 9. Environnements

| Env | Supabase | Données | Accès |
|-----|----------|---------|-------|
| Local | Supabase CLI + seed | Fictives | Développeur |
| Staging | Instance staging | Faux conducteurs/garages | CI + QA |
| Production | Instance prod | Réelles | Restreint + logs + backups |

**Secrets GitHub par environnement :**
- `staging` : `SUPABASE_URL_STAGING`, `SUPABASE_ANON_KEY_STAGING`
- `production` : `SUPABASE_URL_PROD`, `SUPABASE_ANON_KEY_PROD`, `SUPABASE_SERVICE_ROLE_KEY_PROD`

---

## 10. Tests minimum avant merge

### Auth
- Inscription conducteur, inscription garage, connexion, déconnexion, session expirée.

### RLS (tester avec plusieurs comptes)
- Conducteur A ne voit pas les données de conducteur B.
- Garage A ne modifie pas les devis de garage B.
- Garage suspendu ne reçoit plus de demandes.
- Utilisateur non admin ne peut pas modérer les avis ni certifier un garage.

### Storage
- Upload autorisé si propriétaire, refusé sinon.
- Listing global du bucket interdit.
- Factures accessibles uniquement via URL signée.

### Performance
- Liste des garages paginée.
- Messages paginés par demande.
- Dashboard admin ne charge pas toute la base.

---

## 11. Checklist hebdomadaire

### Début de semaine
- [ ] Livrable prévu dans la roadmap ?
- [ ] Branches actives confirmées ?
- [ ] Issues GitHub définies ?
- [ ] Tables impactées identifiées ?
- [ ] Risques RLS définis ?

### Fin de semaine
- [ ] PR vers `dev` avec CI verte.
- [ ] `npm run lint` + `npm run typecheck` + `npm run build:web` si web touché.
- [ ] Test manuel mobile + admin.
- [ ] Test RLS minimum (conducteur A ≠ conducteur B).
- [ ] Vérification Supabase logs (erreurs, accès anormaux).
- [ ] Performance Advisor + Security Advisor lancés.
- [ ] Aucune alerte Dependabot / CodeQL non traitée.
- [ ] Merge vers `staging` seulement si tout est stable.

### Avant production
- [ ] Audit RLS complet (toutes les tables, toutes les policies).
- [ ] Audit Storage complet (tous les buckets, tous les accès).
- [ ] Audit secrets GitHub (aucune clé en clair).
- [ ] MFA activée sur Supabase + GitHub.
- [ ] SSL enforcement activé sur Supabase.
- [ ] Backups vérifiés.
- [ ] Performance Advisor + Security Advisor sans alerte critique.
- [ ] Test avec : conducteur A, conducteur B, garage A, garage B, admin, utilisateur suspendu, utilisateur non connecté.

---

## 12. Erreurs critiques à éviter

| # | Erreur | Conséquence | Règle |
|---|--------|-------------|-------|
| 1 | Modifier la base directement sans migration | Casse la traçabilité, impossible de reproduire | Toujours via `supabase/migrations/` |
| 2 | `service_role` côté client/mobile | Contourne RLS — faille critique | Serveur uniquement |
| 3 | Policies trop larges (`all authenticated`) | Tout utilisateur voit tout | Policies granulaires par rôle |
| 4 | Un seul bucket Storage pour tout | Les droits d'accès ne sont pas les mêmes | Buckets séparés par type |
| 5 | Ne pas tester avec plusieurs comptes | Les vrais bugs RLS se voient à 2 users | Tester avec A, B, admin, suspendu |
| 6 | `select *` partout | Lent + expose des données inutiles | Colonnes explicites |
| 7 | `createClient` dans chaque fichier | Duplication de clés, risque d'exposition | Factory centralisée |
| 8 | Types front divergents du schéma DB | Bugs silencieux après migration | Générer `database.types.ts` |
| 9 | Variables `${{ github.* }}` dans `run:` | Shell injection détectée par Semgrep | Passer via `env:` |
| 10 | PR qui touche tout à la fois | Impossible à reviewer correctement | Une PR = un objectif |

---

## 13. Standard final — les 10 lois du projet

1. **Aucun code sans PR.**
2. **Aucune PR sans CI verte et test minimum.**
3. **Aucune table sans RLS + grants.**
4. **Aucune policy sans justification métier.**
5. **Aucune modification Supabase sans migration versionnée.**
6. **Aucune clé secrète dans le front ou le mobile.**
7. **Aucun `select *` sur les écrans importants.**
8. **Aucune fonctionnalité critique sans test conducteur / garage / admin.**
9. **Aucun merge en production sans passage staging.**
10. **Aucune optimisation laissée à la fin si la structure est déjà mauvaise.**
