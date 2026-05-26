# CLAUDE.md — Instructions projet CarLink

## Rôle Security Engineer (permanent)

Tu assures le rôle de **Security Engineer** sur ce projet. Le client n'a pas
d'expertise sécurité : c'est ta responsabilité, à chaque changement.

**Avant tout code, toute PR, toute migration DB : applique [`SECURITY.md`](./SECURITY.md).**

À chaque changement, en plus de la tâche demandée, tu DOIS :

1. Vérifier la **checklist PR §2** de `SECURITY.md`.
2. Refuser/corriger tout secret en clair (clé, token, URL projet réelle).
3. Exiger RLS + `WITH CHECK` sur toute nouvelle table.
4. Exiger validation Zod sur toute entrée externe (`packages/shared/src/validators/`).
5. Mettre à jour le **journal §6** de `SECURITY.md` si événement sécurité.
6. Signaler proactivement au client tout risque, même hors scope de la tâche.
7. Vérifier que les SQL grants (`GRANT SELECT/INSERT/UPDATE/DELETE`) sont alignés avec les policies RLS.
8. Refuser toute modification Supabase sans fichier dans `supabase/migrations/`.

Si une demande entre en conflit avec `SECURITY.md`, **alerte le client avant d'agir**.

---

## Stack & architecture

- Monorepo npm workspaces : `apps/mobile` (Expo + Expo Router), `apps/web` (Next.js), `packages/shared`.
- Backend : Supabase (Postgres + Auth + Realtime + Storage), sécurité par RLS.
- Détails : [`docs/architecture.md`](./docs/architecture.md).

---

## Git Development Branch Requirements

### Structure des branches

**Session-specific development branch** (assignée à chaque session) :
- `claude/charming-ritchie-2yi7s` ← **Branche principale de codage (session courante)**
- Point de départ : `git checkout claude/charming-ritchie-2yi7s`
- Destination : tous les commits et PR vont vers `claude/stable-mobile`

**Stable mobile branch** (versions stables temporaires) :
- `claude/stable-mobile` ← Versions testées et stables de l'app mobile
- Temporaire pour cette phase (audit onboarding)
- Future évolution : push de `claude/stable-mobile` → `claude/mobile` → `dev` → `staging` → `main`

**Long-term stable branches** (roadmap project) :
- `claude/mobile` · `claude/web-admin` · `claude/backend-supabase`
- Activées selon la phase du roadmap (voir [`docs/roadmap.md`](./docs/roadmap.md))

### Workflow strict

1. Développement local : `git checkout claude/charming-ritchie-2yi7s`
2. Commits réguliers : `git commit -m "..."` (messages clairs)
3. PR destination : **TOUJOURS vers `claude/stable-mobile`** (jamais vers `dev` ou `main`)
4. Validation : CI verte (security + lint + typecheck + build)
5. Merge : après approbation
6. Push stable : plus tard, `claude/stable-mobile` → `claude/mobile` → `dev`

**JAMAIS** de push direct sur `main`, `staging`, `dev`, ou `claude/mobile` sans autorisation explicite.

### Raison de cette structure

- **Session branches** : Isolation par session, pas de conflits multi-développeur
- **Stable branches** : Versions testées séparées du flux de dev principal
- **Phase-based promotion** : Promotion progressive selon avancement du roadmap
- **Safety** : PR obligatoire, CI obligatoire, aucune modification directe de branches critiques

---

## Workflow Git (général)

- Toute PR déclenche la CI complète (security + lint + typecheck + build).
- Une PR = un objectif précis. Pas de PR qui mélange mobile + web + RLS + storage.
- Toute PR doit répondre aux 7 questions du template (voir [`docs/gouvernance.md`](./docs/gouvernance.md)).

---

## Design Files (Référence visuelle)

**Mobile (Expo/React Native)** — CarLink Showcase v3
- Source : https://api.anthropic.com/v1/design/h/cAqwfLpi2ooqyZKSKCULRA?open_file=CarLink+Showcase+v3.html
- Contient : Maquettes écrans auth, recherche garages, devis, chat, avis
- Utiliser comme référence visuelle pour les implémentations mobile

**Web Admin (Next.js)** — CarLink Admin
- Source : https://api.anthropic.com/v1/design/h/dp2tbYH26h9zHr3HN9WAqg?open_file=CarLink+Admin.html
- Contient : Dashboard, gestion garages, modération avis, stats
- Utiliser comme référence visuelle pour les implémentations admin

**Synchronisation code ↔ design** : À chaque PR, comparer implémentation vs designs. Design est la source de vérité visuelle.

---

## Commandes

- Mobile : `npm run mobile` · Web : `npm run web`
- Lint : `npm run lint` · Typecheck : `npm run typecheck`
- Build web : `npm run build:web`

---

## Standards non négociables (extraits de la gouvernance)

### Code

- **TypeScript strict partout** — interdire les `any` sauf cas exceptionnel justifié.
- **Types viennent de Supabase** — générer `database.types.ts`, l'utiliser dans `packages/shared`, ne pas créer des types front qui divergent du vrai schéma.
- **Client Supabase centralisé** — une seule factory dans `packages/shared/src/supabase/`, jamais `createClient(...)` directement dans les écrans.
- **Zod sur toute entrée externe** — API, formulaire, upload, webhook. Jamais de confiance aveugle sur les données reçues.
- **Pas de `select *` sur les écrans importants** — sélectionner uniquement les colonnes nécessaires.

### Base de données

- **Toute modification de schéma = fichier dans `supabase/migrations/`**, committé dans GitHub.
- **RLS + grants ensemble** — les policies RLS disent "quelles lignes", les `GRANT` disent "quelles opérations". Les deux doivent être alignés.
- **Helpers RLS dans le schéma `private`** — jamais dans `public` (exposé par PostgREST).
- **Index obligatoires** sur toutes les colonnes utilisées dans les policies RLS et les filtres fréquents.
- **Storage : buckets séparés** — `garage-photos`, `quote-request-photos`, `invoices`, `user-avatars`. Jamais un seul bucket fourre-tout.

### CI / GitHub

- **CODEOWNERS respecté** — `/supabase/`, `/packages/shared/`, `/apps/web/app/admin/`, `/.github/` exigent review explicite.
- **Dependabot** — ne jamais accepter de major bump sans vérifier les breaking changes manuellement.
- **Pas de shell injection dans les workflows** — variables `${{ github.* }}` toujours passées via `env:` avant utilisation dans `run:`.

### Tests minimum obligatoires avant merge

- Auth : inscription conducteur, inscription garage, connexion, déconnexion, session expirée.
- RLS : conducteur A ne voit pas conducteur B ; garage suspendu ne reçoit plus de demandes ; non-admin ne peut pas modérer.
- Storage : upload autorisé si propriétaire ; listing global interdit ; factures privées.

---

## Structure du projet (réelle)

### Apps

**Mobile** (Expo + Expo Router — file-based routing) :
```
apps/mobile/
  app/
    (auth)/            ← Auth screens (signin, signup, otp, etc.)
      signin-conductor.tsx
      signup-conductor.tsx
      forgot-password.tsx
      otp.tsx
      new-password.tsx
      ...
    (app)/             ← Main app screens (après login)
      garage/
      drivers/
      quotes/
      messages/
      reviews/
      ...
  src/
    components/        ← Composants réutilisables (Input, Button, etc.)
    contexts/          ← Context providers (Auth, Toast, etc.)
    hooks/             ← Custom hooks (useAuth, useToast, etc.)
    utils/             ← Utilitaires (formatters, helpers, etc.)
```

**Web** (Next.js + App Router) :
```
apps/web/
  app/
    admin/             ← Admin dashboard (après login)
      garages/
      reviews/
      stats/
      ...
  src/
    components/        ← Composants admin réutilisables
    utils/             ← Utilitaires web
```

### Shared

```
packages/shared/src/
  supabase/            ← Factory client centralisée + config
  types/               ← Types générés depuis Supabase schema
  validators/          ← Schémas Zod partagés (auth, forms, etc.)
  contexts/            ← Context definitions (si réutilisé mobile+web)
  utils/               ← Utilitaires partagés (formatters, helpers, etc.)
```

### Backend

```
supabase/
  migrations/          ← Toutes migrations versionnées (semver)
  policies/            ← Policies RLS documentées par table
  functions/           ← Edge Functions (webhooks, etc.)
```

### Documentation

```
docs/
  architecture.md      ← Architecture technique détaillée
  roadmap.md           ← Roadmap 16 semaines (source de vérité phases)
  gouvernance.md       ← Standards non négociables
  decisions/           ← ADR (Architecture Decision Records)
```

---

## Phases de développement (Roadmap 16 semaines)

Source de vérité : [`docs/roadmap.md`](./docs/roadmap.md)

**Phase actuelle** : Audit onboarding (initiative temporaire)
- **Objectif** : Améliorer UX des 8 écrans d'authentification
- **Branches actives** : `claude/charming-ritchie-2yi7s` (session) → `claude/stable-mobile`
- **Durée** : Temporaire (avant retour au roadmap principal)

**Phases roadmap** (après audit) :

| Phase | Semaines | Objectif | Branches |
|---|---|---|---|
| **Fondations** | S1–S4 | Setup infra + Auth MVP + Recherche garages | `claude/backend-supabase`, `claude/mobile` |
| **Cœur métier** | S5–S8 | Devis + Chat temps réel + Système d'avis | `claude/mobile`, `claude/backend-supabase` |
| **Pilotage** | S9–S10 | Beta fermée 3 garages + Dashboard admin | `claude/web-admin`, `claude/mobile` |
| **Paiement & traçabilité** | S11–S12 | CinetPay + Factures + Photos intervention | `claude/backend-supabase`, `claude/mobile` |
| **Finition** | S13–S15 | i18n + UX polish + Optimisation perf | `claude/mobile`, `claude/web-admin` |
| **Lancement** | S16 | Production + App Store | toutes → `staging` → `main` |

Chaque phase donne lieu à des PR `claude/…` → destination selon structure Git (actuellement `claude/stable-mobile` pour audit).

---

## Checklist hebdomadaire (fin de semaine)

- [ ] PR vers `claude/stable-mobile` propre avec CI verte (audit) ou destination correcte (roadmap).
- [ ] `npm run lint` + `npm run typecheck` passent localement.
- [ ] Test manuel mobile + admin.
- [ ] Test RLS minimum (conducteur A ≠ conducteur B).
- [ ] Vérification Supabase logs (erreurs, accès anormaux).
- [ ] Vérification Performance Advisor + Security Advisor Supabase.
- [ ] Aucune alerte Dependabot ou CodeQL non traitée.
- [ ] Merge vers `staging` seulement si tout est stable (après phase roadmap validée).

---

## Propositions précises pour améliorer l'écosystème code

Basées sur ta façon de travailler (audit onboarding, session branches isolées, design-driven, sécurité prioritaire) :

### 1. Créer `docs/session-workflow.md` — Onboarding pour futures sessions

**Problème** : La différence entre phase audit et phases roadmap a causé confusion. Solution : document dédié.

**Contenu** :
- Comment identifier sa session branch assignée
- Où doivent aller les commits (stable-mobile vs mobile vs backend)
- Template commenté pour chaque type de tâche (auth, RLS, storage)
- Exemples commit messages (modèle à suivre)

**Impact** : Aucun développeur futur ne fera la même erreur phase 2.

---

### 2. Ajouter `docs/error-handling-pattern.md` — Standardiser gestion erreurs UI

**Problème** : Phase 2 a montré qu'il n'y avait pas de pattern clair pour toast vs field errors vs Alert. Même si annulée, ce pattern est nécessaire.

**Contenu** (à créer) :
```typescript
// Pattern recommandé pour formulaires (applicable à TOUS les futurs formulaires, pas juste auth)

// 1. Validation locale (Zod) → toast.error + field errors
try {
  const validated = schema.parse(data);
} catch (err) {
  toast.error(firstErrorMessage);
  setFieldErrors({...});
}

// 2. Erreur Supabase → toast selon type + field errors si applicable
if (error) {
  const { toastMessage, fieldErrors } = handleSupabaseError(error);
  toast.error(toastMessage);
  if (fieldErrors) setFieldErrors(fieldErrors);
}

// 3. Succès avec navigation → toast.success + 500ms delay
toast.success('Message');
setTimeout(() => router.push(...), 500);

// 4. JAMAIS Alert.alert() pour succès/erreurs (utiliser toast)
```

**Créer** : `packages/shared/src/utils/errorHandler.ts` avec :
- `handleZodError()` : Zod → toast + field errors
- `handleSupabaseAuthError()` : Erreurs auth Supabase → message + retry hint
- `handlePostgresError()` : Erreurs DB → message + code error
- `showSuccessAndNavigate()` : Toast success + 500ms delay + navigation

**Impact** : Cohérence garantie sur tous les formulaires (mobile + web), maintenance centralisée, i18n future simplifiée.

---

### 3. Ajouter vérification Expo Router dans CI (lint rule)

**Problème** : CLAUDE.md documentait `features/` alors que le vrai pattern est Expo Router `app/(groups)/`. CI ne vérifiait pas ça.

**Solution** : Ajouter règle eslint custom :
```javascript
// .eslintrc.js
rules: {
  'no-restricted-imports': [
    'warn',
    {
      patterns: ['**/src/features/**'],
      message: 'Use Expo Router app/(group)/ instead of features/ pattern'
    }
  ]
}
```

**Impact** : Impossible d'importer features/ → développeur corrige immédiatement si il essaie.

---

### 4. Créer `docs/rls-decision-log.md` — Auditer RLS par table

**Problème** : CLAUDE.md exige RLS + grants, mais pas de suivi visible de quelles tables l'ont et lesquelles manquent.

**Contenu** : Tableau pour chaque table :
```markdown
| Table | RLS actif? | Policies | Grants | Tests | Notes |
|---|---|---|---|---|---|
| users | ✅ | auth_uid = id | SELECT/INSERT/UPDATE | login test | Conducteurs ne voient que eux |
| garages | ✅ | ... | SELECT | garage test | ... |
| ... | ... | ... | ... | ... | ... |
```

**Mise à jour** : À chaque migration dans `supabase/migrations/`.

**Impact** : Audit RLS transparent, aucune table oubliée, historique changements.

---

### 5. Documenter "Pattern Expo Router" dans `docs/mobile-architecture.md`

**Problème** : Aucune doc n'expliquait pourquoi `app/(auth)/`, pas `src/features/auth/`. Confusion inévitable.

**Contenu** :
- Structure Expo Router : `app/(groupName)/screen.tsx` = route `/(groupName)/screen`
- Groupes actuels : `(auth)`, `(app)` (après login)
- Composants partagés : `src/components/`
- Hooks écran-spécifiques : `src/hooks/` (ex: `useLoginForm`)
- Contextes : `src/contexts/` (ex: `AuthContext`)
- Exemple complet : 1 écran auth + 1 écran app

**Impact** : Architecture mobile transparente pour tous, cohérence garantie.

---

### 6. Ajouter "Branching strategy for multi-developer future" dans CLAUDE.md

**Problème** : Ta stratégie session branches est bonne pour solo dev, mais si 2+ devs :

**Actuellement** :
- 1 session = 1 branch assignée (ex: `claude/charming-ritchie-2yi7s`)
- Pas de conflits, isolation totale

**Future** (si co-développeurs) :
- Session 1 : `feature/auth-onboarding`
- Session 2 : `feature/garage-dashboard`
- Chacun vers `claude/stable-mobile` → après stabilisation vers `dev`
- Merge `dev` → `staging` → `main` en coordination

**Ajouter section** : "Multi-developer workflow (future)" avec exemple.

**Impact** : Prêt pour scaling, pas de refactoring Git si équipe grandit.

---

### 7. Créer `docs/security-audit-template.md` — Checklist pré-PR

**Problème** : SECURITY.md a 8 règles, mais pas de checklist visuelle pour vérifier avant commit.

**Contenu** :
```markdown
# Pre-PR Security Audit (avant commit)

- [ ] Pas de secrets en clair (clés API, tokens, URL prod)
- [ ] Pas de `any` en TypeScript (sauf justifié)
- [ ] Validation Zod sur : formulaires, API, uploads
- [ ] RLS activé sur : toutes new tables, toutes mutations
- [ ] SQL : GRANT aligné avec policies RLS
- [ ] Pas de `select *` sur écrans sensibles
- [ ] Migrations versionnées si schema change
- [ ] Storage : buckets séparés si new type de fichier
```

**Impact** : 30 sec à cocher → zero security regressions.

---

### 8. Documenter "When to use Context vs Props" dans `docs/mobile-patterns.md`

**Problème** : React Contexts partout sans pattern clair = code flou.

**Pattern** :
- **Context** : état global (auth user, theme, toast)
- **Props** : données écran-spécifiques (liste garages, formulaire)
- **Hooks** : logique réutilisable (useAuth, useLoginForm)

**Ajouter exemple** : Auth flow (context pour user, props pour liste garages, hook pour validation).

**Impact** : Code plus lisible, moins de over-engineered contexts.

---

### 9. Créer `packages/shared/src/hooks/useForm.ts` — Hook de formulaire centralisé

**Problème** : Chaque écran auth réimplémente `onChange`, `setErrors`, `isLoading`. DRY violation.

**Solution** :
```typescript
function useForm<T>(
  onSubmit: (data: T) => Promise<void>,
  schema: ZodSchema
) {
  const [formData, setFormData] = useState<T>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
    setFieldErrors(prev => ({...prev, [field]: ''})); // Clear error
  };
  
  const handleSubmit = async () => {
    try {
      const valid = schema.parse(formData);
      setIsLoading(true);
      await onSubmit(valid);
    } catch (err) {
      // ... handle errors with toast
    }
  };
  
  return { formData, fieldErrors, isLoading, handleChange, handleSubmit };
}

// Usage :
const { formData, fieldErrors, handleChange, handleSubmit } = useForm(
  async (data) => {
    await signIn(data);
  },
  signinSchema
);
```

**Impact** : -50% boilerplate auth/forms, cohérence totale, maintenance un endroit.

---

### 10. Ajouter "Component Testing Minimum" dans CLAUDE.md

**Problème** : Checklist hebdomadaire a "test manual", mais pas de what/how.

**Ajouter** :
```markdown
### Tests minimums avant PR (composants clés)

**Auth forms** :
- [ ] Zod error → toast + field error visible
- [ ] Supabase error → toast visible, form recoverable
- [ ] Success → toast + rapid navigation (pas bloqué)

**RLS-protected screens** :
- [ ] User A ne voit pas User B data
- [ ] Suspended user reçoit 403 Forbidden
- [ ] Non-admin ne peut pas access /admin

**Storage** :
- [ ] Upload fichier → stored dans bon bucket
- [ ] Delete autorisé que si propriétaire
- [ ] URL publique : accessible si public, forbidden si private
```

**Impact** : Test strategy clair, quality baseline garantie, onboarding futur devs plus rapide.

---

### Résumé : Ordre d'implémentation (priorité)

1. ✅ **CLAUDE.md** (session branch + design files) — FAIT
2. 🔲 `docs/session-workflow.md` — Onboarding future sessions (HAUTE)
3. 🔲 `docs/error-handling-pattern.md` + `packages/shared/src/utils/errorHandler.ts` — Pattern toast/field errors (HAUTE)
4. 🔲 CI lint rule Expo Router — Prévenir features/ imports (MOYENNE)
5. 🔲 `docs/rls-decision-log.md` — Audit RLS transparent (MOYENNE)
6. 🔲 `docs/mobile-architecture.md` — Pattern Expo Router (MOYENNE)
7. 🔲 `useForm.ts` hook centralisé — DRY forms (BASSE, mais impact long-terme énorme)
8. 🔲 Autres docs (branching future, security template, etc.) — Référence (BASSE)

**Impact total** : Écosystème code solide, scalable, documenté, résiliant aux erreurs. Pas de futures confusions phase/branches/architecture.
