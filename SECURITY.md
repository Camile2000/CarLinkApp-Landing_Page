# SECURITY.md — Référentiel sécurité CarLink

> **Ce document est LA source de vérité sécurité du projet.**
> Tout code, toute PR, toute migration DB doit le respecter.
> Maintenu par le rôle **Security Engineer** (assuré par Claude pendant le dev).

---

## 0. Contexte & conformité

**Produit** : CarLink — mise en relation conducteurs ⇄ garages (Côte d'Ivoire / Afrique de l'Ouest).

**Réglementations applicables :**

| Loi | Portée | Obligation |
|-----|--------|-----------|
| Loi N°2013-450 (Côte d'Ivoire) | Données personnelles | Consentement, déclaration ARTCI, droit d'accès/suppression |
| Convention de Malabo (UA) | Cybersécurité Afrique | Sécurisation données, notification de violation |
| GDPR | Users UE (diaspora) | Droit à l'effacement, portabilité, registre de traitement |
| PCI-DSS (phase 2) | Mobile Money / CinetPay | **Ne JAMAIS stocker de données carte** — tout déléguer au PSP |

**Threat model — contexte africain :**

- Mobile-first (90% trafic mobile, réseaux instables) → risque MITM sur Wi-Fi public
- Fraude Mobile Money (SIM swap, ingénierie sociale Orange/MTN Money)
- Téléphones partagés → risque de détournement de session
- Connexions non fiables → logique de retry = risque de double-soumission / replay
- Faible littératie sécurité → phishing facile → MFA simple obligatoire (admins)

---

## 1. Règles ABSOLUES (jamais d'exception)

1. **Aucun secret dans le code ou git.** Pas de clé, token, mot de passe, URL projet réelle. Les fichiers `.env.example` ne contiennent que des placeholders `xxxxxx`.
2. **RLS activé sur 100% des tables.** Toute nouvelle table = RLS ON + policies avec `WITH CHECK` sur les écrits, avant tout déploiement.
3. **Helpers RLS dans le schéma `private`**, jamais `public` (non exposé par PostgREST).
4. **`service_role` server-side uniquement.** Jamais dans un Client Component, jamais embarqué dans l'app mobile.
5. **Validation de toute entrée externe** (API, formulaire, upload) avec un schéma typé (Zod) — jamais de confiance aveugle.
6. **Pas de PII d'autrui exposée.** Lookups cross-user via la vue `user_profiles` uniquement. Jamais `users.phone` / `users.email` d'un autre user côté client.
7. **HTTPS/TLS partout.** Aucune communication en clair.
8. **Dépendances : `npm ci` + `--ignore-scripts` en CI.** Bloque sur CVE HIGH/CRITICAL.

---

## 2. Checklist OBLIGATOIRE par PR

Avant de merger toute PR, vérifier :

- [ ] Aucun secret ajouté (vérifié par hook + CI Gitleaks)
- [ ] Aucune nouvelle table sans RLS + policies `WITH CHECK`
- [ ] Toute entrée externe validée (Zod) côté serveur
- [ ] Pas de `service_role` côté client / mobile
- [ ] Pas de SELECT de PID/PII d'autrui hors `user_profiles`
- [ ] `npm audit --audit-level=high --omit=dev` passe
- [ ] TypeScript strict OK sur les 3 workspaces
- [ ] Pas de `console.log` laissant fuiter des données sensibles
- [ ] Si migration DB : section "impact sécurité" dans la description PR

---

## 3. Les 7 couches — état & roadmap

| Couche | Implémenté | À faire | Phase |
|--------|-----------|---------|-------|
| **1. CI/CD & supply chain** | npm ci, audit, secret scan, paths-filter | Dependabot, CodeQL, Semgrep, Gitleaks | P0 ✅ |
| **2. Application** | TS strict, RLS | Zod validation, rate limiting, CSP strict | P1 |
| **3. Database** | RLS 24 policies, private schema, WITH CHECK | audit_logs table, soft deletes | P2 |
| **4. Infra & secrets** | GitHub Environments, HTTPS | Cloudflare WAF (gratuit), rotation clés | P3 |
| **5. Monitoring** | — | Sentry free, alerts breach | P3 |
| **6. Identity & accès** | rôles, JWT, RLS | MFA admin (Supabase Auth TOTP) | P4 |
| **7. Incident response** | — | Playbooks breach/leak | P4 |

---

## 4. Procédures

### Fuite de secret détectée
1. Révoquer/régénérer immédiatement la clé (dashboard Supabase → Settings → API).
2. Remplacer par placeholder dans le code, commit.
3. Noter dans le journal §6.
4. Si la clé était `service_role` : audit des logs Supabase pour accès anormaux.

> **Note connue** : la clé anon Supabase a été exposée dans l'historique git (PR#7, commit `e7d1423`). Elle est protégée par RLS mais devrait être régénérée pour un historique propre. **Action recommandée : régénérer dans Supabase dashboard.**

### Nouvelle table / migration
1. RLS ON dès la création.
2. Policies SELECT/INSERT/UPDATE/DELETE explicites + `WITH CHECK`.
3. Helper dans `private` si logique réutilisée.
4. PR : section "impact sécurité" (qui peut lire/écrire quoi).

---

## 5. Outils sécurité (100% gratuit)

| Besoin | Outil | Où |
|--------|-------|-----|
| Dépendances vulnérables | GitHub Dependabot | `.github/dependabot.yml` |
| Analyse statique code | GitHub CodeQL | `.github/workflows/codeql.yml` |
| Patterns dangereux | Semgrep OSS | job `security` dans `ci.yml` |
| Secrets dans le code | Gitleaks | hook pré-commit + `ci.yml` |
| Validation entrées | Zod | dépendance npm (P1) |
| Audit CVE | npm audit | job `security` dans `ci.yml` |

---

## 6. Journal sécurité

| Date | Événement | Action | Statut |
|------|-----------|--------|--------|
| 2026-05-18 | Clé anon + URL Supabase réelles dans `apps/mobile/.env.example` (PR#7) | Remplacées par placeholders (commit `74ed6b9`) | ✅ Corrigé — clé à régénérer côté Supabase |
| 2026-05-18 | Mise en place P0 (SECURITY.md, hook, CodeQL, Dependabot, Gitleaks, Semgrep) | — | ✅ Fait |
| 2026-05-19 | Optimisation RLS : correction `auth_rls_initplan` (auth.uid/is_admin/owns_garage sans sous-select) + fusion `multiple_permissive_policies` sur 8 tables | Migration `20260519000000_optimize_rls_policies.sql` créée, aucun élargissement d'accès | ✅ Fait |
| 2026-05-27 | Création RPC `check_email_status` et `check_email_role` (SECURITY DEFINER, exposées `anon`/`authenticated`) → warnings Security Advisor 0028/0029 | Risque d'énumération **accepté** (mitigé par rate limiting frontend + messages neutres dans UX). `search_path` durci, `COMMENT ON FUNCTION` documenté. Migration `20260527020000_email_check_rpc_hardening.sql` | ⚠️ Risque accepté |
| 2026-05-27 | Protection HaveIBeenPwned activée sur Supabase Auth (warning `auth_leaked_password_protection`) | Activation dashboard `Authentication → Policies → Password Strength` | ✅ Fait |
