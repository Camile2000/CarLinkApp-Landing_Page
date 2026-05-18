# Supabase — Base de données CarLink

## Mise en place

1. Crée un projet sur https://supabase.com — région **Europe (West)**, mot de passe DB fort.
2. Dashboard → **SQL Editor → New query**.
3. Colle tout [`schema.sql`](./schema.sql) → **Run**.
4. (Optionnel) Colle [`seed.sql`](./seed.sql) pour des données de test.
5. Dashboard → **Settings → API** → copie `Project URL` et `anon public key` dans les `.env`.

## Contenu du schéma

### Tables (9)

| Table | Rôle |
|---|---|
| `users` | Profil applicatif lié à `auth.users` : rôle, langue, avatar |
| `vehicles` | Véhicules des conducteurs |
| `garages` | Garages : spécialités, certification, suspension, note |
| `quote_requests` | Demandes de devis avec statut et urgence |
| `quotes` | Devis structurés (diagnostic, pièces, MO, garantie) |
| `messages` | Chat temps réel attaché à une demande |
| `reviews` | Avis vérifiés — 6 critères, modération avant publication |
| `invoices` | Factures (immuables — pas de suppression hors admin) |
| `notifications` | Notifications in-app / Expo Push |

### Enums (5)
`user_role` · `app_language` · `request_urgency` · `request_status` · `payment_status`

### Triggers (5)

| Trigger | Déclencheur | Effet |
|---|---|---|
| `trg_users_updated` | BEFORE UPDATE users | Met à jour `updated_at` |
| `trg_garages_updated` | BEFORE UPDATE garages | Met à jour `updated_at` |
| `on_auth_user_created` | AFTER INSERT auth.users | Crée le profil `public.users` |
| `trg_reviews_recalc` | AFTER INSERT/UPDATE/DELETE reviews | Recalcule `rating` et `review_count` du garage (avis approuvés uniquement) |
| `trg_quote_marks_request` | AFTER INSERT quotes | Passe la demande en `quoted` au premier devis |
| `trg_prevent_role_escalation` | BEFORE UPDATE users | Bloque le changement de rôle par l'utilisateur lui-même |

## Architecture de sécurité

### Schéma `private` (fonctions hors API)

Les fonctions helper RLS sont dans le schéma **`private`**, non exposé par PostgREST :
- `private.is_admin()` — vérifie si l'utilisateur courant est admin
- `private.owns_garage(uuid)` — vérifie si l'utilisateur courant possède ce garage
- `private.prevent_role_escalation()` — trigger bloquant l'élévation de privilège

**Règle : toute nouvelle fonction helper RLS doit être dans `private`, jamais dans `public`.**

### Row Level Security

RLS activé sur les 9 tables. Principes appliqués :
- Chaque policy a un `WITH CHECK` explicite sur les opérations d'écriture
- `anon` ne peut lire aucune donnée utilisateur (emails, téléphones)
- Les factures ne peuvent pas être supprimées par les garages (audit trail)
- Les avis sont créés avec `approved = false` et attendent la validation admin
- Les changements de rôle sont bloqués côté DB (trigger + policy)

### Vue `public.user_profiles`

Vue `security_invoker` exposant uniquement les colonnes non sensibles :
`id, full_name, role, city, language, avatar_url, created_at, updated_at`

**Règle app : utiliser `user_profiles` pour afficher des infos d'autres utilisateurs, jamais la table `users` directement.**

## Storage — 2 buckets

| Bucket | Visibilité | Taille max | Types | Usage |
|---|---|---|---|---|
| `photos` | **public** | 5 Mo | JPEG, PNG, WebP | Avatars, photos demandes, chat, interventions |
| `documents` | **privé** | 10 Mo | JPEG, PNG, WebP, PDF | Pièces de vérification garage |

### Convention de chemins

```
photos/
  avatars/{user_id}/           → photo de profil (confinée au propre UID)
  requests/{request_id}/       → photos de la demande
  messages/{request_id}/       → pièces jointes chat
  interventions/{request_id}/  → photos de fin d'intervention

documents/
  garages/{garage_id}/         → CNI, registre de commerce (propriétaire ou admin)
```

## Realtime

Activé sur : `messages`, `quote_requests`, `notifications`.

## Créer un admin

Après inscription d'un compte, dans le SQL Editor :

```sql
UPDATE public.users SET role = 'admin' WHERE id = '<uuid-du-user>';
```

## Réinitialiser (dev uniquement)

```sql
-- ⚠️ Détruit toutes les données applicatives
DROP SCHEMA public CASCADE;
DROP SCHEMA private CASCADE;
CREATE SCHEMA public;
-- puis ré-exécuter schema.sql
```
