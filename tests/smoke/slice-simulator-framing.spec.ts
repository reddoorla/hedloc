import { test, expect } from "@playwright/test";

// The Prismic Type Builder frames /slice-simulator from https://*.prismic.io to
// preview slices. src/hooks.server.ts must send that route no X-Frame-Options
// and a frame-ancestors naming Prismic, and must leave every other route's
// headers alone. Header-only: no page is rendered, so no browser is needed.
test("/slice-simulator can be framed by Prismic", async ({ request }) => {
  const response = await request.get("/slice-simulator");
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers["x-frame-options"]).toBeUndefined();
  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'self' http://localhost:* https://*.prismic.io https://prismic.io",
  );
});

test("other routes keep their framing headers untouched by the hook", async ({ request }) => {
  for (const path of ["/", "/health"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-security-policy"], path).toBeUndefined();
  }
});
