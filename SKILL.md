# SKILL.md — Auto-détection de Skills pour CarLink

## Objectif

Détecter automatiquement les skills adaptées sans demande explicite, basé sur le contexte et le type de tâche.

---

## Règles d'auto-détection

### 1. **Tâche = Roadmap / Planning**
**Patterns**: "roadmap", "sprint", "timeline", "planning", "backlog", "epic", "release"

**Skills auto-activées**:
- `/loop` — si suivi régulier nécessaire (status checks, reviews)
- Créer un doc Notion/Drive pour tracker

---

### 2. **Tâche = Design UI/UX**
**Patterns**: "design", "mockup", "wireframe", "figma", "component", "layout", "visual"

**Skills auto-activées**:
- `/figma-use` — modifier un design existant
- `/figma-generate-design` — créer un design depuis code
- Récupérer `get_design_context` depuis Figma

---

### 3. **Tâche = Sécurité / RLS / Secrets**
**Patterns**: "security", "rls", "policy", "secret", "auth", "permission", "grant", "encrypt"

**Skills auto-activées**:
- `/security-review` — audit des changements
- Vérifier `SECURITY.md` checklist
- Valider Zod schemas

---

### 4. **Tâche = CI/CD / Infra / GitHub Actions**
**Patterns**: "ci", "workflow", "deploy", "environment", "secret", "github", "action"

**Skills auto-activées**:
- `/update-config` — modifier settings.json
- Vérifier CODEOWNERS
- Valider les shell commands dans workflows

---

### 5. **Tâche = Backend / Supabase / DB**
**Patterns**: "migration", "schema", "postgres", "rls", "policy", "table", "bucket"

**Skills auto-activées**:
- Vérifier `supabase/migrations/` existe
- Valider RLS + grants
- Exiger validation Zod sur entrées

---

### 6. **Tâche = Code Review / PR**
**Patterns**: "review", "pr", "pull request", "comment", "feedback", "ci failure"

**Skills auto-activées**:
- `/review` — examiner la PR
- `subscribe_pr_activity` — suivre les changements
- `request_copilot_review` — review automatisé

---

### 7. **Tâche = Documentation / Architecture**
**Patterns**: "doc", "readme", "architecture", "adrs", "guide", "standards"

**Skills auto-activées**:
- `/init` — créer CLAUDE.md
- Lier à `docs/architecture.md` et `docs/gouvernance.md`

---

### 8. **Tâche = Dépendances / Versioning**
**Patterns**: "deps", "upgrade", "version", "bump", "dependabot", "lock"

**Skills auto-activées**:
- `/claude-api` — si SDK Anthropic upgradé
- Vérifier breaking changes manuellement
- Régénérer `package-lock.json` si touché

---

## Workflow Auto-détection

1. **Parser la demande utilisateur** → extraire les patterns clés
2. **Matcher contre les règles** → lister les skills candidates
3. **Charger les skills** AVANT d'agir (si disponibles)
4. **Exécuter la tâche** avec le contexte des skills

---

## Exemple de flux

```
User: "Crée une roadmap mobile pour S3/S4"
  ↓
Patterns détectés: [roadmap, mobile, sprint]
  ↓
Skills auto-chargées: /loop (si suivi régulier)
  ↓
Créer doc Notion/Drive + lancer suivi
```

---

## Fichiers de référence

- `CLAUDE.md` — rôle Security Engineer + standards
- `SECURITY.md` — checklist PR + journal sécurité
- `docs/architecture.md` — stack & schéma
- `docs/gouvernance.md` — standards code + DB

---

## À revérifier régulièrement

- [ ] Skills disponibles alignées avec codebase
- [ ] Patterns couvrent 80%+ des tâches courantes
- [ ] Pas de faux positifs (ex: "security" dans un message de commit)
- [ ] Nouvelles skills ajoutées → mis à jour dans SKILL.md
