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
