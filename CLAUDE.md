# CLAUDE.md

The website for **Hedloc Investment Co** — a SvelteKit + Prismic content site on
Netlify, three pages (home, `/executive-team`, `/contact`) plus `/health` and
the `/dev` a11y fixtures. Source is in `src/` (routes under
`src/routes/[[preview=preview]]/`, slices in `src/lib/slices/`, Prismic models
in `customtypes/`).

Gates, run before pushing: `pnpm lint` (prettier then eslint), `pnpm check`
(svelte-check) and `pnpm test:smoke` (Playwright). There is **no `pnpm verify`**
here — CI is the fleet's shared reusable workflow, pinned in
`.github/workflows/ci.yml`.

Two things that mislead on arrival. **`README.md` and the `package.json` name
(`sveltekit-starter-prismic-minimal`) describe the old Reddoor wireframer
scaffold this repo was forked from, not this site** — don't read either as a
description of Hedloc. And `/about` no longer exists: it was split into
`/executive-team` and `/contact`, with a 301 in `netlify.toml`.

How an agent is allowed to operate here is [AUTONOMY.md](AUTONOMY.md), and
unattended changes are logged in
[docs/autonomy-journal.md](docs/autonomy-journal.md).

## The work journal

**Every working session appends a dated entry to `docs/workJournal.md`** — what
was done and **why**, newest at the bottom, never corrected in place. Write it
as the last act of the session, not the first act of the next one.

The journal is the history of executing the build. Code says what the system
does now; the journal says what it used to do, what it cost to change, and
which beliefs turned out to be wrong. Nearly everything expensive to rediscover
lives there and nowhere else.

An entry is headed with the date, a short title, and where it landed:

```markdown
## 2026-09-04 — Both runway stages render their final frame without JS (#51, `ce46ae0`)
```

Then prose — not a bullet list of file names, which the diff already tells you.
What to put in, in rough order of value:

- **Why, over what.** The reason a thing was done survives; the diff does not
  need restating.
- **Measured numbers, exactly.** "The comp's open mask is 2696×2352 on an 860px
  band — 2.735× the band's height, so a 390×664 phone needs ~534%" is worth
  keeping. "Fixed the hero on mobile" is not.
- **Defects, named.** What broke, what it looked like, and what made it
  invisible until it wasn't.
- **What was tried and abandoned**, and what it would take to revive it. A dead
  end nobody wrote down gets walked twice.
- **Beliefs corrected on contact.** The design assumption that turned out false
  is usually the most valuable line in the entry.
- **Honest accounting.** If a win came from somewhere other than the change
  that claimed it, say so — that is exactly what someone will otherwise
  over-invest in next.

**History is never edited to be right.** An entry that stops being true is not
rewritten; a later entry corrects it, and says which one it corrects. The
journal is a record of what was believed at the time, and that record is most
useful precisely where it was wrong. Fixing the past in place destroys the only
evidence of how the mistake was made.

If a session produced nothing worth an entry, that is itself worth one line.
