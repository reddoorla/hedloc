import { test, expect, type ElementHandle, type Page } from "@playwright/test";

// Erik's 2026-10-20 type spec, from Adobe kit noj4tji: FF Good Regular on body
// copy and the footer; Eurostile Extended Regular on the top nav, every
// .button-text and the two page headings, which are all caps.
const BODY = "ff-good-web-pro";
const DISPLAY = "eurostile-extended";

// Every helper reads only rendered elements and fails on an empty match, so a
// selector that stops matching cannot pass.
async function visible(page: Page, selector: string) {
  const handles = await page.locator(selector).elementHandles();
  const shown: ElementHandle<HTMLElement>[] = [];
  for (const h of handles) if (await h.isVisible()) shown.push(h as ElementHandle<HTMLElement>);
  expect(shown.length, `${selector} matches something visible`).toBeGreaterThan(0);
  return shown;
}

async function expectFamily(page: Page, selector: string, family: string) {
  for (const el of await visible(page, selector)) {
    const first = await el.evaluate((e) =>
      getComputedStyle(e)
        .fontFamily.split(",")[0]
        .trim()
        .replace(/^["']|["']$/g, ""),
    );
    expect(first, `font-family of ${selector}`).toBe(family);
  }
}

// Eurostile Extended is in the kit at 400, 500 and 900 only, so a 600 rule would
// render the Black cut. "Regular" means the 400 upright face.
async function expectRegular(page: Page, selector: string) {
  for (const el of await visible(page, selector)) {
    const s = await el.evaluate(
      (e) => `${getComputedStyle(e).fontWeight} ${getComputedStyle(e).fontStyle}`,
    );
    expect(s, `weight and style of ${selector}`).toBe("400 normal");
  }
}

// The face Chromium actually paints, by PostScript name, from the kit and not a
// local fallback. document.fonts.check() is true for a family with no
// @font-face at all, and a FontFace's "loaded" status can belong to a
// same-named face that never renders, so neither can tell.
const REGULAR = /^GoodPro$/;
const DISPLAY_REGULAR = /^EurostileExt-Reg$/;

async function expectRendered(page: Page, selector: string, face: RegExp) {
  const cdp = await page.context().newCDPSession(page);
  const faces = new Set<string>();
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector });
    for (const nodeId of nodeIds) {
      const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
      for (const f of fonts) faces.add(`${f.postScriptName}${f.isCustomFont ? "" : " (local)"}`);
    }
  } finally {
    await cdp.detach();
  }
  expect(faces.size, `${selector} paints text`).toBeGreaterThan(0);
  for (const f of faces) expect(f, `face painted for ${selector}`).toMatch(face);
}

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
}

async function expectSharedType(page: Page, { paragraphs = true } = {}) {
  await expectFamily(page, "body", BODY);
  if (paragraphs) await expectFamily(page, "main p", BODY);
  await expectFamily(page, "footer, footer div, footer a", BODY);
  await expectFamily(page, 'header a:not([href="/"])', DISPLAY);
  await expectRegular(page, 'header a:not([href="/"])');
  await expectRendered(page, 'header a:not([href="/"])', DISPLAY_REGULAR);
  await expectRendered(page, "footer a:not(:has(img)), footer div div", REGULAR);
  // Body copy is Regular, upright; only the team titles (p.h5) are italic.
  if (paragraphs) await expectRendered(page, "main p:not(.h5)", REGULAR);
}

async function expectButtons(page: Page) {
  await expectFamily(page, ".button-text", DISPLAY);
  await expectRegular(page, ".button-text");
  await expectRendered(page, ".button-text", DISPLAY_REGULAR);
  for (const el of await visible(page, ".button-text")) {
    const fits = await el.evaluate((e) => {
      const range = document.createRange();
      range.selectNodeContents(e);
      return range.getClientRects().length === 1 && e.scrollWidth <= e.clientWidth;
    });
    expect(fits, `"${await el.textContent()}" fits on one line`).toBe(true);
  }
}

async function expectHeading(page: Page, selector: string) {
  await expectFamily(page, selector, DISPLAY);
  await expectRegular(page, selector);
  await expectRendered(page, selector, DISPLAY_REGULAR);
  await expect(page.locator(selector)).toHaveCSS("text-transform", "uppercase");
}

for (const width of [1440, 390]) {
  test.describe(`typography at ${width}px`, () => {
    test.use({ viewport: { width, height: width === 1440 ? 900 : 844 } });

    test("home: body, footer, nav and buttons", async ({ page }) => {
      await open(page, "/");
      await expectSharedType(page);
      await expectButtons(page);
    });

    test("executive team: 'The Team' heading and the Close button", async ({ page }) => {
      await open(page, "/executive-team");
      await expectSharedType(page);
      await expectHeading(page, "main h2");
      await page.locator("button.members").first().click();
      await expectButtons(page);
    });

    test("contact: 'Contact Us' heading and the submit button", async ({ page }) => {
      await open(page, "/contact");
      // The contact hero's body is empty in Prismic, so the page has no <p>.
      await expectSharedType(page, { paragraphs: false });
      await expectHeading(page, "main h1");
      await expectButtons(page);
      // The form keeps its 600 labels, FF Good's real Medium cut.
      await expectFamily(page, "form label, form input, form textarea", BODY);
      await expectRendered(page, "form label", /^GoodPro-Medium$/);
    });
  });
}

test.describe("home buttons at 1440×900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // Erik asked on 08-10 for the home CTAs above the fold. The hero settles
  // after load (the CTAs read 1094px straight after goto), so poll.
  test("stay above the fold in Eurostile Extended", async ({ page }) => {
    await open(page, "/");
    await expect
      .poll(() =>
        page.locator(".button-text").evaluateAll((els) => {
          const bottoms = els
            .filter((el) => (el as HTMLElement).offsetParent)
            .map((el) => el.getBoundingClientRect().bottom);
          return bottoms.length ? Math.max(...bottoms) : Infinity;
        }),
      )
      .toBeLessThanOrEqual(900);
  });
});

// The header is a justify-between row whose logo link can shrink; the wide
// Eurostile nav must leave it room on a phone, and stay on screen itself.
for (const [width, floor] of [
  [390, 140],
  [320, 110],
] as const) {
  test.describe(`header at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test(`the logo keeps ${floor}px and the nav stays on screen`, async ({ page }) => {
      await open(page, "/");
      const logo = await page
        .locator("header img")
        .first()
        .evaluate((img) => img.getBoundingClientRect().width);
      expect(logo).toBeGreaterThanOrEqual(floor);
      const rights = await page
        .locator('header a:not([href="/"])')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().right));
      expect(rights.length).toBe(2);
      for (const right of rights) expect(right).toBeLessThanOrEqual(width);
    });
  });
}
