-- =============================================================
-- CarLink — Données de test (dev uniquement)
-- À exécuter APRÈS schema.sql et APRÈS avoir créé des comptes
-- via l'app (les profils sont créés automatiquement à l'inscription).
--
-- Remplace les UUID ci-dessous par de vrais id de public.profiles.
-- =============================================================

-- Exemple : promouvoir un compte en admin
-- update public.profiles set role = 'admin'
-- where id = '00000000-0000-0000-0000-000000000000';

-- Exemple : un garage de démonstration (à approuver depuis le dashboard admin)
-- insert into public.garages (owner_id, name, description, city, latitude, longitude, phone, services, status)
-- values (
--   '11111111-1111-1111-1111-111111111111',
--   'Garage Bonamoussadi',
--   'Mécanique générale, vidange, freins',
--   'Douala',
--   4.0911, 9.7679,
--   '+237600000000',
--   array['vidange','freins','diagnostic'],
--   'approved'
-- );

-- Exemple : un véhicule
-- insert into public.vehicles (owner_id, make, model, year, license_plate)
-- values ('22222222-2222-2222-2222-222222222222', 'Toyota', 'Corolla', 2015, 'LT-1234-AB');

-- Exemple : une demande de service
-- insert into public.service_requests (driver_id, title, description, category, status)
-- values ('22222222-2222-2222-2222-222222222222',
--         'Bruit au freinage', 'Grincement à l''avant droit', 'freins', 'open');
