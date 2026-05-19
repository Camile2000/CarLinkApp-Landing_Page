# Architecture technique — CarLink

Ce document détaille comment les briques se connectent. Vue produit dans le [README](../README.md).

## 1. Principe

Un seul code base TypeScript, un seul backend (Supabase), deux frontends :

- **`apps/mobile`** — Expo / React Native / expo-router. Utilisé par les conducteurs et garagistes (iOS, Android, et web Expo).
- **`apps/web-admin`** — Next.js (App Router). Site marketing + dashboard admin.
- **`packages/shared`** — types DB + factory client Supabase, consommé par les deux apps via le workspace npm `@carlink/shared`.

## 2. Flux de données

```
Utilisateur (mobile)            Admin (web)
      │                              │
      ▼                              ▼
 supabase-js  ───────────────►  supabase-js
      │                              │
      └──────────────┬───────────────┘
                     ▼
              Supabase (PostgREST + Auth + Realtime + Storage)
                     │
                     ▼
               PostgreSQL + RLS
```

Toute la sécurité repose sur **Row Level Security** côté Postgres : même si la clé `anon` est publique (embarquée dans l'app), un utilisateur ne peut lire/écrire que ce que les *policies* autorisent. Les helpers RLS (`private.is_admin()`, `private.owns_garage()`) sont dans le schéma **`private`**, non exposé par PostgREST (voir §5 Sécurité). Le dashboard admin utilise le client `service_role` (bypass RLS, server-side uniquement).

## 3. Parcours métier

1. **Inscription** → trigger `handle_new_user` crée automatiquement une ligne `users` (rôle `conductor` par défaut, ou `garage` via metadata, langue FR/EN).
2. **Garage** → un `garage` crée son `garages`. L'admin le **certifie** / vérifie les docs depuis `apps/web-admin/app/admin/garages` ; il peut le **suspendre**.
3. **Demande** → un `conductor` crée un `quote_requests` (`pending`) avec type de service, urgence et photos. Visible des garages non suspendus (policy RLS).
4. **Devis** → un garage crée un `quotes` structuré (diagnostic + pièces + main d'œuvre + délai) ; le trigger `mark_request_quoted` passe la demande en `quoted`.
5. **Match** → le conducteur compare et accepte ; `quote_requests.status` → `accepted` (`accepted_at`).
6. **Suivi + Chat** → le garage fait évoluer le statut (`in_progress` → `completed`) ; les `messages` circulent via Supabase **Realtime** ; photos avant/après dans Storage.
7. **Facture** → à `completed`, génération d'un `invoices` ; paiement CinetPay (phase 2).
8. **Avis** → le `conductor` poste un `reviews` (note + 6 critères) ; le trigger `recalc_garage_rating` met à jour `rating`/`review_count` (avis approuvés uniquement). L'admin modère via `approved`/`flagged`.
9. **Notifications** → lignes `notifications` (in-app) + Expo Push.

## 4. Modèle de données

9 tables, 5 enums — détail dans [`supabase/schema.sql`](../supabase/schema.sql). Relations principales :

```
users (conductor | garage | admin)
  ├─ vehicles            (1 user → N vehicles)
  ├─ quote_requests      (1 conductor → N requests)
  │    ├─ quotes         (1 request → N quotes *───1 garages)
  │    ├─ messages       (1 request → N messages)
  │    ├─ reviews        (1 request → 1 review)
  │    └─ invoices       (1 request → N invoices)
  ├─ garages             (1 user → 1 garage)
  │    ├─ quote_requests (1 garage → N requests)
  │    └─ reviews        (1 garage → N reviews)
  └─ notifications       (1 user → N notifications)
```

Voir aussi la roadmap 16 semaines : [`roadmap.md`](./roadmap.md).

## 5. Architecture de sécurité

### Schéma `private` (hors API REST)

Les fonctions helper utilisées dans les RLS policies sont dans le schéma **`private`**, non exposé par PostgREST :

| Fonction | Rôle |
|---|---|
| `private.is_admin()` | Vérifie si `auth.uid()` est admin |
| `private.owns_garage(uuid)` | Vérifie si `auth.uid()` possède ce garage |
| `private.prevent_role_escalation()` | Trigger BEFORE UPDATE — bloque les changements de rôle hors admin |

**Règle** : toute nouvelle fonction helper RLS va dans `private`, jamais dans `public`.

### Vue `public.user_profiles`

Vue `security_invoker` exposant les colonnes non sensibles :
`id, full_name, role, city, language, avatar_url, created_at, updated_at`

**Règle app** : utiliser `user_profiles` pour l'affichage d'autres utilisateurs. Ne jamais SELECT `users.phone` ou `users.email` d'un autre utilisateur depuis le client.

### Storage — 2 buckets

| Bucket | Visibilité | Usage |
|---|---|---|
| `photos` | public | Avatars, photos demandes/chat/interventions |
| `documents` | privé | Pièces vérification garage (CNI, registre) |

Convention de chemins : `photos/avatars/{uid}/`, `photos/requests/{id}/`, `photos/messages/{id}/`, `photos/interventions/{id}/`, `documents/garages/{garage_id}/`.

### Clients Supabase

| Client | Fichier | Clé | Usage |
|---|---|---|---|
| Browser | `apps/web-admin/lib/supabase.ts` | `anon` | Client Components, pages publiques |
| Server | `apps/web-admin/lib/supabase-server.ts` | `service_role` | Server Components admin, bypass RLS |
| Mobile | `apps/mobile/src/lib/supabase.ts` | `anon` | App Expo, soumis à RLS |

## 6. Conventions de code

- TypeScript strict partout.
- Le client Supabase n'est **jamais** instancié en dur : toujours via `createSupabaseClient` de `@carlink/shared`.
- Les types DB (`User`, `Garage`, …) sont la source de vérité côté front et doivent rester alignés avec `schema.sql`.
- Variables d'env : `EXPO_PUBLIC_*` (mobile), `NEXT_PUBLIC_*` (web client), sans préfixe = serveur uniquement.
- `user_profiles` (vue) pour les lookups cross-user, `users` uniquement pour le profil propre.

## 7. Workflow Git & déploiement

### Branches

```
claude/mobile          ┐
claude/web-admin       ├──► PR (lint+typecheck) ──► dev
claude/backend-supabase┘                              │
                                                      ▼
                                                  staging  (QA humaine)
                                                      │
                                                      ▼
                                                   main  ──► Vercel (prod)
```

**Règles strictes :**
- Claude ne pousse **jamais** directement sur `main`, `staging` ou `dev`.
- Chaque PR déclenche la CI complète : security audit + lint + typecheck (shared, web, mobile) + build web.
- La CI bloque le merge si audit CVE échoue, lint échoue, ou typecheck échoue.
- Les PRs Supabase résument les changements de schéma, RLS et risques.

### Cibles de déploiement

| Cible | Outil | Déclencheur |
|---|---|---|
| Web + admin | Vercel (root `apps/web-admin`) | PR mergée sur `main` |
| DB | Supabase (SQL Editor) | manuel via `schema.sql` |
| Mobile | EAS Build | manuel (semaine 16) |

## 8. Évolutions prévues

- Paiement CinetPay (Orange/MTN Money) → table `payments` + webhooks (semaine 11+).
- Géo-recherche garages : passer `latitude/longitude` à PostGIS / `earthdistance` si volume.
- Migrations versionnées via Supabase CLI quand le schéma se stabilise.
