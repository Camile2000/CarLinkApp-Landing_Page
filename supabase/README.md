# Supabase — Base de données CarLink

## Mise en place

1. Crée un projet sur https://supabase.com — région **Europe (West)**, mot de passe DB fort.
2. Dashboard → **SQL Editor → New query**.
3. Colle tout [`schema.sql`](./schema.sql) → **Run**.
4. (Optionnel) Colle [`seed.sql`](./seed.sql) pour des données de test.
5. Dashboard → **Settings → API** → copie `Project URL` et `anon public key` dans les `.env`.

## Contenu du schéma

Aligné sur la spec « Architecture du projet » du directeur technique.

- **9 tables** : `users`, `vehicles`, `garages`, `quote_requests`, `quotes`,
  `messages`, `reviews`, `invoices`, `notifications`.
- **5 enums** : `user_role` (conductor/garage/admin), `app_language`,
  `request_urgency`, `request_status`, `payment_status`.
- **Triggers** :
  - `updated_at` automatique (`users`, `garages`).
  - Création automatique du profil à l'inscription (`auth.users` → `public.users`).
  - Recalcul de `rating` / `review_count` du garage à chaque avis (avis approuvés uniquement).
  - Passage automatique d'une demande en `quoted` au premier devis.
- **RLS activé sur toutes les tables** : un utilisateur ne voit que ses données,
  un garagiste voit les demandes qui le concernent, l'admin voit tout
  (helpers `is_admin()` et `owns_garage()`).
- **Realtime** activé sur `messages`, `quote_requests`, `notifications`.
- **Storage** : bucket unique `photos` (avatars, garages, véhicules, demandes,
  interventions, documents) + policies.

## Créer un admin

Après inscription d'un compte, dans le SQL Editor :

```sql
update public.users set role = 'admin' where id = '<uuid-du-user>';
```

## Réinitialiser (dev uniquement)

```sql
-- ⚠️ Détruit toutes les données applicatives
drop schema public cascade;
create schema public;
-- puis ré-exécuter schema.sql
```
