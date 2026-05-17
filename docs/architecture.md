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

1. **Inscription** → trigger `handle_new_user` crée automatiquement une ligne `profiles` (rôle par défaut `driver`, ou `garage_owner` via metadata).
2. **Garage** → un `garage_owner` crée un `garages` en statut `pending`. L'admin l'`approuve` depuis `apps/web/app/admin/garages`.
3. **Demande** → un `driver` crée un `service_requests` (`open`). Visible des garages approuvés (policy RLS).
4. **Devis** → un garage crée un `quotes` ; le trigger `mark_request_quoted` passe la demande en `quoted`.
5. **Chat** → à l'acceptation d'un devis, une `conversations` est ouverte ; les `messages` circulent via Supabase **Realtime**.
6. **Avis** → après `completed`, le `driver` poste un `reviews` ; le trigger `recalc_garage_rating` met à jour `rating_avg`/`rating_count`.
7. **Notifications** → lignes `notifications` (in-app) + Expo Push (semaine 8).

## 4. Modèle de données

11 tables, 5 enums — détail dans [`supabase/schema.sql`](../supabase/schema.sql). Relations principales :

```
profiles 1───* vehicles
profiles 1───* garages 1───* garage_photos
profiles 1───* service_requests *───1 vehicles
service_requests 1───* request_photos
service_requests 1───* quotes *───1 garages
service_requests 1───* conversations 1───* messages
garages 1───* reviews *───1 profiles
profiles 1───* notifications
```

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
