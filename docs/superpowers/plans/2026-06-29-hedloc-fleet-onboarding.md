# hedloc Fleet Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Onboard hedloc as a fully-managed Reddoor fleet **launch** site — autonomy guardrails, reddoor-starter stack, fleet tooling, repo moved into the `reddoorla` org, and registered as a `launch period` site in Airtable.

**Architecture:** Guardrails-first sequence — establish the Claude Code allowlist/sandbox + `AUTONOMY.md` contract, then upgrade the stack (via the `svelte4-to-5-upgrade` skill), then run the maintenance recipes (`onboard` + `sync-configs`) against the local checkout with `--cwd`, then transfer the GitHub repo and let `self-updating` wire CI/Renovate/auto-merge/branch-protection, then register the Airtable Websites row. The `launch` recipe's audit step needs the real production URL, so it is a documented follow-up after the placeholder URL is replaced.

**Tech Stack:** SvelteKit 2 + Svelte 5, Prismic CMS, Tailwind 4, Vite 8, pnpm, `@sveltejs/adapter-netlify`, Lucide, `@reddoorla/maintenance` (eslint/prettier/lighthouse/playwright/svelte config presets), GitHub Actions + Renovate, Airtable fleet inventory.

---

## Conventions & key facts (read before starting)

- **hedloc checkout:** `/Users/tuckerlemos/Documents/GitHub/hedloc` (referred to below as `$HEDLOC`).
- **maintenance CLI:** run as `node /Users/tuckerlemos/Documents/GitHub/reddoor-maintenance/dist/cli/bin.js <command>` (written out in full in each command below). It loads Airtable/GA creds from `~/.config/reddoor-maint/credentials.env`.
- **scratchpad:** the session scratchpad dir `/private/tmp/claude-501/-Users-tuckerlemos-Documents-GitHub-hedloc/4f032905-a260-48fd-9f88-92c73e1afbef/scratchpad` (referred to as `$SCRATCH`) for one-off scripts.
- **Recipes accept `--cwd <path>`** so they operate on `$HEDLOC` without the fleet clone.
- **GitHub auth:** `gh` is authed as `tucksravin` with `admin:org` + `repo` + `workflow`; the `reddoorla` org is visible.
- **RED actions (always confirm with the operator in the moment):** the repo transfer (Task 4.2), `gh secret set` / the `self-updating` secret write (Task 5.3), and branch-protection changes (Task 5.3). Pause and get an explicit go-ahead before each.
- **Commit style:** small, single-purpose commits; Conventional Commits prefixes (`chore:`, `feat:`, `docs:`). Some recipes auto-commit (noted inline).
- **Branch:** all work happens on the existing `fleet-onboarding` branch until Phase 4.

---

## Phase 1 — Autonomy guardrails (workstream C)

### Task 1.1: Harden `.gitignore`

**Files:**
- Modify: `$HEDLOC/.gitignore` (currently contains only `node_modules`)

- [ ] **Step 1: Replace `.gitignore` with the hardened version**

```
node_modules
/build
/.svelte-kit
/.netlify
.env
.env.*
!.env.example
.DS_Store
pnpm-debug.log*

# Claude Code local autonomy config (machine-specific; committed as .claude/settings.example.json)
.claude/settings.json
.claude/settings.local.json
```

- [ ] **Step 2: Verify the ignore rules resolve**

Run: `cd $HEDLOC && git check-ignore -v .claude/settings.json .svelte-kit build`
Expected: each path prints a matching `.gitignore` line.

- [ ] **Step 3: Commit**

```bash
cd $HEDLOC
git add .gitignore
git commit -m "chore: harden .gitignore for fleet stack and autonomy config"
```

### Task 1.2: Create `.claude/settings.json` (the allowlist — gitignored)

**Files:**
- Create: `$HEDLOC/.claude/settings.json`

- [ ] **Step 1: Write the file**

```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Write(/Users/tuckerlemos/Documents/GitHub/hedloc/**)",
      "Edit(/Users/tuckerlemos/Documents/GitHub/hedloc/**)",
      "Write(/Users/tuckerlemos/.claude/projects/-Users-tuckerlemos-Documents-GitHub-hedloc/memory/**)",
      "Edit(/Users/tuckerlemos/.claude/projects/-Users-tuckerlemos-Documents-GitHub-hedloc/memory/**)"
    ],
    "deny": [
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(git push --force-with-lease:*)",
      "Bash(git reset --hard:*)",
      "Bash(git clean -fdx:*)",
      "Bash(git clean -fd:*)",
      "Bash(rm -rf:*)",
      "Bash(rm -fr:*)",
      "Read(/Users/tuckerlemos/.config/reddoor-maint/**)"
    ],
    "ask": [
      "Bash(netlify:*)",
      "Bash(netlify deploy:*)",
      "Bash(vercel:*)",
      "Bash(gh secret:*)",
      "Bash(gh release:*)",
      "Bash(gh api:* -X DELETE:*)",
      "Bash(gh api:* --method DELETE:*)"
    ]
  },
  "sandbox": {
    "enabled": true,
    "network": {
      "allowedDomains": [
        "github.com",
        "api.github.com",
        "codeload.github.com",
        "objects.githubusercontent.com",
        "registry.npmjs.org",
        "*.npmjs.org",
        "*.prismic.io",
        "*.cdn.prismic.io"
      ]
    },
    "filesystem": {
      "allowWrite": [
        "/Users/tuckerlemos/Documents/GitHub",
        "~/Library/pnpm",
        "~/Library/Caches/ms-playwright",
        "~/.npm"
      ],
      "denyRead": [
        "~/.ssh",
        "~/.aws"
      ]
    },
    "excludedCommands": [
      "gh *",
      "git *",
      "pnpm test*",
      "pnpm run*",
      "pnpm exec*",
      "pnpm build*",
      "pnpm typecheck*",
      "pnpm lint*",
      "pnpm format*",
      "pnpm vitest*",
      "node*",
      "npx*"
    ]
  }
}
```

- [ ] **Step 2: Verify it is valid JSON and gitignored**

Run: `cd $HEDLOC && node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'));console.log('ok')" && git status --porcelain .claude/settings.json`
Expected: prints `ok`; `git status` shows NO output for that path (ignored).

### Task 1.3: Create `.claude/settings.local.json` (read-only conveniences — gitignored)

**Files:**
- Create: `$HEDLOC/.claude/settings.local.json`

- [ ] **Step 1: Write the file**

```json
{
  "permissions": {
    "allow": [
      "Bash(git log:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git show:*)",
      "Bash(git branch:*)",
      "Bash(git grep:*)",
      "Bash(git rev-parse:*)",
      "Bash(git ls-files:*)",
      "Bash(git stash:*)",
      "Bash(git worktree:*)",
      "Bash(ls:*)",
      "Bash(find:*)",
      "Bash(grep:*)",
      "Bash(rg:*)",
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(wc:*)",
      "Bash(pwd:*)",
      "Bash(date:*)",
      "Bash(pnpm install:*)",
      "Bash(pnpm build:*)",
      "Bash(pnpm check:*)",
      "Bash(pnpm lint:*)",
      "Bash(pnpm format:*)",
      "Bash(pnpm test:*)",
      "Bash(pnpm audit:*)",
      "Bash(pnpm exec prettier:*)",
      "Bash(pnpm exec eslint:*)",
      "Bash(gh pr list:*)",
      "Bash(gh pr view:*)",
      "Bash(gh repo view:*)",
      "Bash(gh run list:*)",
      "Bash(gh run view:*)"
    ]
  }
}
```

- [ ] **Step 2: Verify valid JSON**

Run: `cd $HEDLOC && node -e "JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8'));console.log('ok')"`
Expected: `ok`.

### Task 1.4: Create `.claude/settings.example.json` (committed, sanitized)

**Files:**
- Create: `$HEDLOC/.claude/settings.example.json`

- [ ] **Step 1: Write the file** (same shape as `settings.json`, with machine paths replaced by `<REPO_ROOT>` / `<GITHUB_ROOT>` placeholders so the config is reproducible on another machine)

```json
{
  "_note": "Copy to .claude/settings.json and replace <…> placeholders with absolute paths. See AUTONOMY.md for the blast-radius tiers this encodes.",
  "permissions": {
    "allow": [
      "Bash(*)",
      "Write(<REPO_ROOT>/**)",
      "Edit(<REPO_ROOT>/**)"
    ],
    "deny": [
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(git push --force-with-lease:*)",
      "Bash(git reset --hard:*)",
      "Bash(git clean -fdx:*)",
      "Bash(git clean -fd:*)",
      "Bash(rm -rf:*)",
      "Bash(rm -fr:*)"
    ],
    "ask": [
      "Bash(netlify:*)",
      "Bash(netlify deploy:*)",
      "Bash(vercel:*)",
      "Bash(gh secret:*)",
      "Bash(gh release:*)",
      "Bash(gh api:* -X DELETE:*)",
      "Bash(gh api:* --method DELETE:*)"
    ]
  },
  "sandbox": {
    "enabled": true,
    "network": {
      "allowedDomains": [
        "github.com",
        "api.github.com",
        "codeload.github.com",
        "objects.githubusercontent.com",
        "registry.npmjs.org",
        "*.npmjs.org",
        "*.prismic.io",
        "*.cdn.prismic.io"
      ]
    },
    "filesystem": {
      "allowWrite": [
        "<GITHUB_ROOT>",
        "~/Library/pnpm",
        "~/Library/Caches/ms-playwright",
        "~/.npm"
      ],
      "denyRead": ["~/.ssh", "~/.aws"]
    },
    "excludedCommands": [
      "gh *", "git *",
      "pnpm test*", "pnpm run*", "pnpm exec*", "pnpm build*",
      "pnpm typecheck*", "pnpm lint*", "pnpm format*", "pnpm vitest*",
      "node*", "npx*"
    ]
  }
}
```

- [ ] **Step 2: Verify valid JSON**

Run: `cd $HEDLOC && node -e "JSON.parse(require('fs').readFileSync('.claude/settings.example.json','utf8'));console.log('ok')"`
Expected: `ok`.

### Task 1.5: Create `AUTONOMY.md` (the contract, re-derived for a content site)

**Files:**
- Create: `$HEDLOC/AUTONOMY.md`

- [ ] **Step 1: Write the file**

````markdown
# Autonomy contract

How the AI agent (Claude) operates on this repo with reduced human intervention. The
goal is to drive well-specified work PR-by-PR to green **without per-step approval**,
while keeping every unattended action either reversible or caught by a gate first.

This is a **behavioral contract**, not a security boundary. The `.claude/settings.json`
allowlist (committed sanitized as `.claude/settings.example.json`) reduces prompt noise
and declares intent; it is not a sandbox. The binding controls are (a) the agent
following this contract, (b) CI being required on `main`, and (c) the one
class of outward action — a **production deploy** — being reversible (Netlify keeps every
deploy; rollback is one click) rather than gated.

## The model: autonomy scales with reversibility

hedloc is a Prismic content site that **auto-deploys from `main` via Netlify**, so a merge
to `main` is a production deploy. Unlike a published package, a bad deploy here affects only
this one site and is recoverable in ~1 minute: redeploy the previous build (Netlify instant
rollback) and/or `git revert` + rebuild. The site is also pre-launch — no client is viewing
it yet. So merge-to-`main` can move fast; reversibility, CI, and adversarial review are the
safety, not a human gate.

## Blast-radius tiers

### 🟢 GREEN — fully autonomous, no prompt
- Edits, branches, commits, push to **feature** branches, PR **create**.
- **Merge of CI-green, adversarial-review-clean `fix` PRs** (deploys on merge; instantly reversible).
- Reads of GitHub / Prismic content; running builds, `svelte-check`, lint, lighthouse/a11y audits.

### 🟡 YELLOW — autonomous behind a stronger gate, logged + reversible
- Behavior-changing `feat` merges — allowed unattended **only** when CI is green AND a 3-lens
  adversarial review is clean. These deploy to prod on merge; reversibility is the gate. Logged
  in `docs/autonomy-journal.md`.
- Prismic content-model (Slice Machine) changes shipped through a PR.

### 🔴 RED — never autonomous (human checkpoint, every time)
- Custom-domain / DNS changes; manual out-of-git Netlify deploy promotion or env-var changes.
- Secrets (`gh secret set`), branch-protection / org / billing changes.
- Deleting Prismic documents or custom types the agent did not create.
- History rewrites (force-push, `reset --hard` on shared branches); deletes of data the agent
  did not create.

## Merge authority (policy: "everything but RED")
The agent may **auto-merge any PR** once it is CI-green and adversarial-review clean — including
`feat`s — **except** any PR that itself performs a RED action (→ always human). Squash-merge,
delete the branch, and append a journal entry. `fix` PRs need no separate sign-off; `feat`s get
the 3-lens review before merge.

## Stop conditions — pause regardless of permissions
1. A genuine **product / design / direction fork** — not the agent's to decide.
2. Any **RED** action.
3. **CI failing > 2 times** on the same change without a clear fix — stop, report, ask.
4. Anything that **deletes data or rewrites history**.
5. **Scope creep** beyond the agreed task.
6. A finding that contradicts how something was described — surface it, don't "fix" past it.

## The working loop
1. **TDD where there is logic to test**; for content/UI changes, verify via build + a real
   browser smoke-run.
2. **Adversarial review** — fresh subagents review the diff across distinct lenses; every real
   finding is folded in before merge.
3. **Small, single-purpose PRs** — one concern each, so any one is revertable.
4. **Journal** — append what + why to [`docs/autonomy-journal.md`](docs/autonomy-journal.md).

## Permissions & sandbox
`.claude/settings.json` (local, gitignored; sanitized template at `.claude/settings.example.json`)
encodes the tiers as allow / ask / deny rules: GREEN commands are `allow`ed (broad `Bash(*)`);
RED commands are in `ask` (deploy / secrets — forces a prompt) or `deny` (force-push,
`reset --hard`, `rm -rf`). The OS sandbox is enabled (macOS Seatbelt): `pnpm install`
postinstall scripts run sandboxed with a network allowlist (github, npm, prismic) and no read
access to `~/.ssh` / `~/.aws` — the supply-chain containment that matters for Renovate
auto-merge. The dev loop (`gh`, `git`, `pnpm build/test/lint`, `node`, `npx`) runs unsandboxed
via `excludedCommands` (Seatbelt-incompatible; our own trusted code).
````

- [ ] **Step 2: Verify it renders as valid markdown (no broken fences)**

Run: `cd $HEDLOC && grep -c '^```' AUTONOMY.md`
Expected: an even number (all fences closed).

### Task 1.6: Seed `docs/autonomy-journal.md`

**Files:**
- Create: `$HEDLOC/docs/autonomy-journal.md`

- [ ] **Step 1: Write the file**

```markdown
# Autonomy journal

Append-only log of unattended/agentic changes on hedloc: what changed, why, and how it was
verified. Newest entries on top. See [`AUTONOMY.md`](../AUTONOMY.md) for the contract.

## 2026-06-29 — Fleet onboarding
- Established the autonomy guardrails (`.claude/settings.json` allowlist + sandbox,
  `AUTONOMY.md`, this journal). See `docs/superpowers/plans/2026-06-29-hedloc-fleet-onboarding.md`.
```

- [ ] **Step 2: Commit the committed guardrail files** (settings.json / settings.local.json stay gitignored)

```bash
cd $HEDLOC
git add AUTONOMY.md docs/autonomy-journal.md .claude/settings.example.json
git commit -m "feat: add autonomy contract + allowlist template (workstream C)"
```

- [ ] **Step 3: Verify the gitignored settings did NOT get committed**

Run: `cd $HEDLOC && git ls-files .claude/`
Expected: only `.claude/settings.example.json` is listed.

---

## Phase 2 — Stack upgrade to the reddoor-starter baseline (workstream A)

This phase is delegated to the **`svelte4-to-5-upgrade` skill**, which encodes the proven recipe
and gotchas. hedloc is already on Svelte 5, so the active deltas are: Tailwind 3→4, Vite 6→8,
`@sveltejs/adapter-auto`→`@sveltejs/adapter-netlify`, npm→pnpm, add Lucide, and dep bumps.

### Task 2.1: Run the stack upgrade

**Files (expected to change):**
- Modify: `$HEDLOC/package.json` (deps + scripts), `$HEDLOC/svelte.config.js` (adapter-netlify),
  `$HEDLOC/postcss.config.js` → Tailwind 4 plugin, `$HEDLOC/src/app.css` (Tailwind 4 import),
  `$HEDLOC/tailwind.config.js`, `$HEDLOC/vite.config.js`, `$HEDLOC/netlify.toml`
- Create: `$HEDLOC/pnpm-lock.yaml`
- Delete: `$HEDLOC/package-lock.json`

- [ ] **Step 1: Invoke the upgrade skill**

Invoke the `svelte4-to-5-upgrade` skill and follow its 7-commit recipe against `$HEDLOC`. Apply these hedloc-specific deltas/gotchas (verified from the current files):
- **app.css** uses Tailwind 3 directives `@tailwind base; @tailwind components; @tailwind utilities;` → replace with `@import "tailwindcss";` (Tailwind 4). Preserve all the custom CSS below the directives (body/scrollbar rules, `.bump`/`.negative-bump`, the `svelte-select` overrides, `.filter-to-dark`).
- **postcss.config.js** uses `{ tailwindcss: {}, autoprefixer: {} }` → Tailwind 4 uses the `@tailwindcss/postcss` plugin (or the `@tailwindcss/vite` plugin in `vite.config.js`); autoprefixer is no longer needed.
- **tailwind.config.js** has duplicate `height` keys (`screen-75/50/25/10/5` repeated) and an invalid `'proportion': 'proportion'` entry — clean these up while migrating the theme (custom `screens`, `colors` incl. the stray `light:'#C8AF5E;'` trailing semicolon, and `transitionTimingFunction`). Keep the `safelist`.
- **svelte.config.js**: swap `@sveltejs/adapter-auto` → `@sveltejs/adapter-netlify` (Phase 3's `sync-configs` will later overlay the canonical `createSvelteConfig` version — that's expected).
- **package.json**: convert scripts to pnpm; keep the `concurrently` dev script + `slicemachine`. Remove `autoprefixer` from devDeps. Add `lucide-svelte`.
- **app.html** keeps the Typekit stylesheet link (`https://use.typekit.net/nnm4nwt.css`) — leave it.
- Delete `package-lock.json`; generate `pnpm-lock.yaml` via `pnpm install`.

- [ ] **Step 2: Verify the build is green on the new stack**

Run:
```bash
cd $HEDLOC
pnpm install
pnpm run build
pnpm run check
pnpm run lint
```
Expected: install succeeds; `build` completes with the adapter-netlify output in `build/`; `check` (svelte-check) reports 0 errors; `lint` passes (or only pre-existing style nits — fix them).

- [ ] **Step 3: Smoke-run the app in a browser**

Use the `/run` skill (or `pnpm run dev` + open `http://localhost:5173`). Confirm the home page renders with the Typekit font and the Tailwind styles intact (background `#2D2322`, custom colors), and that at least one slice page loads.

- [ ] **Step 4: Commit**

The `svelte4-to-5-upgrade` recipe commits in its own steps. If any changes remain unstaged after the skill finishes:
```bash
cd $HEDLOC
git add -A
git commit -m "chore: upgrade to reddoor-starter stack (Tailwind 4, Vite 8, adapter-netlify, pnpm, Lucide)"
```

---

## Phase 3 — Fleet onboarding (workstream B)

Run the maintenance recipes against the local checkout with `--cwd`. `onboard` adds the
maintenance + audit deps and installs them; `sync-configs` writes the canonical fleet configs
(which require `@reddoorla/maintenance` to be installed first — so order matters).

### Task 3.1: Confirm the maintenance CLI is runnable

- [ ] **Step 1: Build the CLI if `dist` is stale, then smoke it**

Run:
```bash
cd /Users/tuckerlemos/Documents/GitHub/reddoor-maintenance
node dist/cli/bin.js --help
```
Expected: the CLI help lists `onboard`, `self-updating`, `sync-configs`, `launch`. If it errors (stale/missing `dist`), run `pnpm install && pnpm build` in that repo first, then retry.

### Task 3.2: Run `onboard` against hedloc

**Files (changed by the recipe):** `$HEDLOC/package.json` (devDeps), `$HEDLOC/pnpm-lock.yaml`

- [ ] **Step 1: Dry-run preview**

Run:
```bash
node /Users/tuckerlemos/Documents/GitHub/reddoor-maintenance/dist/cli/bin.js onboard --cwd $HEDLOC --audits lighthouse,a11y --verbose
```
Note: `onboard` has no `--dry`; read the verbose output as it runs. It adds (to `devDependencies`):
`@reddoorla/maintenance@<caret>`, `@sveltejs/adapter-netlify@^6.0.4`, `@lhci/cli@^0.15.1`,
`@playwright/test@^1.60.0`, `@axe-core/playwright@^4.11.3`, then runs `pnpm install` and commits
`chore(reddoor): onboard with @reddoorla/maintenance <version>`.

- [ ] **Step 2: Verify deps were added and installed**

Run: `cd $HEDLOC && grep -E '@reddoorla/maintenance|@lhci/cli|@axe-core/playwright|adapter-netlify' package.json && pnpm run build`
Expected: all four package names present in `package.json`; build still green.

- [ ] **Step 3: Confirm the recipe's commit landed (or commit if it did not)**

Run: `cd $HEDLOC && git log --oneline -1`
Expected: the `chore(reddoor): onboard …` commit. If the recipe did not auto-commit, run `git add -A && git commit -m "chore(reddoor): onboard with @reddoorla/maintenance"`.

### Task 3.3: Run `sync-configs` against hedloc

**Files (written by the recipe):** `$HEDLOC/eslint.config.js`, `$HEDLOC/.prettierrc.json`,
`$HEDLOC/.prettierignore`, `$HEDLOC/lighthouserc.json`, `$HEDLOC/playwright.config.ts`,
`$HEDLOC/svelte.config.js` (canonical), `$HEDLOC/netlify.toml` (canonical + security headers),
`$HEDLOC/.gitignore` (merged)

- [ ] **Step 1: Dry-run preview**

Run:
```bash
node /Users/tuckerlemos/Documents/GitHub/reddoor-maintenance/dist/cli/bin.js sync-configs --cwd $HEDLOC --dry --verbose
```
Expected: a diff of the config files above. The `svelte.config.js` will be rewritten to the
`createSvelteConfig` + `adapter-netlify` form (replacing Phase 2's interim adapter swap); the
`.gitignore` is merged (our Phase 1 entries are preserved). Review that nothing site-specific is lost.

- [ ] **Step 2: Apply for real**

Run:
```bash
node /Users/tuckerlemos/Documents/GitHub/reddoor-maintenance/dist/cli/bin.js sync-configs --cwd $HEDLOC --verbose
```

- [ ] **Step 3: Reconcile and verify the full toolchain**

Run:
```bash
cd $HEDLOC
pnpm install
pnpm run lint
pnpm run check
pnpm run build
```
Expected: `eslint.config.js` resolves `@reddoorla/maintenance/configs/eslint`; lint + check + build all pass. If lint flags formatting, run `pnpm run format` and re-run. Confirm `.gitignore` still ignores `.claude/settings.json` (the merge must not have dropped it):
`git check-ignore -v .claude/settings.json` → expected: matches.

- [ ] **Step 4: Commit**

```bash
cd $HEDLOC
git add -A
git commit -m "chore(reddoor): sync fleet configs (eslint/prettier/lighthouse/playwright/svelte/netlify)"
```

### Task 3.4: Integrate the branch into `main` (pre-CI)

Branch protection is not in place yet (CI is added in Phase 5), and the site is pre-launch, so the
onboarding work lands on `main` directly here; all *future* changes go through the PR/CI flow.

- [ ] **Step 1: Fast-forward `main` to `fleet-onboarding`**

Run:
```bash
cd $HEDLOC
git checkout main
git merge --ff-only fleet-onboarding
```
Expected: `main` advances to the branch tip with no merge commit.

- [ ] **Step 2: Verify `main` builds clean**

Run: `cd $HEDLOC && pnpm install && pnpm run build && pnpm run check`
Expected: all green.

---

## Phase 4 — Transfer the repo to the `reddoorla` org (workstream D)

### Task 4.1: Pre-flight — clean tree, pushed to current origin

- [ ] **Step 1: Confirm clean + push `main` to the current (`tucksravin`) origin**

Run:
```bash
cd $HEDLOC
git status --short
git push origin main
git push origin fleet-onboarding
```
Expected: `git status` empty; both branches pushed to `github.com/tucksravin/hedloc`.

### Task 4.2: 🔴 Transfer (RED — confirm with operator first)

- [ ] **Step 1: Get explicit operator go-ahead**

Pause and confirm with the operator: "Transfer `tucksravin/hedloc` → `reddoorla` now?" Do not proceed without a yes.

- [ ] **Step 2: Execute the transfer**

Run:
```bash
gh api -X POST repos/tucksravin/hedloc/transfer -f new_owner=reddoorla
```
Expected: HTTP 202 with the repo JSON. (GitHub sets up an automatic redirect from the old URL.)

- [ ] **Step 3: Verify the repo now lives under `reddoorla`**

Run: `gh repo view reddoorla/hedloc --json nameWithOwner,isPrivate -q .nameWithOwner`
Expected: `reddoorla/hedloc`.

### Task 4.3: Re-point the local remote

- [ ] **Step 1: Update `origin` and verify fetch/push**

Run:
```bash
cd $HEDLOC
git remote set-url origin https://github.com/reddoorla/hedloc.git
git remote -v
git fetch origin
```
Expected: `origin` shows the `reddoorla/hedloc` URL; fetch succeeds.

---

## Phase 5 — Self-updating: CI + Renovate + auto-merge + branch protection

`self-updating` writes the workflow files, sets the `RENOVATE_TOKEN` repo secret, enables
auto-merge, and configures branch protection — the secret write and branch-protection are RED.

### Task 5.1: Ensure a `RENOVATE_TOKEN` value is available

- [ ] **Step 1: Check whether the recipe has a token source**

The `self-updating` recipe provisions the `RENOVATE_TOKEN` repo secret from a token value it reads
from the environment / `~/.config/reddoor-maint/credentials.env`. Confirm one is available without
printing it:
```bash
node -e "const v=process.env.RENOVATE_TOKEN; console.log(v? 'RENOVATE_TOKEN in env' : 'not in env — recipe will read credentials.env or skip')"
```
If neither env nor the creds file has a `RENOVATE_TOKEN`, the secret-set step will fail or be
skipped. In that case, pause and ask the operator to provide a GitHub PAT (repo + workflow scopes)
to use as `RENOVATE_TOKEN`, or to confirm the Renovate run can use the shared `reddoorla` token.

### Task 5.2: Dry-run `self-updating`

- [ ] **Step 1: Preview**

Run:
```bash
node /Users/tuckerlemos/Documents/GitHub/reddoor-maintenance/dist/cli/bin.js self-updating --cwd $HEDLOC --dry --verbose
```
Expected: lists the files it would write (`.github/workflows/ci.yml`, `.github/workflows/renovate.yml`,
`renovate.json`), and the GitHub operations it would perform (set `RENOVATE_TOKEN`, enable
auto-merge, protect `main` requiring the `ci / ci` check). Confirm the target repo is `reddoorla/hedloc`.

### Task 5.3: 🔴 Run `self-updating` for real (RED — confirm secret + branch-protection)

- [ ] **Step 1: Get explicit operator go-ahead** for setting the `RENOVATE_TOKEN` secret and enabling branch protection on `reddoorla/hedloc`.

- [ ] **Step 2: Execute**

Run:
```bash
node /Users/tuckerlemos/Documents/GitHub/reddoor-maintenance/dist/cli/bin.js self-updating --cwd $HEDLOC --verbose
```
Expected: writes the three files on a `maint/self-updating-*` branch, pushes, opens a PR on
`reddoorla/hedloc`, sets the secret, enables auto-merge, and protects `main`.

- [ ] **Step 3: Verify CI runs green on the PR and it merges**

Run:
```bash
gh pr list -R reddoorla/hedloc
gh run list -R reddoorla/hedloc -L 3
```
Expected: the self-updating PR's `ci` check passes and (via auto-merge) the PR merges to `main`. If
CI fails, debug the reusable workflow's expected scripts (`pnpm install/lint/check/build`) against
hedloc's `package.json`; fix on the PR branch until green (stop after 2 failed attempts per the
contract and report).

- [ ] **Step 4: Verify branch protection + auto-merge are active**

Run:
```bash
gh api repos/reddoorla/hedloc/branches/main/protection -q '.required_status_checks.contexts'
gh repo view reddoorla/hedloc --json autoMergeAllowed -q .autoMergeAllowed
```
Expected: the protection contexts include the CI check; `autoMergeAllowed` is `true`.

---

## Phase 6 — Register in the fleet + launch (workstream E)

### Task 6.1: Create the Airtable Websites row (`launch period`, placeholders)

There is no programmatic create path in the maintenance tooling, so the row is created directly via
the Airtable REST API using the operator's PAT (or, as a fallback, by hand in the Airtable UI).

- [ ] **Step 1: Confirm Airtable creds are available** (without printing them)

Run:
```bash
test -f ~/.config/reddoor-maint/credentials.env && echo "creds file present" || echo "missing"
```
Expected: `creds file present`. The file holds `AIRTABLE_PAT` and `AIRTABLE_BASE_ID`.

- [ ] **Step 2: 🔴 Confirm with the operator**, then create the row via a one-off script

Create `$SCRATCH/create-hedloc-row.mjs` — it loads creds from the env file and creates one
Websites record with the exact Airtable field names (note the legacy misspelling
`"maintenence freq"`):

```javascript
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import Airtable from "airtable"; // resolved from the reddoor-maintenance node_modules

// load AIRTABLE_PAT / AIRTABLE_BASE_ID from credentials.env without echoing them
const env = readFileSync(`${homedir()}/.config/reddoor-maint/credentials.env`, "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(process.env.AIRTABLE_BASE_ID);
const rec = await base("Websites").create([
  {
    fields: {
      Name: "Hedloc",
      url: "https://example.invalid/REPLACE-WITH-PROD-URL", // PLACEHOLDER
      Status: "launch period",
      "Git repo": "reddoorla/hedloc",
      "point of contact": "REPLACE-WITH-POC@example.com", // PLACEHOLDER
      "GA4 property ID": "", // PLACEHOLDER (leave blank until known)
      "maintenence freq": "None",
      "testing freq": "None",
    },
  },
]);
console.log("created row:", rec[0].id);
```

Run it with the maintenance repo's `node_modules` on the path (it has the `airtable` package):
```bash
cd /Users/tuckerlemos/Documents/GitHub/reddoor-maintenance
node $SCRATCH/create-hedloc-row.mjs
```
Expected: prints `created row: rec…`. Delete the scratchpad script afterward (it referenced creds).

*Fallback (manual):* create the row in the Airtable **Websites** table UI with the same field values.

- [ ] **Step 3: Verify the row exists and is active**

The create step printed the new record id. Confirm in the operator dashboard
(`https://reddoor-maintenance.netlify.app`) that **Hedloc** appears with `Status = launch period`
and `Git repo = reddoorla/hedloc`. (Avoid a fleet-wide `--fleet airtable` dry-run here — it resolves
every site and may attempt clones.)

### Task 6.2: Run the `launch` recipe — DEFERRED until the real production URL is set

The `launch` recipe runs `selfUpdating` (idempotent no-op now) → `runAudits` (Lighthouse against the
site's `url`) → drafts a Launch report with the audited scores. The audit needs the **real** prod
URL, so this step is a follow-up once the placeholder `url` is replaced in the Websites row.

- [ ] **Step 1: When the real URL is known**, update the Websites row `url`, then run:

```bash
cd /Users/tuckerlemos/Documents/GitHub/reddoor-maintenance
REDDOOR_FLEET_WORKDIR=/Users/tuckerlemos/Documents/GitHub \
  node dist/cli/bin.js launch hedloc --verbose
```
Setting `REDDOOR_FLEET_WORKDIR` to the GitHub dir makes the recipe resolve the checkout to the
existing `$HEDLOC` (slug `hedloc`) instead of cloning a fresh copy.
Expected: three steps run; a `Launch` report **draft** is queued in the dashboard. **It does not
send** — sending is the human-gated M3 approve loop and is out of scope here.

- [ ] **Step 2: Verify the draft + scores**

Run:
```bash
gh api repos/reddoorla/hedloc/commits -q '.[0].sha' >/dev/null && echo "repo ok"
```
Then confirm in the dashboard that the Hedloc Websites row has fresh Lighthouse scores
(`pScore`/`rScore`/`bpScore`/`seoScore`) and a queued Launch draft.

---

## Final verification

- [ ] `$HEDLOC` builds, type-checks, and lints clean on the new stack (`pnpm build && pnpm check && pnpm lint`).
- [ ] `.claude/settings.json` + `settings.local.json` exist locally and are gitignored; `AUTONOMY.md`, `docs/autonomy-journal.md`, and `.claude/settings.example.json` are committed.
- [ ] `git remote get-url origin` → `https://github.com/reddoorla/hedloc.git`.
- [ ] `reddoorla/hedloc` has CI on `main`, Renovate workflow, auto-merge enabled, and branch protection requiring the CI check.
- [ ] An Airtable Websites row exists for Hedloc with `Status = "launch period"`, `Git repo = reddoorla/hedloc` (URL/POC/GA4 are placeholders).
- [ ] The `launch` recipe run is documented as the remaining follow-up (blocked on the real production URL).

---

## Open items / follow-ups (tracked, not blocking)

1. **Real production URL, point of contact, GA4 property ID** — replace the Airtable placeholders, then run Task 6.2 (`launch`).
2. **`RENOVATE_TOKEN` source** — confirm the PAT used for the repo secret (Task 5.1).
3. **CI script alignment** — if the `reddoorla/.github` reusable CI workflow expects script names hedloc lacks, add them to `package.json` (surfaced in Task 5.3 Step 3).
4. **Sending the Launch report** — human-gated M3 approve loop; explicitly out of scope.
