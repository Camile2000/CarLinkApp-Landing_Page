# Supabase — Base de données CarLink

## Mise en place

1. Crée un projet sur https://supabase.com — région **Europe (West)**, mot de passe DB fort.
2. Dashboard → **SQL Editor → New query**.
3. Colle tout [`schema.sql`](./schema.sql) → **Run**.
4. (Optionnel) Colle [`seed.sql`](./seed.sql) pour des données de test.
5. Dashboard → **Settings → API** → copie `Project URL` et `anon public key` dans les `.env`.

## Contenu du schéma

- **11 tables** : `profiles`, `vehicles`, `garages`, `garage_photos`, `service_requests`,
  `request_photos`, `quotes`, `conversations`, `messages`, `reviews`, `notifications`.
- **5 enums** : rôles, statuts garage/demande/devis, types de notification.
- **Triggers** :
  - `updated_at` automatique sur les tables principales.
  - Création automatique du profil à l'inscription (`auth.users` → `profiles`).
  - Recalcul de `rating_avg` / `rating_count` du garage à chaque avis.
  - Passage automatique d'une demande en `quoted` au premier devis.
- **RLS activé sur toutes les tables** : un utilisateur ne voit que ses données,
  les garages approuvés voient les demandes ouvertes, l'admin voit tout
  (helper `is_admin()`).
- **Realtime** activé sur `messages`, `conversations`, `notifications` (chat & notifs live).
- **Storage** : buckets `avatars`, `garages`, `vehicles`, `requests` + policies.

## Créer un admin

Après inscription d'un compte, dans le SQL Editor :

```sql
update public.profiles set role = 'admin' where id = '<uuid-du-user>';
```

## Réinitialiser (dev uniquement)

```sql
-- ⚠️ Détruit toutes les données applicatives
drop schema public cascade;
create schema public;
-- puis ré-exécuter schema.sql
```
