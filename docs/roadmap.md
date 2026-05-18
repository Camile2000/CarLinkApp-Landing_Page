# 🗓 CarLink — Roadmap technique 16 semaines

> Source : `CarLink_Roadmap_16semaines.xlsx` (généré le 16/05/2026).
> Cible MVP : **15 garages + 25 conducteurs** · Budget **< 50 $/mois**.

## Jalons clés

- **S4** — Devis MVP lancé
- **S8** — Système d'avis complet
- **S10** — Dashboard admin opérationnel
- **S16** — Soft launch public (MVP en production)

## Détail semaine par semaine

| # | Sem. | Mois | Livrables | Dépendances | Risques |
|---|------|------|-----------|-------------|---------|
| 1 | S1 | M1 | Setup infra (GitHub, Supabase, Expo, Cursor) · Schéma DB PostgreSQL · Auth Supabase connectée | Node.js, Git installés | Délais setup |
| 2 | S2 | M1 | Inscription conducteur par téléphone · Inscription garagiste · Pages profil · **[L] Authentification MVP** | Supabase Auth + RLS | Validation phone |
| 3 | S3 | M1 | Ajout véhicule (marque, modèle, immat) · Liste garages + filtres · Profil garage détaillé · **[L] Recherche garages** | DB garages, Supabase Storage | Photos garages |
| 4 | S4 | M1 | Google Maps (carte + liste) · Formulaire demande devis · Upload photos · **[L] Devis demandé** | Google Maps API key | Localisation |
| 5 | S5 | M2 | Garage reçoit demandes · Envoi devis structuré (diag, pièces, MO, délai) · Statuts garage · **[L] Garage peut répondre** | Quote table + schema | Complexité devis |
| 6 | S6 | M2 | Conducteur compare devis · Acceptation devis · Notif push au garage · **[L] Match conducteur-garage** | Expo Push + Realtime | Push notifications |
| 7 | S7 | M2 | 5 statuts (envoyé → terminé) · MAJ par le garage · Notif push à chaque changement · Chat temps réel · **[L] Suivi + Chat** | Messages table, Realtime | Latence Realtime |
| 8 | S8 | M2 | Avis vérifiés (1-5) · 6 critères · Note garage auto · Historique avis · **[L] Système avis complet** | Reviews table + policies | Avis frauduleux |
| 9 | S9 | M3 | Push optimisées · Chat archivé · Photos avant/après garage · Test fermé 3 garages · **[L] Bêta démarre** | 3 garages à Douala | Recrutement garages |
| 10 | S10 | M3 | Dashboard admin Next.js (stats, garages, avis) · Approuve garages · Suspend garage · Modération avis · **[L] Admin pilote** | Next.js + Supabase RLS | Permissions admin |
| 11 | S11 | M3 | CinetPay (sandbox) · Form Orange/MTN Money · Webhooks paiement · Facture numérique · **[L] Infra paiement prête** | Compte CinetPay | Paiement africain |
| 12 | S12 | M3 | Photos intervention garage · Conducteur voit photos live · Facture PDF auto · **[L] Traçabilité 100%** | Photos storage | Espace storage |
| 13 | S13 | M4 | Interface bilingue FR/EN · Switch langue partout · Polish UX · Animations · **[L] App présentable** | Librairie i18n | Traductions |
| 14 | S14 | M4 | 3 garages accès complet · Conducteurs réels testent · Feedback terrain · Doc cas tests · **[L] Preuves terrain** | 3 garages + conducteurs | Feedback utilisateur |
| 15 | S15 | M4 | Bug fixes critiques · Perf mobile · Optimisation requêtes DB · Audit RLS · **[L] App stable** | Tests utilisateurs S14 | Bugs bloquants |
| 16 | S16 | M4 | Publication Google Play · Prep App Store (iOS S17-18) · Dashboard stats prod · **[L] MVP EN PRODUCTION** | Apple Developer 99 $ (optionnel) | Validation App Store |

_**[L]** = livrable de fin de semaine._

## Branches de développement par phase

| Phase | Semaines | Branches actives |
|---|---|---|
| Fondations | S1–S4 | `claude/backend-supabase`, `claude/mobile` |
| Cœur métier | S5–S8 | `claude/mobile`, `claude/backend-supabase` |
| Pilotage | S9–S10 | `claude/web-admin`, `claude/mobile` |
| Paiement & traçabilité | S11–S12 | `claude/backend-supabase`, `claude/mobile` |
| Finition | S13–S15 | `claude/mobile`, `claude/web-admin` |
| Lancement | S16 | toutes → `staging` → `main` |

Chaque livrable de fin de semaine **[L]** donne lieu à une PR `claude/…` → `dev`, validée après `lint` + `typecheck` (+ `build:web` si web).

## Résumé exécutif

| Élément | Détail |
|---|---|
| Stack principal | Expo (iOS+Android) + Next.js + Supabase + GitHub + Vercel |
| Coût 4 mois | < 50 $/mois (gratuit jusqu'à usage élevé) |
| MVP deliverables | 15 garages certifiés + 25 conducteurs + 10-20 avis vérifiés |
| Jalons clés | S4 Devis · S8 Avis · S10 Admin · S16 Soft launch |
| Risques critiques | Recrutement garages terrain · Push notifications · Paiement africain |
| Responsable | Toi (code avec Claude / Cursor) |
