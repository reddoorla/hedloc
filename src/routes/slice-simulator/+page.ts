// Server-rendered on every host so hooks.server.ts, not netlify.toml's static
// [[headers]] block, decides this page's framing policy: it is the one route
// the Prismic Type Builder and Page Builder frame from another origin. Left to
// the root layout's `prerender = "auto"`, the build would crawl it into a
// static file, and Netlify serves static files with the `/*` block's
// X-Frame-Options: SAMEORIGIN, so the Type Builder could not frame it. See
// $lib/security/cms-framing.ts.
export const prerender = false;
