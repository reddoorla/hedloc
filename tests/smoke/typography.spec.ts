import { test, expect, type Page } from "@playwright/test";

// Erik's 2026-10-20 type spec, from Adobe kit noj4tji: FF Good Regular on body
// copy and the footer; Eurostile Extended Regular on the top nav, every
// .button-text and the two page headings, which are all caps.
const BODY = "ff-good-web-pro";
const DISPLAY = "eurostile-extended";

const firstFamily = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) =>
    els.map((el) =>
      getComputedStyle(el)
        .fontFamily.split(",")[0]
        .trim()
        .replace(/^["']|["']$/g, ""),
    ),
  );

async function expectFamily(page: Page, selector: string, family: string) {
  const families = await firstFamily(page, selector);
  expect(families.length, `${selector} matches something`).toBeGreaterThan(0);
  for (const f of families) expect(f, `font-family of ${selector}`).toBe(family);
}

// Eurostile Extended is in the kit at 400, 500 and 900 only, so a 600 rule would
// render the Black cut. "Regular" means the 400 upright face.
async function expectRegular(page: Page, selector: string) {
  const styles = await page
    .locator(selector)
    .evaluateAll((els) =>
      els.map((el) => `${getComputedStyle(el).fontWeight} ${getComputedStyle(el).fontStyle}`),
    );
  for (const s of styles) expect(s, `weight and style of ${selector}`).toBe("400 normal");
}

// document.fonts.check() is true for a family with no @font-face at all, so it
// cannot tell a missing kit from a loaded one. Ask for the face itself.
async function expectFaceLoaded(page: Page, family: string) {
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(
        (family) =>
          [...document.fonts].some(
            (f) =>
              f.family.replace(/["']/g, "") === family &&
              f.weight === "400" &&
              f.style === "normal" &&
              f.status === "loaded",
          ),
        family,
      ),
    )
    .toBe(true);
}

async function expectSharedType(page: Page, { paragraphs = true } = {}) {
  await expectFamily(page, "body", BODY);
  if (paragraphs) await expectFamily(page, "main p", BODY);
  await expectFamily(page, "footer, footer div, footer a", BODY);
  await expectFamily(page, 'header a:not([href="/"])', DISPLAY);
  await expectRegular(page, 'header a:not([href="/"])');
  await expectFaceLoaded(page, BODY);
  await expectFaceLoaded(page, DISPLAY);
}

async function expectButtons(page: Page) {
  await expectFamily(page, ".button-text", DISPLAY);
  await expectRegular(page, ".button-text");
  const overflow = await page.locator(".button-text").evaluateAll((els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent)
      .filter((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getClientRects().length > 1 || el.scrollWidth > el.clientWidth;
      })
      .map((el) => el.textContent!.trim()),
  );
  expect(overflow, "button labels that wrap or overflow").toEqual([]);
}

async function expectHeading(page: Page, selector: string) {
  await expectFamily(page, selector, DISPLAY);
  await expectRegular(page, selector);
  await expect(page.locator(selector)).toHaveCSS("text-transform", "uppercase");
}

for (const width of [1440, 390]) {
  test.describe(`typography at ${width}px`, () => {
    test.use({ viewport: { width, height: width === 1440 ? 900 : 844 } });

    test("home: body, footer, nav and buttons", async ({ page }) => {
      await page.goto("/");
      await expectSharedType(page);
      await expectButtons(page);
    });

    test("executive team: 'The Team' heading", async ({ page }) => {
      await page.goto("/executive-team");
      await expectSharedType(page);
      await expectHeading(page, "main h2");
    });

    test("contact: 'Contact Us' heading and the submit button", async ({ page }) => {
      await page.goto("/contact");
      // The contact hero's body is empty in Prismic, so the page has no <p>.
      await expectSharedType(page, { paragraphs: false });
      await expectHeading(page, "main h1");
      await expectButtons(page);
    });
  });
}

test.describe("home buttons at 1440×900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // Erik asked on 08-10 for the home CTAs above the fold.
  test("stay above the fold in Eurostile Extended", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const bottoms = await page
      .locator(".button-text")
      .evaluateAll((els) =>
        els
          .filter((el) => (el as HTMLElement).offsetParent)
          .map((el) => el.getBoundingClientRect().bottom),
      );
    expect(bottoms.length).toBeGreaterThan(0);
    for (const b of bottoms) expect(b).toBeLessThanOrEqual(900);
  });
});
