-- =============================================================
-- Tests RLS minimum — table garages
-- =============================================================
-- À exécuter avec : supabase test db (pgTAP) OU manuellement en
-- ouvrant deux sessions distinctes via SET request.jwt.claims.
-- Référence : CLAUDE.md §"Tests minimum obligatoires avant merge"
-- =============================================================

BEGIN;

-- ── Pré-requis : extension pgTAP ──────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(6);

-- ── Setup : 2 users garages + 1 conducteur ────────────────────
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'g1@test.local',
    '{"role":"garage","full_name":"Garage 1"}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'g2@test.local',
    '{"role":"garage","full_name":"Garage 2"}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'c1@test.local',
    '{"role":"conductor","full_name":"Conducteur 1"}'::jsonb);

-- Le trigger handle_new_user crée automatiquement les lignes public.users.

-- ── Test 1 : un garagiste peut créer SON garage ───────────────
SET LOCAL request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

SELECT lives_ok(
  $$INSERT INTO public.garages (user_id, garage_name, city, phone, specialties)
    VALUES ('11111111-1111-1111-1111-111111111111', 'G1', 'Casa', '+212600000001', ARRAY['Mécanique'])$$,
  'Garage 1 peut créer son propre garage'
);

-- ── Test 2 : un garagiste ne peut PAS créer un garage pour un autre ──
SELECT throws_ok(
  $$INSERT INTO public.garages (user_id, garage_name, city, phone, specialties)
    VALUES ('22222222-2222-2222-2222-222222222222', 'Fake', 'Casa', '+212600000001', ARRAY['Mécanique'])$$,
  '42501',
  NULL,
  'Garage 1 ne peut pas créer un garage au nom de Garage 2'
);

-- ── Test 3 : un conducteur ne peut PAS créer un garage ────────
SET LOCAL request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

SELECT throws_ok(
  $$INSERT INTO public.garages (user_id, garage_name, city, phone, specialties)
    VALUES ('33333333-3333-3333-3333-333333333333', 'C1G', 'Casa', '+212600000001', ARRAY['Mécanique'])$$,
  '42501',
  NULL,
  'Conducteur ne peut pas créer un garage (RLS bloque)'
);

-- ── Test 4 : UNIQUE(user_id) — un garagiste ne peut pas créer 2 garages ──
SET LOCAL request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

SELECT throws_ok(
  $$INSERT INTO public.garages (user_id, garage_name, city, phone, specialties)
    VALUES ('11111111-1111-1111-1111-111111111111', 'G1bis', 'Casa', '+212600000001', ARRAY['Carrosserie'])$$,
  '23505',
  NULL,
  'Garage 1 ne peut pas créer un 2e garage (UNIQUE user_id)'
);

-- ── Test 5 : un garagiste ne peut PAS supprimer son garage (admin only) ──
SELECT throws_ok(
  $$DELETE FROM public.garages WHERE user_id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  NULL,
  'Suppression de garage interdite au propriétaire'
);

-- ── Test 6 : un garage non suspendu est visible à tous ────────
SET LOCAL request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

SELECT ok(
  (SELECT COUNT(*) > 0 FROM public.garages
   WHERE user_id = '11111111-1111-1111-1111-111111111111'),
  'Conducteur voit les garages non suspendus'
);

SELECT * FROM finish();

ROLLBACK;
