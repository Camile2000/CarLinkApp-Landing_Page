# ROADMAP-TECHNIQUE.md — Architecture et organisation 16 semaines

> **Source de vérité technique.** Vue d'ensemble de l'architecture, des trois surfaces de dev distinctes, de leurs dépendances, et des sprints de livraison.

**Durée totale :** 16 semaines (4 mois). **Déploiement :** staging → prod par étapes.

---

## 0. Architecture globale — Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE (Backend)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ PostgreSQL (schema public) + RLS (29 policies, 9 tables) │   │
│  │  ├─ users, vehicles, garages, quote_requests,           │   │
│  │  ├─ quotes, messages, reviews, invoices, notifications  │   │
│  │  └─ Auth (Supabase Auth), Storage (public + private)    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Realtime (messages, notifications en temps réel)        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         ▲                    ▲                           ▲
         │ (RLS, JWT)         │ (RLS, JWT)               │ (Anon key)
         │                    │                           │
    ┌────────────┐    ┌──────────────┐           ┌──────────────┐
    │  MOBILE    │    │  WEB ADMIN   │           │ LANDING PAGE │
    │  (Expo)    │    │  (Next.js)   │           │  (Next.js)   │
    │            │    │              │           │              │
    │ Auth user: │    │ Auth admin:  │           │ No auth       │
    │ - Driver   │    │ - is_admin   │           │ - Public      │
    │ - Garage   │    │   check via  │           │ - Static      │
    │            │    │   RLS        │           │ - CMS (later) │
    │ Features:  │    │              │           │              │
    │ • Auth     │    │ Features:    │           │ Features:    │
    │ • Browse   │    │ • Dashboard  │           │ • Hero       │
    │ • Quotes   │    │ • Garages    │           │ • How it     │
    │ • Messages │    │ • Moderation │           │   works      │
    │ • Reviews  │    │ • Reports    │           │ • Download   │
    │ • Payments │    │              │           │ • Contact    │
    └────────────┘    └──────────────┘           └──────────────┘
```

**Points clés :**
- **Mobile + Admin web** : authentification JWT (Supabase Auth) + RLS protégé tout accès
- **Landing page** : aucune authentification, contenu statique/public, pas de Backend-as-a-Service critique
- **Toutes les 3 surfaces** : hébergement sur Vercel (Next.js) ou EAS (Expo) — domaines séparés

---

## 1. Stratégie de dev — Ordre logique

### Phase 1 : **Backend + Admin Web (Semaines 1-6)**
**Pourquoi d'abord ?** Admin = levier de contrôle, testing lab, validation RLS.

- Supabase schema finalisé (RLS validé)
- Admin web : scaffold, auth, pages CRUD
- Tests RLS manuels

**Livrables :**
- ✅ Base de données prod-ready
- ✅ Admin web fonctionnel (dashboard, garages, reviews)
- ✅ RLS éprouvée sur vraies données

---

### Phase 2 : **Mobile App (Semaines 7-12)**
**Pourquoi après ?** Backend stable, mobile réutilise les endpoints, tests plus rapides.

- Expo: nav, auth, écrans conducteur/garage
- Intégration Supabase (même backend que admin)
- Testing: RLS conducteur A ≠ B, suspension, messages Realtime

**Livrables :**
- ✅ Mobile app Alpha (tous devices iOS/Android)
- ✅ Auth, quotes, messages fonctionnels
- ✅ Payments intégrés (CinetPay)

---

### Phase 3 : **Landing Page (Semaines 13-16)**
**Pourquoi en dernier ?** Landing page est indépendante, aucune logique métier urgente, pur marketing.

- Next.js: design, copywriting, SEO
- Analytics (Vercel Analytics ou Plausible)
- CDN + edge caching

**Livrables :**
- ✅ Landing page en prod
- ✅ Conversions trackées (install mobile)
- ✅ SEO optimisé (Côte d'Ivoire / Afrique francophone)

---

## 2. Features par surface

### 2.1 — MOBILE APP (Expo)

#### Conducteur (Driver)
| Feature | Détail | Semaine | RLS impact |
|---------|--------|---------|-----------|
| **Auth** | Signup phone+OTP, login, logout, reset password | 7-8 | `is_driver=true` |
| **Profil** | Photo, nom, véhicule, localisation | 8 | Affiche que son propre profil |
| **Browse garages** | Géolocalisation, filtres (distance, rating, tags) | 8-9 | Voit garages non-suspendus, ratings publics |
| **Devis** | Créer demande, voir devis reçus, accepter, rejeter | 9-10 | `quote_requests.owner_id = auth.uid()` |
| **Messages** | Chat temps réel (Supabase Realtime) | 10-11 | Voit que ses messages, garage peut répondre |
| **Paiement** | Mobile Money (Orange/MTN via CinetPay), invoice généré | 11-12 | RLS `can_pay` = conducteur owner |
| **Avis** | Noter un service, lire avis autres conducteurs | 12 | Voit que avis approuvés, son propre en draft |

#### Garage (Mechanic)
| Feature | Détail | Semaine | RLS impact |
|---------|--------|---------|-----------|
| **Auth** | Signup email+password, login, logout | 7-8 | `is_mechanic=true` |
| **Profil** | Photo, infos (lieu, spécialités, heures), documents | 8 | Affiche que son propre profil |
| **Devis entrants** | Lister demandes, détails conducteur, accepter/refuser | 9 | `owner_id = auth.uid()` |
| **Devis sortants** | Envoyer devis avec prix/délai, annuler | 9-10 | SELECT demandes publiques, INSERT propres devis |
| **Messages** | Répondre conducteurs, Realtime | 10-11 | Voit que ses demandes |
| **Avis reçus** | Lire évaluations, répondre | 12 | Voit avis approuvés + les siens en draft |

---

### 2.2 — WEB ADMIN (Next.js)

| Feature | Détail | Semaine | RLS impact |
|---------|--------|---------|-----------|
| **Dashboard** | Stats (users, garages, quotes, revenue) | 1-2 | `is_admin=true` via RLS |
| **Garages CRUD** | Lister, voir détails, certifier, suspendre, filtres | 2-3 | Admin peut SELECT/UPDATE tous garages |
| **Conducteurs CRUD** | Lister, view, ban | 3 | Admin peut voir tous |
| **Devis** | Lister, voir détails, stats par garage | 3-4 | Admin voit tous |
| **Modération avis** | Lister avis flaggés, approve/reject, stats | 4-5 | Admin peut UPDATE `approved` |
| **Messages privés** | Affichage logs si problème (data privacy check) | 5 | Admin logs uniquement, PII masquée |
| **Rapports** | PDF exports (garages, revenus, fraude) | 5-6 | Admin only, pas de SELECT `*` |
| **Settings** | Clés API, webhooks, features toggles (future) | 6 | Super-admin only |

---

### 2.3 — LANDING PAGE (Next.js)

| Feature | Détail | Semaine | Static/Dynamic |
|---------|--------|---------|-----------------|
| **Hero** | Logo, tagline, CTA "Télécharger app", hero image | 13 | Static |
| **How it works** | 3 étapes (Driver/Garage), diagramme, vidéo (future) | 13 | Static |
| **Features** | Cartes (Chat, Avis, Paiement, Support), benefits | 14 | Static |
| **Testimonials** | 3-5 avis utilisateurs (hardcodés au début) | 14 | Semi-static (future: API) |
| **Download CTA** | QR code (iOS TestFlight / Android APK), play store links | 14 | Static |
| **FAQ** | Accordion, questions driver/garage/commun | 14 | Static (future: CMS) |
| **Contact** | Formulaire email (Resend ou Nodemailer), plan contact | 15 | Semi-dynamic |
| **Footer** | Links (privacy, terms, socials) | 15 | Static |
| **SEO** | Meta tags (fr_FR, og:image, structured data) | 15 | Static |
| **Blog (future)** | Articles, announcements (CMS Supabase + Next.js ISR) | 16+ | Future |

---

## 3. Dépendances entre surfaces

```
Week 1-6:  Backend + Admin
   ├─ RLS finalisée (29 policies)
   ├─ Auth (admin role check)
   ├─ Admin pages (scaffold, CRUD)
   └─ Tests RLS manuels
      │
      └──→ Week 7-12: Mobile (hérite du backend + RLS)
         ├─ Expo setup, navigation
         ├─ Auth (driver/garage)
         ├─ RLS test: conducteur A ≠ B
         ├─ Realtime (messages)
         └─ Payments (CinetPay)
            │
            └──→ Week 13-16: Landing page (indépendant du backend)
               ├─ Marketing site
               ├─ CTA vers app download
               ├─ SEO optimisé
               └─ Analytics setup
```

**Blockers critiques :**
- Mobile **bloquée** sur backend stable (RLS doit être validée en prod)
- Admin **débloque** backend (premiers utilisateurs = admins testant RLS)
- Landing **ne bloque rien** (statique, peut être en parallelel semaine 10+)

---

## 4. Sprints détaillés — 16 semaines

### **SPRINT 1-2 : Backend + Admin setup (Semaines 1-2)**

#### Objectif
- Supabase schema finalisé + RLS
- Admin auth + dashboard

#### Tâches
| # | Tâche | Owner | Durée | Statut |
|---|-------|-------|-------|--------|
| 1.1 | Supabase project créé, schema initial (users, garages, etc.) | Backend | 3j | — |
| 1.2 | RLS policies 29 au complet + helpers (private schema) | Backend | 3j | — |
| 1.3 | Storage buckets (public: photos, private: invoices/docs) | Backend | 1j | — |
| 1.4 | Admin auth (Supabase Auth, `is_admin` role, RLS check) | Web | 2j | — |
| 1.5 | Admin dashboard scaffold (next/app, layout, nav) | Web | 2j | — |
| 1.6 | Admin dashboard overview (stats query) | Web | 1j | — |
| 1.7 | Database seed (10 garages test, 5 users test) | Backend | 1j | — |
| 1.8 | CI/CD vert (lint, typecheck, build-web passe) | DevOps | 2j | — |

**Définition de "Done" Sprint 1-2 :**
- [ ] Schema Supabase en prod + backed up
- [ ] 29 RLS policies testées (manual SELECT, INSERT, UPDATE, DELETE par role)
- [ ] Admin auth OK, `is_admin=false` ne voit rien, `is_admin=true` voit tout
- [ ] Dashboard affiche stats correctes (count users, garages, etc.)
- [ ] Build-web passe, déployé sur Vercel preview

---

### **SPRINT 3-4 : Admin CRUD garages + reviews (Semaines 3-4)**

#### Objectif
- Admin peut lister, certifier, suspendre garages
- Admin peut modérer (approve/reject) avis

#### Tâches
| # | Tâche | Owner | Durée | Statut |
|---|-------|-------|-------|--------|
| 3.1 | Admin garages page: SELECT, filtres (ville, suspended, etc.) | Web | 2j | — |
| 3.2 | Admin garages detail: voir tous les champs, edit (certif, suspend) | Web | 2j | — |
| 3.3 | RLS test: suspended garage ne reçoit plus demandes (mobile test later) | Backend | 1j | — |
| 3.4 | Admin reviews page: SELECT, filtres (flagged, approved) | Web | 2j | — |
| 3.5 | Admin reviews action: approve/reject, update `approved` flag | Web | 1j | — |
| 3.6 | RLS test: rejected review disappears from public (mobile test later) | Backend | 1j | — |
| 3.7 | Admin conducteurs page: list, view, ban (future: delete) | Web | 1j | — |

**Définition de "Done" Sprint 3-4 :**
- [ ] Admin garages CRUD full (list, detail, edit)
- [ ] Admin reviews moderation full (approve, reject)
- [ ] Tous les RLS checks manuels testés (admin A ne voit que ses données propres)
- [ ] Build-web vert, déployé

---

### **SPRINT 5-6 : Admin rapports + backend complete (Semaines 5-6)**

#### Objectif
- Admin rapports + exports
- Backend finalisé (storage, webhooks, auth flows)
- Pre-launch checklist

#### Tâches
| # | Tâche | Owner | Durée | Statut |
|---|-------|-------|-------|--------|
| 5.1 | Admin devis page: SELECT all quotes, filtres (date, garage, statut) | Web | 1j | — |
| 5.2 | Admin rapports: PDF export garages, revenus (lib: pdfkit ou html2pdf) | Web | 2j | — |
| 5.3 | Admin settings page: clés API (view only), webhook logs | Web | 1j | — |
| 5.4 | Storage: test upload/download photo garage + invoice PDF | Backend | 1j | — |
| 5.5 | Email notifications (Resend): devis créé, message reçu, avis flaggé (stubs) | Backend | 2j | — |
| 5.6 | Realtime test: setup Supabase subscription sur messages | Backend | 1j | — |
| 5.7 | Security pre-launch: SECURITY.md checklist complet | DevOps | 1j | — |
| 5.8 | Load test: Supabase CPU/bandwidth sur RLS queries | DevOps | 1j | — |

**Définition de "Done" Sprint 5-6 :**
- [ ] Admin Web 100% fonctionnel, stylisé, responsive
- [ ] Tous rapports générés
- [ ] Storage tested
- [ ] Email infra ready (Resend API key, templates)
- [ ] SECURITY.md checklist ✅
- [ ] Admin web déployé en staging prod
- [ ] Mobile team peut démarrer semaine 7

---

### **SPRINT 7-8 : Mobile auth + profils (Semaines 7-8)**

#### Objectif
- Expo setup, navigation, auth driver/garage
- Profils conducteur + garage

#### Tâches
| # | Tâche | Owner | Durée | Statut |
|---|-------|-------|-------|--------|
| 7.1 | Expo init, TypeScript setup, @carlink/shared import | Mobile | 1j | — |
| 7.2 | Navigation (React Navigation v6): driver stack, garage stack, auth | Mobile | 2j | — |
| 7.3 | Auth screen: signup phone+OTP (Supabase Auth SMS), login | Mobile | 2j | — |
| 7.4 | Auth flow: user type select (driver or garage), role set in JWT | Mobile | 1j | — |
| 7.5 | Profile screen: view self, edit photo/name/vehicle, upload storage | Mobile | 2j | — |
| 7.6 | RLS test: conducteur A ne peut pas SEE conducteur B profile | Mobile | 1j | — |

**Définition de "Done" Sprint 7-8 :**
- [ ] Auth flow end-to-end tested (signup→profile→main)
- [ ] OTP SMS reçu (test avec Supabase demo phone)
- [ ] Profiles affichent correctement, photos uploadées en storage
- [ ] RLS tested: conducteur A ne voit que son profil
- [ ] Build Expo OK, APK généré

---

### **SPRINT 9-10 : Mobile garages + devis (Semaines 9-10)**

#### Objectif
- Conducteur: browse garages, créer devis
- Garage: recevoir devis, envoyer devis

#### Tâches
| # | Tâche | Owner | Durée | Statut |
|---|-------|-------|-------|--------|
| 9.1 | Browse garages screen: list non-suspendus, filtres (distance, rating) | Mobile | 2j | — |
| 9.2 | Geoloc permission, get user location, calculate distance | Mobile | 1j | — |
| 9.3 | Garage detail screen: voir photos, rating, reviews, call, map | Mobile | 1j | — |
| 9.4 | Créer devis (QuoteRequest): form description, submit → quote_requests table | Mobile | 1j | — |
| 9.5 | Mes devis (driver): lister quote_requests, voir devis reçus (Quotes) | Mobile | 1j | — |
| 9.6 | Devis entrants (garage): lister quote_requests pour ce garage | Mobile | 1j | — |
| 9.7 | Envoyer devis (garage): form prix/délai, créer Quote | Mobile | 1j | — |
| 9.8 | Accept/reject devis (driver): update quote status, RLS test | Mobile | 1j | — |

**Définition de "Done" Sprint 9-10 :**
- [ ] Devis flow end-to-end: driver créé → garage voit → garage envoie → driver accepte
- [ ] RLS tested: garage A ne voit que devis adressés à A
- [ ] Geoloc OK, distance calculation correct
- [ ] Photos chargent depuis storage public
- [ ] Build Expo, APK gen

---

### **SPRINT 11 : Mobile messaging + payments (Semaine 11)**

#### Objectif
- Chat Realtime (messages)
- Paiements CinetPay

#### Tâches
| # | Tâche | Owner | Durée | Statut |
|---|-------|-------|-------|--------|
| 11.1 | Messages list screen: conversations avec devis liés | Mobile | 1j | — |
| 11.2 | Chat screen: message input, send, Realtime subscribe | Mobile | 2j | — |
| 11.3 | Realtime: Supabase subscription on messages table, update UI | Mobile | 1j | — |
| 11.4 | RLS test: message A→B non visible à C | Mobile | 1j | — |
| 11.5 | Paiements CinetPay: SDK init, test sandbox, validate signature | Mobile | 2j | — |
| 11.6 | Invoice généré post-paiement, PDF archive storage | Mobile | 1j | — |

**Définition de "Done" Sprint 11 :**
- [ ] Messages Realtime: send→receive <1s
- [ ] RLS tested: conducteur A ne voit que ses messages
- [ ] CinetPay flow tested (sandbox payment)
- [ ] Invoice generated + stored
- [ ] Build Expo

---

### **SPRINT 12 : Mobile reviews + polish (Semaine 12)**

#### Objectif
- Avis / ratings
- Polish: UX, perf, crash fixes

#### Tâches
| # | Tâche | Owner | Durée | Statut |
|---|-------|-------|-------|--------|
| 12.1 | Rate garage screen: 1-5 stars, comment, submit | Mobile | 1j | — |
| 12.2 | My reviews screen: voir mes avis approuvés + draft | Mobile | 1j | — |
| 12.3 | Garage reviews list: afficher avis approuvés, avg rating | Mobile | 1j | — |
| 12.4 | RLS test: draft review visible seulement à owner | Mobile | 1j | — |
| 12.5 | Polish: button states, loading spinners, error messages | Mobile | 2j | — |
| 12.6 | Perf: optimize RLS queries, add indexes | Backend | 1j | — |
| 12.7 | Crash testing: kill app mid-payment, mid-upload, offline mode | Mobile | 1j | — |

**Définition de "Done" Sprint 12 :**
- [ ] Avis full: submit → admin modère → public
- [ ] RLS tested: user ne voit reviews que s'approuvé sauf le sien en draft
- [ ] Mobile app Alpha release: Google Play (internal testing), TestFlight
- [ ] Crash testing: app doesn't crash, recovers gracefully
- [ ] Perf: RLS queries < 300ms p95

---

### **SPRINT 13-14 : Landing page design + content (Semaines 13-14)**

#### Objectif
- Landing page en prod
- SEO optimisé
- Download CTA fonctionnel

#### Tâches
| # | Tâche | Owner | Durée | Statut |
|---|-------|-------|-------|--------|
| 13.1 | Landing page layout: hero, sections, footer | Web | 1j | — |
| 13.2 | Hero copy: français optimisé Côte d'Ivoire, tagline, CTA | Web | 1j | — |
| 13.3 | How it works: 3 étapes + diagramme | Web | 1j | — |
| 13.4 | Features cards: chat, avis, paiement, support | Web | 1j | — |
| 13.5 | Download CTA: QR code (Expo, TestFlight, Play Store), buttons | Web | 1j | — |
| 13.6 | FAQ accordion: driver + garage + questions | Web | 1j | — |
| 13.7 | Testimonials: 3-5 avis utilisateurs (mock data) | Web | 1j | — |
| 13.8 | SEO: meta tags (og:image, twitter:card), robots.txt, sitemap | Web | 1j | — |
| 13.9 | Contact form: email validation, Resend send | Web | 1j | — |
| 13.10 | Mobile responsive: test sur iPhone 12/Android 11+ | Web | 1j | — |
| 14.1 | Analytics: Vercel Analytics ou Plausible setup | Web | 1j | — |
| 14.2 | CDN + edge caching: Vercel deployment optimisé | Web | 1j | — |

**Définition de "Done" Sprint 13-14 :**
- [ ] Landing page prod déployée, Vercel domain live
- [ ] QR codes pointing to real app (TestFlight/Play Store)
- [ ] SEO: Google Search Console indexed
- [ ] Mobile responsive tested
- [ ] Analytics: page views tracked
- [ ] Contact form tested (email reçu)

---

### **SPRINT 15-16 : Final testing + launch prep (Semaines 15-16)**

#### Objectif
- End-to-end testing complet
- Staging → Prod migration
- Launch checklist

#### Tâches
| # | Tâche | Owner | Durée | Statut |
|---|-------|-------|-------|--------|
| 15.1 | E2E test: driver signup→browse→devis→paiement→review | QA | 2j | — |
| 15.2 | E2E test: garage signup→receive devis→send→get review | QA | 2j | — |
| 15.3 | RLS security audit: all 29 policies tested (cross-user access) | Security | 2j | — |
| 15.4 | Performance audit: Lighthouse, Supabase dashboard metrics | DevOps | 1j | — |
| 15.5 | Staging → Prod DNS, secrets rotate, backup plan | DevOps | 1j | — |
| 15.6 | Mobile app: Play Store submission (alpha → internal release) | Mobile | 1j | — |
| 15.7 | Mobile app: TestFlight submission (iOS) | Mobile | 1j | — |
| 15.8 | Marketing: social media posts (Instagram, TikTok, WhatsApp), press | Marketing | 2j | — |
| 15.9 | Documentation: user guides, admin manual, API docs | Docs | 1j | — |
| 16.1 | Final staging soak test: 48h, no critical bugs | QA | 2j | — |
| 16.2 | Post-launch monitoring: Sentry alerts, Supabase logs | DevOps | 1j | — |

**Définition de "Done" Sprint 15-16 :**
- [ ] E2E full flow tested 5x, no regressions
- [ ] RLS audit ✅ (no cross-user leaks)
- [ ] Mobile app live (Play Store + TestFlight)
- [ ] Landing page live
- [ ] Admin web stable in prod
- [ ] Monitoring (Sentry, logs) active
- [ ] Support channel ready (email, WhatsApp)

---

## 5. Critères "Super abouti" — Checklist complétude

### Backend (Supabase)
- [ ] 29 RLS policies actives, 0 bypasses
- [ ] All 9 tables indexed on RLS filter columns
- [ ] All tables have `created_at`, `updated_at` timestamps
- [ ] Storage: public bucket for photos, private for invoices/docs
- [ ] Soft-deletes: `deleted_at` nullable sur users, garages (future: hard-delete avec audit trail)
- [ ] Audit logs: who changed what when (future: detailed table)
- [ ] Realtime: messages + notifications subscriptions tested
- [ ] Backups: daily automated, tested restore (Supabase free tier)
- [ ] HTTPS everywhere, no secrets in code
- [ ] Performance: RLS queries <300ms p95, index utilization 100%

### Mobile App (Expo)
- [ ] Auth: signup/login/logout/reset password all flows tested
- [ ] Offline mode: graceful degradation (show cached data, queue actions)
- [ ] Crash recovery: app doesn't lose state, resume mid-action
- [ ] Permissions: location, camera, notification, storage (iOS + Android)
- [ ] RLS: all user types tested (driver A ≠ B, suspended garage, etc.)
- [ ] Realtime: messages, notifications <1s latency
- [ ] Payments: CinetPay sandbox tested, sig validated, invoice generated
- [ ] Upload: photos stored in public bucket, viewable
- [ ] Performance: FCP <2s, TTI <4s, app size <80MB
- [ ] Build: both platforms (iOS TestFlight, Android Play Store internal)
- [ ] Security: no secrets in code, JWT stored in secure keychain

### Web Admin (Next.js)
- [ ] Auth: login/logout works, non-admin blocked
- [ ] Dashboard: stats accurate, real-time refresh optional
- [ ] CRUD: garages, reviews, conducteurs all operations tested
- [ ] Moderation: approve/reject review, suspend garage works, visible in mobile
- [ ] Reports: PDF exports generated, correct data
- [ ] Responsive: desktop, tablet, mobile viewable (no mobile features needed)
- [ ] Performance: page load <2s, admin list <500ms
- [ ] Security: no cross-admin data leaks, log all actions (future)
- [ ] Build: Next.js build passes, Vercel deployment OK

### Landing Page (Next.js)
- [ ] Hero: message clear, CTA prominent
- [ ] Mobile responsive: iPhone 12, Samsung S21
- [ ] SEO: title, meta description, og:image set, indexed by Google
- [ ] QR codes: working, point to live app
- [ ] Contact form: email delivery tested
- [ ] Performance: Lighthouse score >90, FCP <2s
- [ ] Analytics: page views, downloads tracked
- [ ] Accessibility: WCAG 2.1 Level AA (a11y scan)
- [ ] CDN: edge caching active, static assets <50ms

### DevOps + Security
- [ ] CI/CD: all jobs pass (lint, typecheck, build, security scan)
- [ ] Secrets: 0 in code, all in GitHub Environments
- [ ] Dependabot: no critical CVEs, patch updates applied
- [ ] CodeQL: 0 security warnings
- [ ] Gitleaks: 0 secrets detected
- [ ] Monitoring: Sentry free tier active, errors tracked
- [ ] Backups: Supabase daily, tested restore
- [ ] Incident plan: runbook for common issues (auth broken, RLS bypass, payment fail)

---

## 6. Architecture — Decisions clés

### Backend: Pourquoi Supabase ?
- ✅ RLS native, pas de middleware auth externalisé
- ✅ JWT standard, mobile + web réutilisent même token
- ✅ Realtime pub-sub (messages, notifications)
- ✅ Storage (photos, invoices) builtin
- ✅ Free tier sufficient pour MVP
- ✅ PostgreSQL mature, indexes optimisés

### Mobile: Pourquoi Expo ?
- ✅ Code sharing avec web (TypeScript, @carlink/shared)
- ✅ OTA updates (sans app store re-review)
- ✅ EAS build service (CI/CD gratuit tier)
- ✅ RN ecosystem mature (Supabase, React Navigation, Bottom Tab)
- ✅ Payments: CinetPay via WebView (no native plugin needed)

### Web Admin: Pourquoi Next.js (serveur-side)?
- ✅ Server Components = RLS queries sûres (anon key jamais exposé)
- ✅ Reusable server action (RLS GRANT pour UPDATE admin)
- ✅ Edge caching (Vercel), performances meilleures
- ✅ API routes si webhooks Supabase ou paiements

### Landing Page: Pourquoi Next.js statique?
- ✅ Même infra que admin (1 repo, 1 deploy), pas triple-redondance
- ✅ Next.js Image optimization
- ✅ Vercel Analytics builtin
- ✅ Edge caching, CDN global
- ✅ SEO friendly (static export si besoin)

---

## 7. Dépendances bloquantes

| Blocker | Impact | Mitigation |
|---------|--------|-----------|
| Supabase RLS not validated in real-world data | Mobile/Admin broken | Sprint 1-6: rigorous manual testing before mobile starts |
| Payment provider (CinetPay) sandbox unstable | Mobile launch delayed | Week 11: early integration, pivot to Stripe if needed |
| Expo EAS build service slow | Mobile CI/CD blocked | Week 7: build locally first, use EAS only for release |
| Vercel deployment zone latency (Côte d'Ivoire) | Landing page slow | Sprint 13: use Vercel edge locations, CDN prefetch |
| App store approval (Google Play, TestFlight) | Mobile release delayed | Week 12: submit early, expect 24-48h review |

---

## 8. Risk matrix

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|-----------|
| RLS bypass (admin sees user data) | CRITICAL | LOW | Weekly manual audit, automated tests Sprint 2 |
| Payment loss (CinetPay timeout, no invoice) | HIGH | MEDIUM | Retry logic, webhook validation, Supabase logs audit |
| Message loss (Realtime subscription fails) | HIGH | LOW | Fallback polling, message queue, Supabase status page |
| Geo-blocking (Côte d'Ivoire DNS blocks) | MEDIUM | LOW | Vercel edge, cloudflare anycast DNS, VPN test |
| User data leak (storage bucket public) | CRITICAL | LOW | Weekly S3 audit, RLS policy test, encryption at rest |
| Vendor lock-in (Supabase proprietary RLS) | LOW | MEDIUM | Postgres export tools ready, schema versioned in git |

---

## 9. Mesure de succès

**Par phase :**
- **Phase 1 (Admin):** RLS bypass test 0 failures, admin functions 100% working
- **Phase 2 (Mobile):** E2E devis flow tested 5x, Realtime latency <1s, CinetPay sandbox ✅
- **Phase 3 (Landing):** SEO indexed by Google, download CTA tracked, CTR >5%

**Global (Semaine 16):**
- ✅ 0 critical security issues (RLS, payment, data leak)
- ✅ 99% uptime (Supabase + Vercel SLA)
- ✅ <300ms p95 RLS query latency
- ✅ <2s page load (mobile + landing)
- ✅ 0 app crashes in staging soak test
- ✅ Full audit trail (who did what when)
- ✅ Incident playbooks written

---

## 10. Timeline visuelle

```
Week 1-2:   |=== Backend + Admin setup ===|
Week 3-4:                   |=== Admin CRUD ===|
Week 5-6:                              |=== Admin complete ===|
Week 7-8:                                         |=== Mobile auth ===|
Week 9-10:                                                |=== Mobile quotes ===|
Week 11:                                                       |= Mobile messages + payments =|
Week 12:                                                              |= Mobile reviews ===|
Week 13-14:                                    |===== Landing page ====|
Week 15-16:                                                              |=== Final testing + launch ===|

Deployment:
Staging:  Admin Week 6 → Mobile Week 12 → Landing Week 14
Prod:     Staggered Week 16 (monitoring active)
```

---

## Conclusion

**Cette roadmap assure :**
1. **Clarté:** Chaque surface a ses features, son timing, ses dépendances
2. **Modularité:** Mobile = backend réutilisé, landing = indépendante
3. **Qualité:** RLS audit + E2E testing built-in, non optionnel
4. **Réalisme:** 16 semaines pour MVP "super abouti", not 8-week fantasy
5. **Tracabilité:** Sprints numérotés, tâches précises, définitions "Done"

**Prochains pas :**
- Week 1: Backend engineer commence Sprint 1 (Supabase schema + RLS)
- Week 1: Web engineer commence Admin setup
- Week 7: Mobile engineer commence avec backend stable
- Week 13: Marketing/copywriting pour landing page

---

**Document maintenu par:** Security Engineer (Claude)  
**Dernière mise à jour:** 2026-05-19  
**Révision:** 1.0 (initial)
