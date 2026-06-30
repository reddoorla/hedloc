<svelte:head>
  <title>animate-in demo — Reddoor</title>
  <!-- Dev/test target only — keep it out of search indexes (robots.txt also
       disallows /dev/). -->
  <meta name="robots" content="noindex" />
  <meta
    name="description"
    content="Reddoor animate-in fixture — content that reveals on entry (opacity 0 → 1) while staying accessible: the resting state is fully visible and prefers-reduced-motion is honored. A stable axe-core / @lhci/cli target, not linked from the public site."
  />
</svelte:head>

<!-- Isolated high-contrast surface (the site body is dark #2D2322), matching
     /dev/a11y-fixtures so axe color-contrast passes. The fleet a11y audit snaps
     animations to their resting state before scanning, so the reveal animation
     here only ever affects the entry; the resting state below is what axe (and
     prefers-reduced-motion users) see. -->
<main style="background-color: #ffffff; color: #1a1a1a; min-height: 100vh; padding: 2rem 1.5rem;">
  <header class="reveal">
    <h1>Animate-in</h1>
    <p>
      This page is a stable target for Playwright + axe-core and <code>@lhci/cli</code>. It
      exercises the site's reveal-on-entry pattern while keeping the resting state fully accessible.
      It is not linked from the public site.
    </p>
  </header>

  <section aria-labelledby="reveal-heading">
    <h2 id="reveal-heading" class="reveal" style="animation-delay: 80ms">Reveal on entry</h2>
    <p class="reveal" style="animation-delay: 160ms">
      Each block fades and rises in (<code>opacity: 0 → 1</code>, a small upward translate).
      Crucially, the <em>resting</em> state is the default — visible, full-opacity, untransformed —
      so disabling the animation (what axe does, and what <code>prefers-reduced-motion</code> users get)
      leaves the content fully rendered rather than stuck invisible.
    </p>
    <ul>
      <li class="reveal" style="animation-delay: 240ms">
        First revealed item — staggered by delay.
      </li>
      <li class="reveal" style="animation-delay: 320ms">Second revealed item.</li>
      <li class="reveal" style="animation-delay: 400ms">Third revealed item.</li>
    </ul>
  </section>

  <section aria-labelledby="motion-heading">
    <h2 id="motion-heading">Reduced motion</h2>
    <p>
      Users who set <code>prefers-reduced-motion: reduce</code> skip the animation entirely and see the
      resting state immediately — no fade, no movement.
    </p>
    <p><a href="/">Back to home</a></p>
  </section>
</main>

<style>
  /* Resting state is the element's default (opacity 1, no transform), so the
     content is fully accessible whenever the animation is absent — which is
     exactly what the a11y audit forces (animation:none) and what reduced-motion
     users get. The keyframe only describes the entry. */
  @keyframes reveal-in {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .reveal {
    animation: reveal-in 600ms cubic-bezier(0.5, 0, 0, 1) both;
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal {
      animation: none;
    }
  }
</style>
