# Autonomy journal

Append-only log of unattended/agentic changes on hedloc: what changed, why, and how it was
verified. Newest entries on top. See [`AUTONOMY.md`](../AUTONOMY.md) for the contract.

## 2026-10-20 — A quicker team bio, per-image home reveal, and Medium Eurostile (#73, #75)

- `feat` #73 (issues #72, #74): the open bio's headshot no longer blurs up again (sharp at 17ms, against ~1.5s), and the bio text is in at 255ms (was 387). The home images reveal one by one the way reddoorla/reddoor-website does: 96px travel, up to 400ms left to right, starting 100px into view instead of ~400px. The band's top-right pair now splits its row 2:1 less the gap (575/287px at 1440, was 602/301 overrunning by 40px).
- `feat` #75: Erik's notes. Eurostile Extended is Medium (500) with 0.05em tracking on the Eurostile only. Both home buttons are 184px, with ~20px either side of "EXECUTIVE TEAM". The phone nav is 10.5px.
- Verified:
  - Red tests first, with mutation tables in each PR: 22 rows on #73 and 17 on #75. CI is green.
  - #75 checked live by its own spec against https://hedloc.netlify.app: 26 of 26.
- Review: #73 ran five three-lens rounds, and its fifth round's three test gaps went to the operator. #75 ran four, and the fourth was clean (minor filed as #76).

## 2026-10-20 — Typography: FF Good and Eurostile Extended from kit noj4tji (#65)

- `feat` #65 (issue #61): body copy and the footer in FF Good (`ff-good-web-pro`). The top nav, every `.button-text`, the executive-team heading and the contact heading are in Eurostile Extended (`eurostile-extended`) at 400, and the two headings are uppercase. The kit link moves from `nnm4nwt` (Raleway only) to `noj4tji` on the operator's word. Nav, button, heading and mobile body sizes were set by eye, also on the operator's word.
- Verified:
  - Red test first: `tests/smoke/typography.spec.ts` pins the painted face over CDP, on `/`, `/executive-team` and `/contact` at 1440 and 390, plus the fold and the phone header.
  - 15 mutations: 13 turn it red, one survivor is inherited and one is equivalent. They are listed in #65.
  - `pnpm lint`, `pnpm check` and `pnpm test` (81 unit, 62 Playwright) all pass. CI is green.
- Review: five three-lens rounds. Rounds 1–4 each had majors, all fixed; round 5 was clean apart from two journal corrections. Minors are filed as #63, #67 and #68.

## 2026-10-12 — Easy-wins pass: axe fixes, 404 header, form autofill, Typekit preconnect (#56, #57, #58)

- `fix` #56: the Executive Team hero rendered an `<img>` with no alt (now `alt=""` via `fallbackAlt`), member names skipped h2 → h4 (now `h3.h4`, titles `p.h5`, styled identically), and the error page nested a second `<main>`, was titled "404 — Reddoor", and hid the white header on its white panel (now a div titled "Hedloc | 404", starting 6rem down).
- `fix` #57: the contact form's name, email and phone carry `autocomplete` tokens.
- `perf` #58: preconnects to `use.typekit.net` (CORS, for the fonts) and `p.typekit.net` (for the `@import`ed CSS).
- Verified:
  - Red tests first: `tests/smoke/a11y.spec.ts`, `contact-form.spec.ts` and `head.spec.ts`, with mutations listed in each PR.
  - Pixel diffs of `main` against each branch at 1440, 1024 and 390 were identical, except the intended 404 change. The diff instrument caught an injected 2px letter-spacing change.
  - Production after deploy: `/executive-team` Lighthouse accessibility 90 → 100 and SEO 92 → 100. axe is clean on every route except `page-has-heading-one`, which is left for a copy call.
  - The preconnect's measured gain is small: −135 ms FCP on `/` in a preview-against-preview A/B.
- Review: one three-lens round per PR, no blocking findings. The round on #56 found the 404 header defect, which was fixed in the same PR.
- Not done here: the items that need the operator are listed in reddoor-maintenance's journal entry for this pass.

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
