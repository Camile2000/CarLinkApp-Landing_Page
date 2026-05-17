-- =============================================================
-- CarLink — Données de test (dev uniquement)
-- À exécuter APRÈS schema.sql et APRÈS avoir créé des comptes
-- via l'app (les profils public.users sont créés automatiquement
-- à l'inscription par le trigger handle_new_user).
--
-- Remplace les UUID par de vrais id de public.users.
-- =============================================================

-- Promouvoir un compte en admin
-- update public.users set role = 'admin'
-- where id = '00000000-0000-0000-0000-000000000000';

-- Marquer un compte comme garagiste
-- update public.users set role = 'garage'
-- where id = '11111111-1111-1111-1111-111111111111';

-- Garage de démonstration (à certifier depuis le dashboard admin)
-- insert into public.garages
--   (user_id, garage_name, city, neighborhood, latitude, longitude,
--    phone, specialties, is_certified, documents_verified)
-- values (
--   '11111111-1111-1111-1111-111111111111',
--   'Garage Bonamoussadi', 'Douala', 'Bonamoussadi',
--   4.0911, 9.7679, '+237600000000',
--   array['batterie','pneus','diagnostic'],
--   true, true
-- );

-- Véhicule
-- insert into public.vehicles (user_id, brand, model, year, license_plate, fuel_type)
-- values ('22222222-2222-2222-2222-222222222222',
--         'Toyota', 'Corolla', 2015, 'LT-1234-AB', 'essence');

-- Demande de devis
-- insert into public.quote_requests
--   (conductor_id, service_type, description, urgency, status)
-- values ('22222222-2222-2222-2222-222222222222',
--         'batterie', 'Voiture ne démarre plus', 'high', 'pending');
