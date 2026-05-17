# 🚗 CarLink

> Plateforme qui met en relation les **conducteurs** et les **garages** au Cameroun.
> Un conducteur décrit son problème → les garages proches envoient des devis → le conducteur choisit, échange par chat, puis note le garage.

**Stack :** Expo (mobile iOS/Android/Web) · Next.js (web + dashboard admin) · Supabase (DB + Auth + Storage + Realtime) · GitHub · Vercel

---

## 📋 Sommaire

1. [Vue d'ensemble](#-vue-densemble)
2. [Architecture](#-architecture)
3. [Structure du monorepo](#-structure-du-monorepo)
4. [Prérequis](#-prérequis)
5. [Installation](#-installation)
6. [Configuration des variables d'environnement](#-configuration-des-variables-denvironnement)
7. [Base de données Supabase](#-base-de-données-supabase)
8. [Lancer le projet](#-lancer-le-projet)
9. [Scripts utiles](#-scripts-utiles)
10. [Déploiement](#-déploiement)
11. [Services externes](#-services-externes)
12. [Roadmap MVP](#-roadmap-mvp)
13. [Conventions & bonnes pratiques](#-conventions--bonnes-pratiques)
14. [Dépannage](#-dépannage)
15. [Liens utiles](#-liens-utiles)

---

## 🎯 Vue d'ensemble

CarLink est une marketplace de services automobiles. Cible MVP : **15 garages + 25 conducteurs**, budget **< 50 $/mois**, livraison en **10 semaines**.

**Acteurs :**

| Rôle | Application | Ce qu'il fait |
|---|---|---|
| **Conducteur** (`driver`) | App mobile Expo | Crée des demandes de réparation, reçoit des devis, chatte, note les garages |
| **Garagiste** (`garage_owner`) | App mobile Expo | Gère son garage, répond aux demandes par des devis, chatte |
| **Admin** (`admin`) | Dashboard Next.js | Approuve/suspend les garages, modère les avis, voit les stats |

---

## 🏗 Architecture

```
                ┌────────────────────────┐
                │      Conducteurs        │
                │      Garagistes         │
                └───────────┬────────────┘
                            │
                ┌───────────▼────────────┐
                │   App mobile (Expo)     │  apps/mobile
                │  iOS · Android · Web    │
                └───────────┬────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐  ┌────────▼────────┐  ┌───────▼────────┐
│   Supabase    │  │   Google Maps   │  │   Expo Push    │
│  PostgreSQL   │  │   (carte)       │  │ (notifications)│
│  Auth         │  └─────────────────┘  └────────────────┘
│  Storage      │
│  Realtime     │◄─────────────┐
│  RLS          │              │
└───────┬───────┘              │
        │                      │
┌───────▼────────────┐  ┌──────┴───────────┐
│  Dashboard admin   │  │   Site web       │
│  Next.js           │  │   Next.js        │  apps/web
│  (modération)      │  │   (marketing)    │
└───────┬────────────┘  └──────────────────┘
        │
   ┌────▼─────┐     ┌──────────┐
   │  GitHub  │────►│  Vercel  │  (déploiement auto)
   └──────────┘     └──────────┘
```

Les deux applications (mobile + web) partagent **la même base Supabase** et le **client partagé** dans `packages/shared`.

---

## 📁 Structure du monorepo

```
AppCarLink/
├── README.md                  ← ce fichier
├── package.json               ← workspaces npm (racine)
├── .gitignore
├── .env.example               ← modèle des variables globales
│
├── apps/
│   ├── mobile/                ← App Expo (React Native)
│   │   ├── app/               ← écrans (expo-router)
│   │   ├── src/lib/           ← client Supabase mobile
│   │   ├── app.json
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── web/                   ← Next.js (marketing + dashboard admin)
│       ├── app/
│       │   ├── page.tsx       ← landing marketing
│       │   └── admin/         ← dashboard, garages, reviews
│       ├── lib/               ← client Supabase web
│       ├── next.config.js
│       ├── package.json
│       └── .env.example
│
├── packages/
│   └── shared/                ← code partagé mobile ↔ web
│       ├── src/
│       │   ├── client.ts      ← factory client Supabase
│       │   └── types.ts       ← types TypeScript du schéma DB
│       └── package.json
│
├── supabase/
│   ├── schema.sql             ← schéma complet (tables + RLS + triggers)
│   ├── seed.sql               ← données de test
│   └── README.md              ← instructions DB
│
└── docs/
    └── architecture.md        ← détail technique de l'architecture
```

---

## ✅ Prérequis

| Outil | Version | Lien |
|---|---|---|
| Node.js | LTS (≥ 20) | https://nodejs.org |
| npm | ≥ 10 | inclus avec Node |
| Git | ≥ 2.40 | https://git-scm.com |
| Expo Go (téléphone) | dernière | App Store / Google Play |
| Compte Supabase | — | https://supabase.com |
| Compte Vercel | — | https://vercel.com |

Vérifie :

```bash
node --version   # v20.x ou +
npm --version    # 10.x ou +
git --version
```

---

## 🚀 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/camile2000/appcarlink.git
cd appcarlink

# 2. Installer toutes les dépendances du monorepo
npm install

# 3. Copier les modèles d'environnement
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env.local
```

> `npm install` à la racine installe les dépendances de **tous** les workspaces (`apps/*`, `packages/*`).

---

## 🔐 Configuration des variables d'environnement

Récupère tes clés dans **Supabase → Settings → API**.

### `apps/mobile/.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=          # semaine 3
```

### `apps/web/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # côté serveur uniquement, dashboard admin
```

> ⚠️ Ne **jamais** committer les fichiers `.env` / `.env.local` réels. Seuls les `.env.example` sont versionnés (voir `.gitignore`).

---

## 🗄 Base de données Supabase

1. Crée un projet sur https://supabase.com (région **Europe**, la plus proche du Cameroun).
2. Dans le dashboard : **SQL Editor → New query**.
3. Colle le contenu de [`supabase/schema.sql`](./supabase/schema.sql) et exécute.
4. (Optionnel) Colle [`supabase/seed.sql`](./supabase/seed.sql) pour des données de test.

Le schéma crée :

| Table | Rôle |
|---|---|
| `users` | Utilisateurs (extension de `auth.users`) : rôle `conductor`/`garage`/`admin`, langue FR/EN |
| `vehicles` | Véhicules des conducteurs (marque, modèle, immat, carburant…) |
| `garages` | Garages : spécialités, certification, docs vérifiés, suspension, note |
| `quote_requests` | Demandes de devis (type de service, urgence, photos, statut) |
| `quotes` | Devis structurés (diagnostic, pièces, main d'œuvre, délai, garantie) |
| `messages` | Chat temps réel attaché à une demande |
| `reviews` | Avis vérifiés — 6 critères, modération (`approved`/`flagged`) |
| `invoices` | Factures (montant, statut de paiement) |
| `notifications` | Notifications in-app / Expo Push |

> Schéma aligné sur la spec « Architecture du projet » du directeur technique.

Sécurité : **Row Level Security activé sur toutes les tables** (chaque utilisateur ne voit que ses données ; l'admin voit tout). Détails dans [`supabase/README.md`](./supabase/README.md).

---

## ▶️ Lancer le projet

### App mobile (Expo)

```bash
npm run mobile
# ou
cd apps/mobile && npm start
```

Scanne le QR code avec **Expo Go**. L'app se recharge à chaque sauvegarde.

### Web + dashboard admin (Next.js)

```bash
npm run web
# ou
cd apps/web && npm run dev
```

Ouvre http://localhost:3000 (marketing) et http://localhost:3000/admin (dashboard).

---

## 🛠 Scripts utiles

Depuis la racine :

| Commande | Effet |
|---|---|
| `npm run mobile` | Lance l'app Expo |
| `npm run web` | Lance Next.js en dev |
| `npm run lint` | Lint tous les workspaces |
| `npm run typecheck` | Vérifie les types TypeScript |
| `npm run build:web` | Build de production Next.js |

---

## 🌐 Déploiement

### Web (Vercel)

1. https://vercel.com → **Import Project** → repo GitHub.
2. **Root Directory** : `apps/web`.
3. Renseigne les variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy. Chaque `git push` redéploie automatiquement.

### Mobile (EAS Build — semaine 16)

```bash
cd apps/mobile
npx eas build --platform android        # APK / AAB de test
npx eas submit --platform android --latest
```

iOS nécessite un compte Apple Developer (99 $/an) — **uniquement à partir de la semaine 14**.

---

## 🔌 Services externes

| Service | Quand | Rôle | Coût |
|---|---|---|---|
| Google Maps API | Semaine 3 | Carte des garages | Gratuit < 28 000 req/mois |
| Expo Push | Semaine 8 | Notifications push | Gratuit |
| CinetPay | Semaine 11+ | Orange Money / MTN Money | 1–2 % / transaction |

---

## 🗓 Roadmap MVP

Plan détaillé semaine par semaine (16 semaines) : [`docs/roadmap.md`](./docs/roadmap.md).

| Phase | Semaines | Objectif |
|---|---|---|
| Fondations | S1–S4 | Setup, schéma DB, auth, véhicules, recherche garages, **devis MVP** |
| Cœur métier | S5–S8 | Devis structurés, match, suivi + chat, **système d'avis** |
| Pilotage | S9–S10 | Bêta fermée, **dashboard admin** |
| Paiement & traçabilité | S11–S12 | CinetPay (sandbox), factures, photos intervention |
| Finition | S13–S15 | Bilingue FR/EN, polish UX, tests terrain, audit RLS |
| Lancement | S16 | Google Play, soft launch — **MVP en production** |

---

## 📐 Conventions & bonnes pratiques

- **Branches** : `claude/*` pour le dev assisté, `main` protégée, déploiement auto via Vercel.
- **Commits** : messages clairs et descriptifs (`feat:`, `fix:`, `chore:` …).
- **Secrets** : jamais dans le code ni dans Git. Toujours via `.env`.
- **TypeScript** partout (mobile, web, packages partagés).
- **Client Supabase** : importé depuis `@carlink/shared`, jamais dupliqué.
- ❌ Ne pas coder iOS/Android séparément · ❌ pas de Firebase · ❌ pas d'outils superflus.

---

## 🩺 Dépannage

| Problème | Piste |
|---|---|
| Expo ne se connecte pas au téléphone | Même réseau Wi-Fi · `npx expo start --tunnel` |
| `Invalid API key` Supabase | Vérifie `.env`, redémarre le serveur |
| RLS bloque une requête | Vérifie les policies dans Supabase → Authentication → Policies |
| Next.js ne voit pas les env vars | Préfixe `NEXT_PUBLIC_` + redémarrer `npm run dev` |
| Build mobile échoue | https://docs.expo.dev/debugging/runtime-issues/ |

---

## 🔗 Liens utiles

- Expo : https://docs.expo.dev
- Supabase + Expo : https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- Next.js : https://nextjs.org/docs
- Supabase Auth : https://supabase.com/docs/guides/auth
- Supabase Realtime : https://supabase.com/docs/guides/realtime
- Vercel : https://vercel.com/docs

---

_CarLink MVP — code unique, multi-plateforme. Voir [`docs/architecture.md`](./docs/architecture.md) pour le détail technique._
