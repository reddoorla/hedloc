import { test, expect } from "@playwright/test";

test("the Typekit hosts are preconnected before the kit stylesheet", async ({ page }) => {
  await page.goto("/");
  const links = await page
    .locator('head link[rel="preconnect"], head link[rel="stylesheet"][href*="typekit"]')
    .evaluateAll((els) =>
      els.map(
        (e) =>
          `${e.getAttribute("rel")} ${e.getAttribute("href")} ${e.hasAttribute("crossorigin")}`,
      ),
    );
  expect(links).toEqual([
    "preconnect https://use.typekit.net true",
    "preconnect https://p.typekit.net false",
    "stylesheet https://use.typekit.net/nnm4nwt.css false",
  ]);
});
