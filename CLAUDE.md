# CLAUDE.md — Instructions projet CarLink

## Langue et méthode de travail (permanent)

- **Toujours répondre en français.** Les termes techniques (noms de fichiers, commandes, concepts dev) restent en anglais.
- **Méthode obligatoire avant toute action** :
  1. **Analyser** le problème
  2. **Expliquer** ce qui se passe et pourquoi
  3. **Proposer** une ou plusieurs solutions avec les raisons de chaque choix
  4. **Attendre la décision du client** avant d'implémenter quoi que ce soit
- Ne jamais coder ou modifier des fichiers sans que le client ait validé la proposition.

---

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

- Monorepo npm workspaces : `apps/mobile` (Expo), `apps/web` (Next.js), `packages/shared`.
- Backend : Supabase (Postgres + Auth + Realtime + Storage), sécurité par RLS.
- Détails : [`docs/architecture.md`](./docs/architecture.md).

---

## Workflow Git

- Branches actives : `claude/mobile` · `claude/web-admin` · `claude/backend-supabase` → PR → `dev` → `staging` → `main`.
- **Jamais de push direct sur `main`, `staging`, `dev`.**
- Toute PR déclenche la CI complète (security + lint + typecheck + build).
- Une PR = un objectif précis. Pas de PR qui mélange mobile + web + RLS + storage.
- Toute PR doit répondre aux 7 questions du template (voir [`docs/gouvernance.md`](./docs/gouvernance.md)).

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

## Structure cible du projet

```
apps/
  mobile/src/features/auth/
  mobile/src/features/garages/
  mobile/src/features/quotes/
  mobile/src/features/messages/
  mobile/src/features/reviews/
  web/app/admin/garages/
  web/app/admin/reviews/
packages/shared/src/
  supabase/        ← factory client centralisée
  types/           ← types générés depuis Supabase
  validators/      ← schémas Zod partagés
supabase/
  migrations/      ← toutes les migrations versionnées
  policies/        ← policies RLS documentées
docs/
  architecture.md
  gouvernance.md   ← ce fichier, source de vérité gouvernance
  decisions/       ← ADR (Architecture Decision Records)
```

---

## Checklist hebdomadaire (fin de semaine)

- [ ] PR vers `dev` propre avec CI verte.
- [ ] `npm run lint` + `npm run typecheck` passent localement.
- [ ] Test manuel mobile + admin.
- [ ] Test RLS minimum (conducteur A ≠ conducteur B).
- [ ] Vérification Supabase logs (erreurs, accès anormaux).
- [ ] Vérification Performance Advisor + Security Advisor Supabase.
- [ ] Aucune alerte Dependabot ou CodeQL non traitée.
- [ ] Merge vers `staging` seulement si tout est stable.
