# Architecture technique — CarLink

Ce document détaille comment les briques se connectent. Vue produit dans le [README](../README.md).

## 1. Principe

Un seul code base TypeScript, un seul backend (Supabase), deux frontends :

- **`apps/mobile`** — Expo / React Native / expo-router. Utilisé par les conducteurs et garagistes (iOS, Android, et web Expo).
- **`apps/web`** — Next.js (App Router). Site marketing + dashboard admin.
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

Toute la sécurité repose sur **Row Level Security** côté Postgres : même si la clé `anon` est publique (embarquée dans l'app), un utilisateur ne peut lire/écrire que ce que les *policies* autorisent. Le dashboard admin s'appuie sur le helper SQL `is_admin()`.

## 3. Parcours métier

1. **Inscription** → trigger `handle_new_user` crée automatiquement une ligne `users` (rôle `conductor` par défaut, ou `garage` via metadata, langue FR/EN).
2. **Garage** → un `garage` crée son `garages`. L'admin le **certifie** / vérifie les docs depuis `apps/web/app/admin/garages` ; il peut le **suspendre**.
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

## 5. Conventions de code

- TypeScript strict partout.
- Le client Supabase n'est **jamais** instancié en dur : toujours via `createSupabaseClient` de `@carlink/shared`.
- Les types DB (`Profile`, `Garage`, …) sont la source de vérité côté front et doivent rester alignés avec `schema.sql`.
- Variables d'env : `EXPO_PUBLIC_*` (mobile), `NEXT_PUBLIC_*` (web client), sans préfixe = serveur uniquement.

## 6. Déploiement

| Cible | Outil | Déclencheur |
|---|---|---|
| Web + admin | Vercel (root `apps/web`) | `git push` |
| DB | Supabase (SQL Editor) | manuel via `schema.sql` |
| Mobile | EAS Build | manuel (semaine 16) |

## 7. Évolutions prévues

- Paiement CinetPay (Orange/MTN Money) → table `payments` + webhooks (semaine 11+).
- Géo-recherche garages : passer `latitude/longitude` à PostGIS / `earthdistance` si volume.
- Migrations versionnées via Supabase CLI quand le schéma se stabilise.
