# Autonomy journal

Append-only log of unattended/agentic changes on hedloc: what changed, why, and how it was
verified. Newest entries on top. See [`AUTONOMY.md`](../AUTONOMY.md) for the contract.

## 2026-10-11 — Executive Team row 4 wide at lg (#55)

- `feat`: the Executive Team row holds four members in one row at `lg` (Erik, #hedloc-web, 10-09). The selected-member slot sits over column one; an open bio grows the section; a wrapped name starts at the left edge. Phone and tablet still stack.
- Verified:
  - TDD against a four-member `/dev/executive-team` fixture: 22 Playwright tests, and 19 mutations each turning one red.
  - CI green, plus `pnpm lint`, `pnpm check` and `pnpm build`.
  - The deploy preview's `/dev/executive-team` returns 404.
- Review: three rounds. Rounds 1 and 2 were dirty, all findings fixed. After round 2 the PR went to the operator, who asked for a third round (reddoor-maintenance Operator decisions 104). Round 3 found one test-only defect, fixed in `3ad602d`, and the operator said to land on green CI.
- Not done here: Shankar's Prismic entry (the MCP is not activated for this repo), which the operator enters by hand. A Netlify build is needed after it is published.

## 2026-06-29 — Fleet onboarding

- Established the autonomy guardrails (`.claude/settings.json` allowlist + sandbox,
  `AUTONOMY.md`, this journal). See `docs/superpowers/plans/2026-06-29-hedloc-fleet-onboarding.md`.
