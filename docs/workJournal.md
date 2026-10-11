# hedloc — Work Journal

Running log of build work: what was done, why, and where it landed.
Chronological — newest entry at the bottom. [AUTONOMY.md](../AUTONOMY.md) says
how an agent is allowed to operate here and
[docs/autonomy-journal.md](autonomy-journal.md) logs unattended changes; this is
the history of the build itself.

The convention is in [CLAUDE.md](../CLAUDE.md) under "The work journal". In
short: every working session appends a dated entry, prose over bullets, why
over what, and history is never edited to be right — a later entry corrects an
earlier one and says so.

---

## 2026-09-05 — Journal opened, and 21 months of history summarised rather than reconstructed (`chore/work-journal`)

The journal starts today, so this first entry is a **backfill**: a coarse
summary written from the commit log, not from memory. Detail below this line is
trustworthy; detail above it is not, and nothing here should be cited as though
someone wrote it down at the time. For anything before 2026-09-05 the commit log
is the record.

**What this repo is.** The website for Hedloc Investment Co — a small
SvelteKit + Prismic site on Netlify: home, `/executive-team`, `/contact`, plus
`/health` and two `/dev` a11y fixtures. It is a Reddoor fleet site but was
**not** generated from reddoor-starter; it began as a fork of the older "Reddoor
Wireframer and Site Scaffold", which is why `README.md` still describes the
scaffold and `package.json` is still named `sveltekit-starter-prismic-minimal`.
Neither describes this site. 95 commits, 2024-12-20 to 2026-09-01, 89 by one
author and 6 by Renovate.

**The eras, coarsely.** **Dec 2024 – Jan 2025 (18 commits)** is the original
hand-built site — homepage, about, contact, then responsive passes with messages
like `cols`, `tablet`, `overflow-x`, ending with Font Awesome and Vimeo pulled
out. Then **Sep 2025 (3 commits)**: a `robots.txt` and two touches to
`+layout.svelte`. Eight months dormant either side.

**June 2026 (34) is where it becomes a fleet site**, and it is the densest month
here: a written spec and plan under `docs/superpowers/`, the autonomy contract
and allowlist, ten `chore: sync … config from @reddoorla/maintenance` commits,
the stack lifted to the reddoor-starter baseline (Tailwind v4, Vite 8, pnpm,
adapter-netlify), the Svelte 5 runes codemod over 28 files plus two commits
repairing what it produced, and the a11y fixtures. It closes with the Caroline
pre-launch restructure: three-page IA and `/about` retired into
`/executive-team` behind a 301 in `netlify.toml`.

**July 2026 (22)** adds fleet capability rather than design — Turnstile, the
contact form wired to fleet ingest, `/health`, the smoke suite, `og:image`
reaching scrapers — plus a `cookie` version fight that took four commits to
settle. **Aug – Sep 2026 (18)** is client feedback and maintenance: hero CTAs
above the fold, landing copy consolidated onto the hero, the contact hero
recropped three times in one day, and Prismic srcset widths capped with a real
`sizes` on every image.

**State as of this entry.** `main` at `e3dd12a`, tree clean, no open PRs. There
is no `pnpm verify` here — CI is the shared reusable workflow
(`reddoorla/.github` v1.4.1); locally the gates are `pnpm lint`, `pnpm check`
and `pnpm test:smoke`. Several remote branches survive from the June/July work,
merged rather than in flight.

**What changed today.** `CLAUDE.md` did not exist, so this created one — what
the repo is, the commands, and the fork-lineage trap above — and added "The work
journal". Nothing else was touched.

## 2026-10-11 — The Executive Team row is 4 wide at lg, and an open bio grows the section (#55)

Erik asked in #hedloc-web on 10-09 for a fourth Executive Team slot ("Let's just slide these three to the left, and have 4-wide"), with Shankar Annamalai fourth, during the week of 12–16 Oct. The row had always been four columns wide. Its first column was empty, and its only job was to hold the selected member's headshot, name and Close while a bio was open, so three members filled columns two to four. That column is now an absolutely placed slot over column one. It is exactly one column wide, `calc((100% - 7.5rem) / 4)`: four columns sharing three `gap-10`s, the same width the old spacer reached by flex-shrinking. So the open view looks as it always did, and four members fit. With today's three members the columns keep their 301px (1440) and 206px (1024) widths and slide one column left (x 399/740/1081 → 58/399/740 at 1440). The fourth slot is empty until Shankar is published.

**Two defects came from Shankar's real content, not from the ask.** Both were found by staging his name, headshot and bio from Erik's Dropbox in a throwaway worktree. Nothing of it was committed: this repo is public and he is not published.

- **His bio overflowed the section.** It is 1,867 characters in five paragraphs, against Jack's 1,111. At 21px/35px body type the old fixed `lg:h-[640px]` box would have painted it over the footer: in a fixture with his paragraph lengths, 231px (1440) and 511px (1024) past the section's bottom padding. Jack's own bio already overran that box at 1024 on the live site (panel bottom 1325 against a box bottom of 1268), hidden only because the section's 96px bottom padding is the same colour. The row and the bio overlay now share one grid cell, `[grid-area:1/1]` inside a `grid lg:min-h-[640px]`, so an open bio grows the section. Jack's at 1024 now adds 57px.
- **His name wrapped off-centre.** It is the first name long enough to wrap in a 206px column. Buttons centre their text by default, so "ANNAMALAI" sat 34px in from the edge under a left-aligned "Advisor". `text-left` on the name-bearing buttons fixed it.

**Moving the selected card over column one made a new class of defect.** The card and member one now take turns on the same pixels, and three review rounds found three bugs in a row on that seam:

- **Round 1**, two bugs:
  - A double-click on member one opened its bio, and the second click landed on the fading-in card and closed it.
  - For the 150ms fade after Close, the card's empty container swallowed clicks on member one.

  The fix was `pointer-events-none` on the container, `pointer-events-auto` on the card, and an `event.detail > 1` guard on the card.

- **Round 2:** that fix let the second click of a double-click on the open card fall through to member one, opening the wrong bio (Jack's, on live data). The same guard on the member buttons closed it.
- **Round 3** found no behaviour defect.

The lesson for the next overlap: test the double-click and fade windows from both sides, not only the side the change was about. Each round also added `mb-4` where needed: the card's headshot now has the members' 24px gap to the name, so during the cross-fade the two names sit on the same line instead of 16px apart.

**The tests could not see what they claimed for two rounds**, which is the most reusable part of this.

- **The fixture.** Playwright cannot intercept the server-side Prismic fetch, so the tests run against `/dev/executive-team`, a four-member fixture. The row moved into `TeamMembers.svelte` to make that possible.
- **Opacity and covering.** `toBeVisible` and `boundingBox` ignore opacity and anything painted on top, so an overlay stuck at opacity 0 or 1 passed everything. So did a panel moved out of the shared cell, and one with no background. The tests now check:
  - the panel's opacity;
  - its background alpha, read by painting the computed colour into a 1px canvas, because Tailwind v4's `bg-x/0` computes to `oklab(… / 0)` and an `rgba()` parser called that opaque;
  - that the panel covers every member;
  - the bio's and headshot's opacity multiplied through their parents.
- **The 150ms dead zone.** Playwright's actionability wait hides it, so that test hit-tests inside one `page.evaluate` while the card is still fading.
- **Scrolling on phone.** `scrollIntoView({ behavior: "smooth" })` ignores `reducedMotion`, so on phone two separate box reads disagree mid-scroll; every phone measurement is one `evaluate`.

Nineteen mutations each turn a test red. They are listed in #55. One, `lg:h-full` on the slot, became equivalent once the slot stopped taking pointer events.

**The content half did not land here.** The Prismic MCP is not activated for this repository, so Shankar's entry (title "Advisor", the headshot, his five paragraphs without the .docx's headings) went to the operator to enter by hand. `/executive-team` is prerendered, so the entry shows only after the next Netlify build. A Prismic → Netlify build hook could not be confirmed.
