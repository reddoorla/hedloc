import { test, expect } from "@playwright/test";

test("the Typekit hosts are preconnected before the kit stylesheet", async ({ page }) => {
  await page.goto("/");
  const links = await page
    .locator("head link")
    .evaluateAll((els) =>
      els.map(
        (e) =>
          `${e.getAttribute("rel")} ${e.getAttribute("href")} ${e.hasAttribute("crossorigin")}`,
      ),
    );
  const kit = links.indexOf("stylesheet https://use.typekit.net/noj4tji.css false");
  const fonts = links.indexOf("preconnect https://use.typekit.net true");
  const css = links.indexOf("preconnect https://p.typekit.net false");
  expect(kit).toBeGreaterThan(-1);
  expect(fonts).toBeGreaterThan(-1);
  expect(css).toBeGreaterThan(-1);
  expect(fonts).toBeLessThan(kit);
  expect(css).toBeLessThan(kit);
});
