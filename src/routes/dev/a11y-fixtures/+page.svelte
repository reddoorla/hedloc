<svelte:head>
  <title>a11y fixtures — Reddoor</title>
  <meta
    name="description"
    content="Reddoor accessibility fixtures — semantic landmarks, heading hierarchy, and a stable target for @lhci/cli and Playwright + axe-core coverage. Not linked from the public site."
  />
</svelte:head>

<!-- Isolated high-contrast surface: the site body is dark (#2D2322), so default
     text here would fail axe color-contrast. This page is a dev/test target only. -->
<main style="background-color: #ffffff; color: #1a1a1a; min-height: 100vh; padding: 2rem 1.5rem;">
  <header>
    <h1>Accessibility fixtures</h1>
    <p>
      This page exists so <code>@lhci/cli</code> and Playwright + axe-core have a stable target with predictable
      a11y characteristics. It is not linked from the public site.
    </p>
  </header>

  <section aria-labelledby="landmarks-heading">
    <h2 id="landmarks-heading">Landmarks</h2>
    <p>
      A single <code>main</code> wraps the page; sections each declare
      <code>aria-labelledby</code> matched to their heading id so screen readers and axe both see a clean
      outline.
    </p>
  </section>

  <section aria-labelledby="links-heading">
    <h2 id="links-heading">Links</h2>
    <p>
      <a href="/">Back to home</a> — relative link with descriptive visible text, so no
      <code>aria-label</code> override is needed.
    </p>
  </section>
</main>
