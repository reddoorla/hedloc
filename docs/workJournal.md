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

## 2026-10-20 — The starter's route wash, blur-up and gated press hop, on Kit 2 (#62)

Erik asked on 10-20 whether Reddoor still meant to modernise Hedloc's transitions and loading. The operator said yes, as a port from reddoor-starter with leeway to take better versions from other fleet sites, and on Reddoor's cost, so nothing new was designed (workspace `decisions/2026-10-20-1705-hedloc-type-and-motion.md`). The starter's motion set is byte-identical in both Williamson sites. The only newer piece in the fleet is roalson-interests' `animateIn`, whose fail-safe stands down on the observer's first report instead of revealing below-fold content on a timer, unseen. That is the version ported.

**What a visitor sees now:**

- A client navigation is washed in the site's dark: 140ms in, 140ms hold, 320ms out, with a 3000ms ceiling for a navigation that never completes.
- The team headshots and the home page's section images arrive blurred and sharpen over 1500ms as each loads.
- Buttons hop 8px while pressed.
- Under `prefers-reduced-motion: reduce`, none of it runs, and Svelte's JS fades (the team card, the accordion) now honour the setting through `$lib/transitions`, which they never did.

At 1440×900 the home CTAs sit at y 764–800 on both the live site and the branch, and the page is 1988px tall on both: nothing moved. The hero image keeps no blur, because it is the LCP image and is shared by both pages.

**The belief corrected on contact:** the brief assumed Hedloc had a live scroll reveal to modernise. It had the code: `AnimateIn.svelte`, a 4s `setInterval` plus a scroll listener. But no call site ever passed `animateIn` to `ContentWidth`, so it never ran in production. That went to the operator (workspace `decisions/2026-10-20-1744-hedloc-reveal-which-blocks.md`), who chose to switch it on for these blocks, at the old 2400ms, staggered by position:

- `/executive-team`: the heading and the team;
- `/`: the image band, plus the mobile subbody/CTA block.

Blocks that can be in view at first paint ship `data-reveal` from the server with a 2500ms `failSafe`, so they are hidden before they paint rather than vanishing at hydration.

**The default 50% travel was wrong for the team, measured twice.** Revealing the whole grid (640px+ tall) put its hidden state 320px lower, below the fold at both 1280×720 and 1440×900. Roalson's fail-safe correctly stands down on the observer's first "not in view" report, so the team's slot sat empty until the reader scrolled.

- **Per card inside each button:** the button stretches to the row's 640px, so a wrapper `<span>` inside it carries the reveal instead.
- **Then the cards themselves:** at 390 and 768 the team is one column of 551–1015px cards, and half of that put the first card's slot below the fold the same way.

The cards now travel 24px (`CARD_REVEAL`), with a matching `[data-reveal="card"]` rule so the server-rendered state stays byte-identical. A browser spec at 1280, 768 and 390 goes red when the 50% travel is put back. The home blocks keep 50%, because the `h-screen` hero puts every one of them at or below the fold.

**Kit 2 cost one line.** `BeforeNavigate` is a type from `@sveltejs/kit` here, not `$app/navigation`. The starter's `Img` wraps `@zerodevx/svelte-img`, which Hedloc does not use. Hedloc's version wraps `PrismicImage`, and its load tracker reaches the `<img>` as a Svelte 5 `{@attach}`, because `PrismicImage` spreads its rest props onto the element. That avoids a wrapper element that could have moved a flex layout.

**Defects, named:**

- **No-JS images stuck blurred (review round 1, major).** `.progressive-img` is blurred by CSS and unblurred only by JS, so with scripting off every headshot stayed at `blur(40px)` after loading. It came over from the starter unchanged; the `<noscript>` style now releases it, and the gap is filed as reddoorla/reddoor-starter#194. The same blur with JS on but hydration failing is #66.
- **A test that could never fail, inherited.** The starter's "the server ships a hidden reveal target" counts the word `data-reveal` in the HTML, and app.html's `<noscript>` style names `[data-reveal]` on every page. It now matches the attribute on an element. My own first `.members` opacity check had the same flaw: it was measured on the button after the reveal had moved to a span inside it, so it passed whatever happened.
- **A spec that only ever measured motion by accident.** The shared Playwright config forces `reducedMotion: "reduce"`. One executive-team spec, "a click straight after Close", only passed because `svelte/transition` ignored that setting. Once the fade honoured it there was no fade to click through, so that one test now asks for motion.
- **A flaky trace window.** The starter's no-JS spec traces opacity for 4s, and a passing run takes about 3.5s. Under load it failed 2 runs in 4, so it now traces for 10s.

Each of the brief's five mutations turns a test red: the ungated `bump`, the overlay running under reduce, the deleted `<noscript>`, the dropped fail-safe, and a ceiling that never lifts. The last one leaves every unit timer-count test green and is caught only by the browser spec that holds `__data.json` forever.

**Honest accounting:** the visible win here is the wash and the blur-up. The `bump` change is mostly invisible, since the press hop already existed ungated; what changed is that reduced-motion readers no longer get it. Locally, Playwright 1.63 ran against the container's Chromium 1248 build, aliased under a scratch `PLAYWRIGHT_BROWSERS_PATH`; CI installs its own.

## 2026-10-20 — FF Good for body copy, Eurostile Extended for the nav, buttons and two headings, from kit noj4tji (#65)

Erik asked in #hedloc-web for FF Good Regular on all body copy and the footer, and Eurostile Extended Regular on the buttons, the top nav, and "The Team" and "Contact Us" on their own pages. The operator chose all caps for those two headings. Reddoor eats the cost, so the change is typography only.

**The kit was the first wall.** The brief checked that kit `nnm4nwt` served both families before any edit. It served only Raleway, last published 2024-12-23, so the session stopped and asked. The operator then pointed at `noj4tji`, "the one for all sites now". It was published at 17:15:17 UTC that day and serves 30 families, including `ff-good-web-pro` and `eurostile-extended` at 400. It has no Raleway, which costs nothing here: Raleway was set only on `body`, and `body` became FF Good. Its CSS is 9,423 bytes gzipped against the old kit's 767.

**Regular has to be said in weights.** The kit has Eurostile Extended at 400, 500 and 900 only. The old nav and buttons asked for 600, which would have rendered the 900 Black cut, so every Eurostile rule sets 400 upright. The two headings were 500 italic in Raleway and are now 400 normal. FF Good has every weight in the kit, so the form keeps its 600 labels in FF Good's real Medium (`GoodPro-Medium`).

**Eurostile Extended is wide, and two layouts noticed.** At 12px with 0.48px tracking, "EXECUTIVE TEAM" set at 140.7px against the button's 140px inner width, so it wrapped. More subtly, on a phone the 14px nav took width from the logo: the header is a `justify-between` row whose logo link can shrink. The logo went from 143.1 to 128.1px wide at 390, and to 80px at 320. Review round 1 caught the logo; the first commit's own tests did not. The operator then said to size by eye rather than match the old state. The nav is now 15px on desktop and 11px on a phone, and the buttons 11px, all with 0.04em tracking. The headings get line height 1.15 and 28px on a phone. Mobile body copy went from 12px to 15px, because FF Good is narrow and 12px read small. The logo is 145.4px at 390, a little wider than Raleway left it (143.1), and the home CTAs still end at y=800 in a 1440×900 window.

**The brief's font check could not see a missing font.** `document.fonts.check('16px "no-such-font-xyz"')` is `true`: the spec answers true when no `@font-face` matches at all. The first replacement asked for a `FontFace` with `status === "loaded"`. Round 2 beat that with a same-named `@font-face` on a local font, which loaded while DejaVu Sans painted. The test now reads the face Chromium actually paints over CDP (`CSS.getPlatformFontsForNode`), by PostScript name. It requires `EurostileExt-Reg` on the nav, buttons and headings, `GoodPro` on body copy and the footer, and `GoodPro-Italic` nowhere but the team titles (round 3's find).

**Review ran five rounds: one layout defect, then three rounds of test gaps, then clean.** Round 1: the crushed logo, a fold test that read the CTAs at 1094px before the hero settled, and the team Close buttons never checked. Round 2: the same-named face, and a nav check that only looked at the logo's width. Round 3: italic body copy passing. Round 4: a nav moved off the top, or printed over the logo, still passing. Round 5 found nothing in the code; it corrected two lines of this entry. Each fix came with the mutation that proved it. Fifteen are in the PR; two survive. One is dropping the `footer {}` rule: the footer has no family of its own and inherits FF Good, so it can't go wrong that way. The other is an unlayered `body { font-style: italic }`, which changes no painted face anywhere (159 elements compared, byte-identical), because every text rule sets its own style.

**What did not change.** The RichText slice keeps its system-font stack. It renders only through the `[uid]` route, and Prismic has no `page` documents. Hover states, state-only paragraphs and the 320px CTA overflow that predates this work are filed as #67, #63 and #68. This landed after the motion port (#62), with a merge keeping its `<noscript>` block, its `animateIn` on the team heading and its removal of `body`'s transitions.

## 2026-10-20 — A quicker team bio, the home images staggered in the reddoor site's way, and Erik's Medium Eurostile (#73, #75)

Two follow-ups after the typography landed. The operator said the team bio "feels too slow" and asked for the home images to stagger in "the way we do it on the reddoor site", a bit sooner (#73). Then Erik asked for the Eurostile one weight up, a little tracking on it, and more room around "Executive Team" in the home button (#75).

**The slow bio was not the bio.** The text arrived in 387ms. What read as slow was the open card's headshot. It is the image the reader has just seen sharp in the grid, but it mounted through #62's blur-up, so it sat at `blur(40px)` and sharpened over 1.5s. `Img` takes `blurUp={false}` for it now: sharp at 17ms. The text's fade delay went from 150 to 75ms, so the text is fully in at 255ms.

**The band now reveals per image, as reddoorla/reddoor-website's `ContentWidthMedia` does.** Each image has its own observer, and up to 400ms of delay by how far right it sits: 16, 133 and 304ms across the top row at 1440. Before, the whole 800px band revealed as one block from a 50% travel. It hid 400px low, so it started only once the reader was about 400px into it, all four images at once. It now starts at 100px. The travel is a fixed 96px, not that site's 25%. Its tiles are all about 400px tall, but Hedloc's vertical image is 800px, and 25% would have started it last in the row it leads.

**Wrapping the images exposed a layout bug that could not be kept.** On `main` the top-right pair (bare `w-2/3` and `w-1/3` images plus a 40px gap) overran its row. How far depended on the images' own minimum width: 40px at 1025–1440, 22px at 1920. That is, it depended on which image size had loaded. `shrink-0` on the new wrappers matched it only up to about 1600px. The pair now splits the row less its gap, 2:1: 575 and 287px at 1440 against 602 and 301, flush with the image below at every width (#74).

**Erik's tracking numbers needed converting.** He gave "25 to 50 points in print numbers ... 0.1em?". Print tracking is in thousandths of an em, so that range is 0.025–0.05em, and 0.1em would be 100. Every Eurostile element takes 0.05em. The nav and buttons were already at 0.04em, so only the headings change visibly. Medium (500, `EurostileExt-Med`) is a big step from Regular and reads close to bold. At Medium 0.05em, "EXECUTIVE TEAM" is 140.7px, wider than the old 144px button's inside. Both home buttons are now 184px, which stacks them on phones up to 425px. The phone nav dropped to 10.5px, because Medium at 11px took 7px of the logo at 390.

**The reviews were long, and almost all in the tests.** #73 ran the five rounds the review rule allows, and #75 ran four. One round found a visible defect: #73 round 1 caught the wrappers narrowing the band. Every other finding was an operator ask the tests did not pin. Two of those findings bear repeating:

- **A test that measures wrappers cannot see the images inside them.** #74's symptom can come back with the wrapper still flush.
- **A bio "timing" test that reads one element misses the rest of the bio.** The open card beside the panel is outside it.

The test now times the bio from the animations themselves, delay plus duration per element. Wall clock is unusable there, because Svelte starts an intro a frame or two late.

**Honest accounting.** #73's round 5 still found three test gaps (the open card's fade, the phone list's delays, the band's vertical edges). They are fixed, and each fix is proven by its mutation, but they were not re-reviewed: round 5 is the last round the rule allows, so they went to the operator as a decision. One live check of #75 failed the fold test once, within seconds of the deploy turning up. The buttons measured at 764–800px throughout, and a re-run passed 26 of 26.
