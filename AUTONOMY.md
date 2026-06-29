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
- Secrets (`gh secret set`), branch-protection / org / billing changes. The allowlist gating here is best-effort for CLI-accessible operations — org/billing changes ultimately rely on the human GitHub account having no agent token scoped for them.
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
`--force-with-lease`, `reset --hard`, `git clean -fd(x)`, `rm -rf`). The OS sandbox is enabled (macOS Seatbelt): `pnpm install`
postinstall scripts run sandboxed with a network allowlist (github, npm, prismic) and no read
access to `~/.ssh` / `~/.aws` — the supply-chain containment that matters for Renovate
auto-merge. The dev loop (`gh`, `git`, `pnpm build/test/lint`, `node`, `npx`) runs unsandboxed
via `excludedCommands` (Seatbelt-incompatible; our own trusted code).
