# Onboard hedloc as a Reddoor fleet launch site — design

- **Date:** 2026-06-29
- **Status:** Approved (ready for implementation plan)
- **Repo:** hedloc (SvelteKit + Prismic content site, Prismic repo name `hedloc`)
- **Owner today:** `github.com/tucksravin/hedloc` → moving to `github.com/reddoorla/hedloc`

## Goal

Bring hedloc into the Reddoor fleet as a fully-managed **launch** site: layer on the
Claude Code autonomy guardrails ("allowlist + autonomy") from reddoor-maintenance,
align its stack to the reddoor-starter baseline, onboard it to the fleet tooling,
move the repo into the `reddoorla` GitHub org, and register + launch it in the fleet's
Airtable inventory.

## Glossary (grounded in reddoor-maintenance)

- **Reddoor fleet** — the set of Reddoor-maintained sites tracked in an Airtable
  **Websites** table; the maintenance CLI audits/reports on every row whose `Status`
  is in `ACTIVE_STATUSES` (`maintenance`, `launch period`).
- **Allowlist** — the `.claude/settings.json` permission rules (`allow`/`ask`/`deny`)
  **plus** the OS sandbox network/filesystem allowlist. Together they encode the
  blast-radius tiers and contain install-time supply-chain risk (Renovate auto-merge).
- **Autonomy** — the `AUTONOMY.md` behavioral contract (how Claude operates with
  reduced human intervention) + the `docs/autonomy-journal.md` audit trail.
- **Launch project** — a Websites row with `Status = "launch period"`; it uses the
  Launch report template and gets a `launchedAt` stamp when the launch report sends,
  then transitions to `maintenance`. Realized by the `launch` recipe
  (`src/recipes/launch.ts`): `selfUpdating` (bootstrap) → `runAudits` → draft Launch report.
- **Reddoor org** — the `reddoorla` GitHub organization.

## Goals / Non-goals

**Goals**
- hedloc has the autonomy guardrails (allowlist + `AUTONOMY.md` + journal), adapted for
  a content site.
- hedloc runs the reddoor-starter stack (adapter-netlify, pnpm, Tailwind 4, Vite 8, Lucide).
- hedloc is onboarded to the fleet tooling (`@reddoorla/maintenance` + audit deps + synced configs).
- The repo lives at `reddoorla/hedloc` with CI + branch protection + Renovate auto-merge.
- hedloc is registered in the Airtable Websites table as a `launch period` site and the
  `launch` recipe has produced a **draft** Launch report (sending stays human-gated).

**Non-goals**
- Sending the launch report (human-gated, out of scope here).
- Any content/design changes to the site itself.
- Changing other fleet sites.

## Confirmed decisions

1. **Scope:** full fleet onboarding (guardrails + auto-merge + onboard recipe). 
2. **Repo move:** transfer the existing repo (`tucksravin/hedloc` → `reddoorla`), preserving
   history/issues and GitHub's URL redirect.
3. **Stack:** full upgrade to the reddoor-starter baseline.
4. **Autonomy stance for prod deploys:** **permissive** — merge-to-`main` (which auto-deploys
   via Netlify) stays autonomous behind CI + adversarial review, relying on Netlify instant
   rollback + `git revert` as the reversibility backstop. The site is pre-launch (no client
   eyes yet), so a visibly-broken deploy carries no reputational cost.
5. **Airtable data:** use placeholders for production URL, point of contact, and GA4 property ID.

## Sequence (guardrails-first)

`C (allowlist/autonomy) → A (stack upgrade) → B (onboarding) → D (transfer + CI) → E (register + launch)`

Rationale: the sandbox's install-time containment is what makes the heavy dependency churn
of the stack upgrade (A) safe, and everything after runs under the autonomy contract.
Dependencies that force this order: B's synced configs assume the netlify/pnpm stack (so A
precedes B); D's CI/branch-protection/auto-merge must target the final repo location; E needs
`gitRepo = reddoorla/hedloc`.

---

## Workstream C — Allowlist + Autonomy

### C1 — `.claude/settings.json` (the allowlist), adapted for hedloc
- **`allow`:** `Bash(*)`; `Write`/`Edit` scoped to the hedloc repo
  (`/Users/tuckerlemos/Documents/GitHub/hedloc/**`) + its memory dir
  (`/Users/tuckerlemos/.claude/projects/-Users-tuckerlemos-Documents-GitHub-hedloc/memory/**`);
  `WebFetch` for the prod domain. Drop the parent's stale temp-dir `Read` entries (session cruft).
- **`deny`:** `git push --force*`, `git push -f`, `git push --force-with-lease`,
  `git reset --hard`, `git clean -fd(x)`, `rm -rf`/`rm -fr`, and reads of any credentials dir.
- **`ask`:** re-pointed at a site's outward/irreversible actions —
  `netlify:*`/`netlify deploy:*`/`--prod`, `gh secret:*`, `gh release:*`, `vercel:*`,
  `gh api … DELETE`. (No `npm publish` — hedloc ships no package.)
- **`sandbox`:** `enabled: true`.
  - network `allowedDomains`: `github.com`, `api.github.com`, `codeload.github.com`,
    `objects.githubusercontent.com`, `registry.npmjs.org`, `*.npmjs.org`,
    `*.prismic.io`, `*.cdn.prismic.io` (Prismic content fetch at build). Drop airtable/resend
    (those belong to the maintenance tool, not the site).
  - filesystem `allowWrite`: `/Users/tuckerlemos/Documents/GitHub`, `~/Library/pnpm`,
    `~/Library/Caches/ms-playwright`, `~/.npm`. `denyRead`: `~/.ssh`, `~/.aws`.
  - `excludedCommands`: `gh *`, `git *`, `pnpm test*/run*/exec*/build*/typecheck*/lint*/format*/vitest*`,
    `node*`, `npx*` (Seatbelt-incompatible; runs our own trusted code).
- **`.claude/settings.local.json`** (gitignored): read-only conveniences
  (`git log/status/diff/show/grep`, `ls/find/grep/rg/cat/head/tail/wc/pwd`,
  `pnpm test/build/lint/typecheck/audit`, `gh pr view/list`, `gh run list`) to cut prompt noise.
- **Convention:** the two `settings*.json` are **gitignored** (machine-specific absolute paths);
  also commit a sanitized **`.claude/settings.example.json`** so the config is reproducible.

### C2 — `AUTONOMY.md` (re-derived for a content site) + seed `docs/autonomy-journal.md`
Same structure as the parent (tiers / merge authority / stop conditions / working loop /
permissions & sandbox), but the irreversible chokepoint changes from `npm publish`
(fans out to ~200 fleet sites) to the **Netlify production deploy** (one client site,
instantly reversible).

Blast-radius tiers for hedloc:
- **🟢 GREEN** — edits, branches, commits, feature-branch push, PR create; reads;
  audits/build/test/lint/typecheck; Prismic content reads; **merge of CI-green,
  review-clean `fix` PRs** (deploys to prod, but instantly reversible).
- **🟡 YELLOW** — behavior-changing `feat` merges behind CI + 3-lens adversarial review
  (these deploy on merge; reversibility is the gate); Prismic model changes shipped via PR.
- **🔴 RED (never autonomous)** — custom-domain / DNS changes, `gh secret set`,
  branch-protection / org / billing changes, deleting Prismic documents or custom types the
  agent did not create, history rewrites (force-push, `reset --hard` on shared branches),
  manual out-of-git Netlify deploy promotion.

Merge authority (permissive): auto-merge any CI-green + review-clean PR; `fix` needs no separate
sign-off, `feat` gets the 3-lens review first; squash-merge, delete branch, append a journal entry.

---

## Workstream A — Stack upgrade (via `svelte4-to-5-upgrade` recipe)

Svelte 5 is already present; the deltas to reach the reddoor-starter baseline:
- Tailwind **3 → 4** (config/PostCSS migration, `@tailwindcss/vite`).
- Vite **6 → 8**.
- `@sveltejs/adapter-auto` → `@sveltejs/adapter-netlify`; rewrite the broken `netlify.toml`
  (currently `publish = "build/"` + a non-existent `functions/` dir — wrong for adapter-netlify).
- **npm → pnpm** (delete `package-lock.json`, add `pnpm-lock.yaml`, update scripts).
- Add **Lucide** (`lucide-svelte`).
- Align prettier/eslint/svelte.config to the fleet baseline.

**Verify:** `pnpm install`, `pnpm build`, `pnpm dev`, lint, typecheck, and a real app smoke-run.

## Workstream B — Fleet onboarding (`onboard` recipe)

Run `onboard` (via `node dist/cli/bin.js …` from the reddoor-maintenance checkout, or the recipe
directly). It adds `@reddoorla/maintenance` (caret-pinned to the package's own version),
`@sveltejs/adapter-netlify`, and audit deps (`@lhci/cli`, `@playwright/test`,
`@axe-core/playwright`); then `sync-configs` writes the fleet config templates
(eslint/prettier/svelte.config/CI). **Verify:** build still green after config sync.

## Workstream D — Org transfer + CI hardening

1. Pre: clean tree, everything pushed.
2. **Transfer (RED — confirm live before running):**
   `gh api -X POST repos/tucksravin/hedloc/transfer -f new_owner=reddoorla`
   (auth `tucksravin` has `admin:org` + `repo`; can see `reddoorla`).
3. `git remote set-url origin https://github.com/reddoorla/hedloc.git`; verify fetch/push.
4. Branch protection on `main`: require the CI status check + require PR (via `gh api`).
5. Secrets the Renovate/auto-merge workflow needs: inspect the self-updating templates to
   determine whether it's the Renovate **GitHub App** vs. a `RENOVATE_TOKEN` (CI uses the
   default `GITHUB_TOKEN`). `gh secret set` is RED → confirm before setting.

## Workstream E — Register + launch (placeholders)

1. Create the Airtable **Websites** row: `Name=Hedloc`, `URL=<placeholder>`,
   `gitRepo=reddoorla/hedloc`, `Status=launch period`, `pointOfContact=<placeholder>`,
   `GA4=<placeholder>`, default maintenance/testing frequencies.
   - *Open item:* whether the maintenance CLI exposes a row-**create** path, or the row is
     created via the Airtable API/MCP directly (parent references `mcp__airtable__update_field`).
     The CLI loads its own creds from `~/.config/reddoor-maint/credentials.env`.
2. Run the `launch` recipe (`node dist/cli/bin.js launch …`): `selfUpdating` bootstrap
   (CI + Renovate + auto-merge) → `runAudits` (Lighthouse) → write scores to the row →
   `createDraft` (reportType `Launch`). **Stops at a queued draft; sending is human-gated.**

## Verification strategy

Gate each workstream on green build/test/lint before starting the next. After A, smoke-run the
app. After D, confirm the new remote + a green CI run on `reddoorla/hedloc`. After E, confirm the
Websites row exists with the audited Lighthouse scores and a queued Launch draft.

## Risks & mitigations

- **Tailwind 4 migration breakage** — highest-likelihood failure; follow the recipe's ranked
  gotchas, verify build + visual smoke before moving on.
- **pnpm/adapter swap** — lockfile + adapter output changes; verify a clean `pnpm install` and a
  Netlify-shaped build.
- **Transfer is hard to undo** — mitigated by GitHub's automatic redirect of the old URL and a
  live confirmation before running; clean+pushed precondition.
- **Airtable row-create mechanism unknown** — resolve in planning; fallback is a pre-filled row
  for the operator to paste, then the CLI fills audit data.
- **Renovate auto-merge secret** — determine App vs. token before enabling auto-merge.

## Execution access (confirmed)

- `gh`: authed as `tucksravin`, scopes `admin:org`/`repo`/`workflow`; `reddoorla` visible.
- Maintenance CLI: runnable via `node /Users/tuckerlemos/Documents/GitHub/reddoor-maintenance/dist/cli/bin.js`;
  loads Airtable/GA creds from `~/.config/reddoor-maint/credentials.env`.
- Toolchain: node v24, pnpm 11.8.
