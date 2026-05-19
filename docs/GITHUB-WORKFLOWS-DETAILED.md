# ⚙️ GitHub Workflows — Documentation Complète

**Source** : `.github/workflows/` (3 workflows)  
**Purpose** : Automated CI/CD pipeline pour sécurité, qualité et déploiement  
**Trigger** : Pull Requests vers `dev`, `staging`, `main`

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [CI Workflow détaillé (ci.yml)](#ci-workflow-ciyml)
3. [CodeQL Workflow (codeql.yml)](#codeql-workflow-codequlym)
4. [Dependabot (dependabot.yml)](#dependabot-dependabotypml)
5. [Ordre d'exécution & dépendances](#ordre-dexécution--dépendances)
6. [Erreurs courantes & solutions](#erreurs-courantes--solutions)
7. [Optimisations appliquées](#optimisations-appliquées)

---

## Vue d'ensemble

### Architecture

```
┌─────────────────────────────────────────────────┐
│ Trigger: PR → dev/staging/main                  │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
    ┌────────┐      ┌──────────┐
    │ ci.yml │      │ CodeQL   │
    │ (6 jobs)      │ (weekly) │
    └────────┘      └──────────┘
        │
        ├─► changes (detect modified paths)
        │
        ├─► validate-deps (lockfile check)
        │
        ├──┬─────────────────────────────────────┐
        │  │                                     │
        │  ▼                                     ▼
        │  security                        lint-typecheck
        │  ├─ npm audit                    ├─ eslint
        │  ├─ secrets scan                 ├─ tsc shared
        │  ├─ gitleaks                     ├─ tsc web
        │  └─ semgrep                      └─ tsc mobile
        │
        ▼
        build-web (if web/shared changed)
        │
        ▼
        build-web-final (status check reporter)
```

### Concurrency & Cancellation

```yaml
concurrency:
  group: ci-${{ github.ref }}     # Une seule run par branche
  cancel-in-progress: true        # Cancel si nouvelle push sur même branche
```

**Effet** : Si vous push 3 fois d'affilée, seule la 3e run s'exécute (les 2 premières annulées). Évite les files d'attente.

### Permissions (Principle of Least Privilege)

```yaml
permissions:
  contents: read        # Global: lire git
  
jobs:
  security:
    permissions:
      contents: read
      security-events: write    # Semgrep + CodeQL upload SARIF
  build-web:
    environment: ${{ github.base_ref == 'main' && 'production' || 'staging' }}
```

**Logique** : Chaque job ne demande que ce qu'il faut. Admin review secrets via GitHub Environments.

---

## CI Workflow (ci.yml)

### Job 1: `changes` — Change Detection (3 min)

**But** : Identifier si `web`, `mobile` ou `shared` ont changé → skip les builds inutiles.

```yaml
name: Detect Changes
runs-on: ubuntu-latest
timeout-minutes: 3
outputs:
  web:    ${{ steps.filter.outputs.web }}
  mobile: ${{ steps.filter.outputs.mobile }}
steps:
  - uses: actions/checkout@v6
  - uses: dorny/paths-filter@v4
    id: filter
    with:
      filters: |
        web:
          - 'apps/web/**'
          - 'packages/shared/**'
        mobile:
          - 'apps/mobile/**'
          - 'packages/shared/**'
```

**Outputs** :
- `web = 'true'` → si changement dans `apps/web/` OU `packages/shared/`
- `mobile = 'true'` → si changement dans `apps/mobile/` OU `packages/shared/`
- `'false'` sinon

**Cas d'usage** :
```yaml
# Elsewhere in workflow
build-web:
  if: needs.changes.outputs.web == 'true'    # Skip si web pas touché
```

**⚠️ Piège** : Changer `packages/shared/` = true pour BOTH `web` ET `mobile`. Par design (shared package affecte les deux).

---

### Job 2: `validate-deps` — Lockfile Integrity (5 min) ⭐ Critique

**But** : Valider que `package-lock.json` est cohérent **avant** tout job coûteux.

```yaml
name: Validate Lockfile
runs-on: ubuntu-latest
timeout-minutes: 5
needs: []  # Independent, pas de dépendances
steps:
  - uses: actions/checkout@v6
  - uses: actions/setup-node@v6
    with:
      node-version: 20
      cache: npm
  - name: Validate package-lock.json integrity
    run: |
      if ! npm ci 2>&1; then
        echo "::error::package-lock.json corrompu ou incohérent."
        echo "::error::Cause probable : merge de branches avec des lockfiles divergents."
        echo "::error::Correction : rm package-lock.json && npm install"
        exit 1
      fi
      echo "✅ Lockfile valide"
```

**Commandes clés** :
- `npm ci` (not `npm install`) → reproduire exact lockfile dans CI
- `2>&1` → capture stderr aussi
- `exit 1` → bloque la PR

**Erreur courante** :

```
npm ERR! code EBADLOCK
npm ERR! The package-lock.json file was created by an npm version that
npm ERR! does not match the current npm version.
```

**Cause** : Merge de 2 branches avec lockfiles divergents (version Node différente ou dépendances conflictuelles).

**Solution** :
```bash
# Local
rm package-lock.json
npm install   # Régénère lockfile
git add package-lock.json
git commit -m "fix(deps): regenerate lockfile"
git push
```

**Importance** : Si ce job échoue, les 5 jobs suivants échouent tous → cascade failure.

---

### Job 3: `security` — Security Audit (10 min) 🔒 Bloquant

**But** : Détecter CVE, secrets hardcodés, patterns dangereux.

```yaml
name: Security Audit
runs-on: ubuntu-latest
needs: [validate-deps]
timeout-minutes: 10
permissions:
  contents: read
  security-events: write    # Upload SARIF Semgrep → Security tab
```

#### Sub-step 3a: npm audit (CVE)

```bash
npm ci --ignore-scripts     # --ignore-scripts = pas de postinstall malveillant

npm audit --audit-level=high --omit=dev
```

**Flags** :
- `--audit-level=high` : Bloque sur HIGH et CRITICAL vulns
- `--omit=dev` : Ignore vulns en devDependencies (safe en production)

**Exemple sortie bloquante** :

```
npm audit
┌─────────────┬──────────────┬──────────┬─────────────┐
│ Module      │ Vulnerability│ Severity │ Introduced  │
├─────────────┼──────────────┼──────────┼─────────────┤
│ lodash      │ CVE-2021-123 │ HIGH     │ @vercel/* → │
└─────────────┴──────────────┴──────────┴─────────────┘

npm ERR! audit Vulnerabilities found in 1 package
npm ERR! Run `npm audit fix` to fix them
```

**Correction locale** :
```bash
npm audit fix --force     # Force même si breaking changes
# ou
npm update <package>      # Upgrade spécifique
# ou
# Accepter la vulnérabilité si acceptable risk (e.g., test-only)
```

---

#### Sub-step 3b: Hardcoded Secrets Scan

```bash
SECRETS_FOUND=0

# Pattern 1: JWT Supabase (eyJ... > 100 chars)
if grep -rn "eyJ[A-Za-z0-9_-]\{100,\}" apps/ packages/ 2>/dev/null | grep -v node_modules | grep -v .next; then
  echo "::error::JWT trouvé"
  SECRETS_FOUND=1
fi

# Pattern 2: URLs Supabase réelles (supabase.co)
if grep -rn "supabase\.co" apps/ packages/ 2>/dev/null | grep -v node_modules; then
  echo "::warning::Vérifier que c'est un placeholder"
fi

if [ "$SECRETS_FOUND" -eq 1 ]; then exit 1; fi
```

**Détections** :
- JWT eyJ... > 100 chars (Supabase token format)
- URLs supabase.co réelles (vs placeholder)

**Exemples bloquants** :

```typescript
// ❌ BLOQUANT
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...very_long...";
const URL = "https://abcxyz.supabase.co";

// ✅ OK
const SUPABASE_ANON_KEY = "xxxxxxxxxxxxxx";  // Placeholder ou env var
const URL = "https://placeholder.supabase.co";
```

---

#### Sub-step 3c: Gitleaks (Secret Scan)

```bash
- uses: gitleaks/gitleaks-action@v2
  with:
    config: .gitleaks.toml
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Fonction** : Scan l'historique **complet** de git pour patterns secrets (credentials, tokens, AWS keys, etc.).

**Config** (`.gitleaks.toml`) :
```toml
[allowlist]
paths = [
  "tests/.*",
  ".*\\.example",
  ".gitleaks.toml"
]
```

**Allowlist** : Exceptions (test data, .example files).

**Détections courantes** :
- `-----BEGIN RSA PRIVATE KEY-----`
- `aws_access_key_id`
- `SONAR_TOKEN`
- Patterns Supabase/JWT

**Risque déclaré** (SECURITY.md) :
> Clé anon Supabase exposée en PR#7 (commit `e7d1423`). Protégée par RLS mais devrait être régénérée dans Supabase Dashboard.

---

#### Sub-step 3d: Semgrep (SAST)

```bash
python3 -m pip install semgrep

semgrep scan \
  --config p/default \
  --config p/typescript \
  --config p/react \
  --config p/secrets \
  --sarif --output semgrep.sarif \
  --exclude node_modules --exclude .next
```

**Rulesets** :
- `p/default` : Standard security patterns
- `p/typescript` : TypeScript-specific
- `p/react` : React anti-patterns (unsafe keys, etc.)
- `p/secrets` : Hardcoded credentials

**Résultats** : Uploadés en SARIF (Security Alerts tab) — **non bloquant** (faux positifs possibles).

```bash
- uses: github/codeql-action/upload-sarif@v4
  with:
    sarif_file: semgrep.sarif
    category: semgrep
```

**Exemple finding** :

```
semgrep warnings:
  rules/typescript/unsafe-innerHTML.ts:15
    Do not set innerHTML — use React state instead
  rules/react/avoid-using-key-index.tsx:42
    Using array index as key can cause bugs
```

---

#### Sub-step 3e: Security Summary

```bash
echo "## 🔒 Security Audit" >> "$GITHUB_STEP_SUMMARY"
echo "- npm audit: HIGH+CRITICAL bloquant" >> ...
echo "- Secrets: JWT/Supabase patterns" >> ...
echo "- Gitleaks: historique + allowlist" >> ...
echo "- Semgrep: results in Security tab" >> ...
```

**Output** : Affiché dans le step summary de la PR.

---

### Job 4: `lint-typecheck` — Code Quality (15 min)

**But** : Vérifier ESLint et TypeScript strict sur tous les workspaces.

```yaml
name: Lint & Typecheck
runs-on: ubuntu-latest
needs: [validate-deps]
timeout-minutes: 15
```

**Dépendances** : Attend `validate-deps` (lockfile valide).

#### Sub-step 4a: ESLint

```bash
npm run lint      # Runs: npm run lint --workspaces --if-present
```

**Workspace config** (root `package.json`) :
```json
{
  "scripts": {
    "lint": "npm run lint --workspaces --if-present"
  }
}
```

**Si workspace a `npm run lint`** → exécuté.  
**Si non** → ignoré (`--if-present`).

**Exemple output** :

```
apps/web/app/page.tsx
  5:1  error  Unused variable 'x'           no-unused-vars
  8:10 error  Missing await for async call  no-floating-promises
```

---

#### Sub-step 4b: TypeScript strict

```bash
npm run typecheck --workspace packages/shared
npm run typecheck --workspace apps/web
npm run typecheck --workspace apps/mobile
```

**Chaque workspace** :
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

**Compile sans émission** (vérifie types uniquement, pas de `.js` généré).

**Exemple erreur** :

```
packages/shared/src/types.ts
  12:5  error  Property 'phone' does not exist on type 'User'
       Type 'Conductor' is not assignable to type 'User'
```

**Tri-workspace** : Si un seul échoue, tout fail.

---

### Job 5: `build-web` — Web Build (20 min) 🏗 Conditionnel

**But** : Compiler Next.js production.

```yaml
name: Build Web
runs-on: ubuntu-latest
needs: [changes, lint-typecheck, security]
if: needs.changes.outputs.web == 'true'         # Skip si pas de changements web
timeout-minutes: 20
environment: ${{ github.base_ref == 'main' && 'production' || 'staging' }}
```

**Dépendances** :
- `changes` → savoir si build nécessaire
- `lint-typecheck` → lint OK
- `security` → audit OK (sinon skip build)

**Environments** :
- Base branch = `main` → `production` environment (secrets prod)
- Sinon → `staging` environment (secrets staging)

```yaml
environment: ${{ github.base_ref == 'main' && 'production' || 'staging' }}
```

**Secrets injectés** (vars GitHub Environments) :
```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co' }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key_ci' }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_role_ci' }}
```

**Fallback** : Si secret pas défini → placeholder. Build réussit mais fake client.

#### Build steps

```bash
npm ci              # Install
npm run build:web   # Next.js build

# Rapport
du -sh apps/web/.next   # Bundle size
```

**Erreurs courantes** :

```
Error: Could not find a valid build in the '.next' directory! 
→ Build échoué (check logs)

Error: Unknown config option "swcMinify" in "next.config.js"
→ next.config.js incompatible
```

---

### Job 6: `build-web-final` — Status Check Reporter (< 1 min)

**But** : Assurer que le status check "Build Web" est **toujours** reporté, même si `build-web` skipped.

```yaml
name: Build Web
runs-on: ubuntu-latest
needs: [build-web]
if: always()        # Run même si build-web failed/skipped
steps:
  - name: Report Build Web status
    run: |
      BUILD_RESULT="${{ needs.build-web.result }}"
      if [ "$BUILD_RESULT" = "failure" ]; then
        exit 1
      elif [ "$BUILD_RESULT" = "skipped" ]; then
        exit 0    # Skipped = OK (pas de changements web)
      else
        exit 0    # Passed
      fi
```

**Logique** :
- `build-web` failed → exit 1 (bloque PR)
- `build-web` skipped → exit 0 (OK, pas de changements)
- `build-web` success → exit 0 (OK)

**Pourquoi ?** GitHub require ce job car il s'appelle "Build Web". Si vous skip `build-web`, le status check serait gris (n/a) → confus. Ce job le rend vert (skipped = OK).

---

## CodeQL Workflow (codeql.yml)

**But** : Analyse SAST (Static Application Security Testing) sur JavaScript/TypeScript.

```yaml
name: CodeQL
on:
  pull_request:
    branches: [dev, staging, main]
  schedule:
    - cron: '0 6 * * 1'  # Chaque lundi 6h UTC
```

**Triggers** :
- PR vers branches sécurisées
- **Hebdo** : Détecte nouveaux CVE publiés (même sans changements)

```yaml
jobs:
  analyze:
    name: CodeQL Analyze (JS/TS)
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v6
      
      - uses: github/codeql-action/init@v4
        with:
          languages: javascript-typescript
          queries: security-and-quality
      
      - uses: github/codeql-action/autobuild@v4
      
      - uses: github/codeql-action/analyze@v4
        with:
          category: '/language:javascript-typescript'
```

**Phases** :
1. **Init** : Prepare CodeQL database
2. **Autobuild** : Compile project (if needed)
3. **Analyze** : Scan code patterns + build artifacts

**Résultats** : Security tab → Alerts. **Bloquant** si vulns critiques.

---

## Dependabot (dependabot.yml)

**But** : Auto-updates + auto-PRs pour dépendances.

```yaml
version: 2
updates:
  # npm dépendances
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
    groups:
      minor-and-patch:
        update-types:
          - minor
          - patch
    labels:
      - dependencies
      - security

  # GitHub Actions
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    labels:
      - ci
      - security
```

**Stratégie** :
- **Minor + patch** : Auto-groupées (1 PR/semaine max)
- **Major** : Separate PRs (manual review)
- **Actions** : Pin versions (CVE protection)

**Exemple PR Dependabot** :

```
Title: Bump @supabase/supabase-js from 2.39.0 to 2.40.0

Bumps @supabase/supabase-js from 2.39.0 to 2.40.0.

Changelog:
- Fix realtime connection leak
- Add support for PostgreSQL 16
```

**Process** :
1. Dependabot crée PR
2. CI runs (security, lint, typecheck, build)
3. Humain review si majeur ou CVE
4. Merge si tout vert

---

## Ordre d'exécution & dépendances

```
T=0
├─► changes (3m)  ◄─── Independent, run immediately
├─► validate-deps (5m) ◄─── Independent

T=5
├─► Après validate-deps OK:
│   ├─► security (10m) ├─┐
│   └─► lint-typecheck (15m) ├─► build-web (if web changed)
│
T=20
└─► build-web-final (reporter)

Total duration: ~20-25 min (parallel where possible)
```

**Dépendances explicites** :

```yaml
jobs:
  changes:
    needs: []
  
  validate-deps:
    needs: []
  
  security:
    needs: [validate-deps]
  
  lint-typecheck:
    needs: [validate-deps]
  
  build-web:
    needs: [changes, lint-typecheck, security]
  
  build-web-final:
    needs: [build-web]
```

**Optimisation** : Security + lint-typecheck run **parallèlement** (indépendants).

---

## Erreurs courantes & solutions

### Erreur 1: "package-lock.json out of sync"

```
npm ERR! code EBADLOCK
npm ERR! The npm ci command can only install with an existing package-lock.json
npm ERR! and package-lock.json must already exist!
```

**Cause** : Merge conflictuel, lockfile divergent.

**Solution** :
```bash
# Local
git merge dev
# Conflict in package-lock.json
rm package-lock.json package.json
git checkout --theirs package.json package-lock.json
npm install
git add package-lock.json package.json
git commit -m "fix: resolve lockfile conflict"
```

---

### Erreur 2: "npm audit found vulnerabilities"

```
npm ERR! audit Vulnerabilities found in dependencies
npm ERR! Run `npm audit fix` to fix them
```

**Cause** : Dépendance avec CVE HIGH/CRITICAL.

**Solutions** :

```bash
# 1. Auto-fix (if non-breaking)
npm audit fix

# 2. Force (if breaking accepted)
npm audit fix --force

# 3. Update specific package
npm update @package/name

# 4. Accept if acceptable risk
# (rare, documented en SECURITY.md)
```

---

### Erreur 3: "Gitleaks detected secrets"

```
Gitleaks found secrets in the repo
Commits: 74ed6b9, a7fe076
```

**Cause** : Secret hardcodé en git (même si maintenant en .gitignore).

**Solution** :

```bash
# 1. Identify commit
git show 74ed6b9 | grep -i secret

# 2. Rewrite history (destructive!)
# Better: just regenerate secret in Supabase Dashboard
# Update .gitleaks.toml allowlist if false positive
```

---

### Erreur 4: TypeScript error "Cannot find module"

```
apps/web/page.tsx:5:15 - error TS2307: Cannot find module '@carlink/shared'
```

**Cause** : Workspace reference absent ou bad `tsconfig.json`.

**Solution** :

```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@carlink/shared": ["../../packages/shared/src"]
    }
  }
}
```

---

### Erreur 5: Build timeout (> 20 min)

```
The operation timed out because the job took longer than the timeout period
```

**Cause** : Next.js build lent (images mal optimisées, webpack plugins, etc.).

**Solution** :

```bash
# Local: debug build
ANALYZE=true npm run build:web   # Voir bundle analysis

# Optimize:
# - Lazy load images with next/image
# - Remove unused dependencies
# - Check next.config.js plugins
```

---

## Optimisations appliquées

### 1. Concurrency & Cancellation

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

**Effet** : 1 run par branche. Nouveau push = annule ancien run.

**Gain** : Évite gaspillage resources, résultats rapides.

---

### 2. Change Detection (paths-filter)

```yaml
build-web:
  if: needs.changes.outputs.web == 'true'
```

**Effet** : Skip build si uniquement `apps/mobile/` changé.

**Gain** : ~20 min économisées si pas de changements web.

---

### 3. Parallel Jobs

```yaml
security:          # 10 min
lint-typecheck:    # 15 min
# Both run in parallel — total ~15 min (not 25 min)
```

**Effet** : Indépendants → exécution parallèle.

**Gain** : ~10 min économisées.

---

### 4. Caching Node Modules

```yaml
- uses: actions/setup-node@v6
  with:
    cache: npm     # Use npm cache action
```

**Effet** : GitHub cache `node_modules/` entre runs (~5-10 min/run).

**Gain** : Install ~30 sec (vs 2-3 min sans cache).

---

### 5. Selective Installs

```yaml
security:
  - run: npm ci --ignore-scripts   # No postinstall

build-web:
  - run: npm ci                     # Full install
```

**Effet** : Security audit skip postinstall (risque malveillant).

**Gain** : Sécurité + vitesse.

---

## Debugging Tips

### 1. View Workflow Logs

```
GitHub → Actions → PR workflow → Click job → View logs
```

**Key sections** :
- `Setup node` : Environment
- `Install dependencies` : npm ci output
- `Security Audit` : CVE détails
- `Build Web` : Next.js compiler output

---

### 2. Re-run Failed Job

```
GitHub → Actions → Failed workflow → "Re-run failed jobs"
```

**Use case** : Transient failure (network, timeout).

---

### 3. Debug Locally

```bash
# Run lint
npm run lint

# Run typecheck
npm run typecheck --workspace apps/web

# Run build
npm run build:web

# Run security audit
npm audit --audit-level=high --omit=dev
```

**Faster iteration** than waiting for CI.

---

### 4. Check Change Detection

```bash
# What would paths-filter detect?
git diff HEAD~1 --name-only
```

**Output** :
```
apps/web/page.tsx
packages/shared/src/types.ts
```

→ Both `web` and `mobile` flags = true (shared changed).

---

## Résumé Architecture

```
┌─────────────────────────────────────────────┐
│ PR Trigger                                  │
└────────────┬────────────────────────────────┘
             │
      ┌──────┴───────────────────┐
      │                          │
      ▼                          ▼
┌────────────────┐      ┌──────────────┐
│ ci.yml         │      │ codeql.yml   │
│ (on: PR)       │      │ (on: PR + cron)
│                │      │              │
│ • changes      │      │ Init CodeQL  │
│ • validate-deps        │ Autobuild    │
│ • security     │      │ Analyze      │
│ • lint-type    │      └──────────────┘
│ • build-web    │
│ • status report│
└────────────────┘
      │
      └─ Auto-gate: ❌ Fail = PR blocked
         ✅ Pass = Mergeable
         
Concurrency: 1 run/branch, cancel-in-progress
Total time: ~20-25 min (parallel optimized)
```

---

## Checklist: Avoiding CI Failures

- [ ] `npm install` locally before push (cache mismatch)
- [ ] `npm run lint` passes locally
- [ ] `npm run typecheck --workspace *` passes
- [ ] No hardcoded secrets (JWT, URLs, tokens)
- [ ] No CVE HIGH/CRITICAL in `npm audit`
- [ ] `.env.example` contains only placeholders
- [ ] `package-lock.json` committed (not gitignored)
- [ ] No unexpected dependencies added
- [ ] TypeScript `strict: true` enforced

---

## Resources

- **GitHub Actions docs** : https://docs.github.com/en/actions
- **Paths Filter** : https://github.com/dorny/paths-filter
- **Gitleaks** : https://github.com/gitleaks/gitleaks-action
- **CodeQL** : https://codeql.github.com/
- **Dependabot** : https://dependabot.com/
