import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const routes = [
  { path: "/executive-team", status: 200, disable: ["page-has-heading-one"] },
  { path: "/contact", status: 200, disable: [] },
  { path: "/this-uid-does-not-exist", status: 404, disable: [] },
];

for (const width of [1440, 390]) {
  test.describe(`axe at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const route of routes) {
      test(`${route.path} has no axe violations`, async ({ page }) => {
        const response = await page.goto(route.path, { waitUntil: "networkidle" });
        expect(response?.status()).toBe(route.status);
        const results = await new AxeBuilder({ page })
          .withTags(TAGS)
          .disableRules(route.disable)
          .analyze();
        const found = results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 100)).join(" | ")}`,
        );
        expect(found).toEqual([]);
      });
    }
  });
}

test("the error page is titled for Hedloc", async ({ page }) => {
  await page.goto("/this-uid-does-not-exist");
  await expect(page).toHaveTitle("Hedloc | 404");
});

test("the error page's white panel starts below the white header", async ({ page }) => {
  await page.goto("/this-uid-does-not-exist");
  const header = await page.locator("header").boundingBox();
  const panel = await page.locator("h1").locator("..").boundingBox();
  expect(panel!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
});
