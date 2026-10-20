import { expect, test, type Page } from "@playwright/test";

// The site's motion, measured in a browser: the route wash, the image blur-up,
// the button hop, and that none of it runs for a reader who asked for less
// motion (reddoorla/hedloc#60, ported from reddoor-starter).
//
// EVERY motion-on test sets `reducedMotion: "no-preference"` itself. The shared
// Playwright config (@reddoorla/maintenance/configs/playwright-a11y) forces
// `reduce` on every context, so a spec that inherits the default measures a
// page where none of this runs and passes whatever the site ships.

const MOTION = { contextOptions: { reducedMotion: "no-preference" as const } };
const REDUCE = { contextOptions: { reducedMotion: "reduce" as const } };

const OVERLAY = "[data-transition-overlay]";

/** Record, from before the first script runs, every time the route wash is
 *  added to or removed from the DOM. The sheet is up for ~600ms, so polling for
 *  it races; a MutationObserver sees it however briefly it lives. */
async function recordOverlay(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __overlay: string[] };
    w.__overlay = [];
    new MutationObserver((records) => {
      for (const r of records) {
        for (const n of r.addedNodes) {
          if (n instanceof Element && n.matches("[data-transition-overlay]"))
            w.__overlay.push("in");
        }
        for (const n of r.removedNodes) {
          if (n instanceof Element && n.matches("[data-transition-overlay]")) {
            w.__overlay.push("out");
          }
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
}

const overlayLog = (page: Page) =>
  page.evaluate(() => (window as unknown as { __overlay: string[] }).__overlay);

/** Wait until SvelteKit has hydrated, so a click is a client navigation and not
 *  a full page load (which would get no wash, by design). */
async function hydrated(page: Page) {
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-hydrated"));
}

/** The opacity a reader actually sees: the element's own, times every
 *  ancestor's. The reveal hides a block's container, not the node a locator
 *  names. */
const seenOpacity = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      let o = 1;
      for (let n: Element | null = el; n; n = n.parentElement) {
        o *= Number(getComputedStyle(n).opacity);
      }
      return o;
    });

test.describe("with motion allowed", () => {
  test.use(MOTION);

  test("a click from / to /executive-team washes the route, then lifts", async ({ page }) => {
    await recordOverlay(page);
    await page.goto("/");
    await hydrated(page);

    await page.locator('header a[href="/executive-team"]').click();
    await expect(page).toHaveURL(/\/executive-team$/);

    await expect.poll(() => overlayLog(page), { timeout: 5_000 }).toEqual(["in", "out"]);
    await expect(page.locator(OVERLAY)).toHaveCount(0);
  });

  test("a navigation that never completes does not leave the page covered", async ({ page }) => {
    // Hold the incoming route's data forever: beforeNavigate fires, afterNavigate
    // never does. Only the overlay's own ceiling can lift the sheet now.
    await recordOverlay(page);
    await page.goto("/");
    await hydrated(page);
    await page.route("**/executive-team/__data.json*", () => {});

    await page.locator('header a[href="/executive-team"]').click();
    await expect.poll(() => overlayLog(page), { timeout: 2_000 }).toEqual(["in"]);

    // MAX_COVER_MS is 3000 and the lift fades out over 320ms.
    await expect.poll(() => overlayLog(page), { timeout: 6_000 }).toEqual(["in", "out"]);
    await expect(page).toHaveURL(/\/$/);
  });

  test("team headshots blur up once they load", async ({ page }) => {
    await page.goto("/executive-team");
    await hydrated(page);

    const headshots = page.locator(".members img");
    expect(await headshots.count(), "the page renders team headshots").toBeGreaterThan(0);
    const first = headshots.first();
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveClass(/progressive-img/);
    await expect(first).toHaveClass(/progressive-img--loaded/, { timeout: 10_000 });
    await expect.poll(() => first.evaluate((el) => getComputedStyle(el).filter)).toBe("blur(0px)");
  });

  test("home-page images blur up once they load", async ({ page }) => {
    await page.goto("/");
    await hydrated(page);

    const images = page.locator("section img.progressive-img");
    expect(await images.count(), "the home page renders blur-up images").toBeGreaterThan(0);
    for (const img of await images.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveClass(/progressive-img--loaded/, { timeout: 10_000 });
    }
  });

  test("a button hops while pressed", async ({ page }) => {
    await page.goto("/");
    await hydrated(page);

    const button = page.locator('a.bump[href="/contact"]').first();
    const box = (await button.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect
      .poll(() => button.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42))
      .toBeLessThan(-7);
    await page.mouse.up();
  });
  // Each viewport puts the first card somewhere else relative to the fold; at
  // 390 and 768 the team is one column of 551-1015px cards, where a 50% travel
  // left the first card's slot empty until the reader scrolled.
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    test(`/executive-team ships its heading and first card hidden, then reveals them without a scroll (${viewport.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      // Hidden in the SERVER markup, so neither paints and then vanishes at
      // hydration; failSafe is what makes shipping it safe. Matched on an
      // element: app.html's <noscript> style names `[data-reveal]` on every page.
      const html = await (await page.request.get("/executive-team")).text();
      expect((html.match(/<[a-z][^>]*\sdata-reveal[\s=>]/g) ?? []).length).toBeGreaterThanOrEqual(
        2,
      );

      await page.goto("/executive-team");
      await hydrated(page);
      // The photo, not the button: the reveal moves a wrapper inside it.
      for (const selector of ["section h2", ".members img"]) {
        await expect
          .poll(() => seenOpacity(page, selector), { timeout: 8_000, message: selector })
          .toBe(1);
      }
    });
  }

  test("the home image band waits below the fold, then reveals on scroll", async ({ page }) => {
    await page.goto("/");
    await hydrated(page);
    const band = "section img.progressive-img";
    // Well past the fail-safe: below the fold, it waits for the reader.
    await page.waitForTimeout(3_000);
    expect(await seenOpacity(page, band), "revealed before it was scrolled to").toBe(0);

    await page.locator(band).first().scrollIntoViewIfNeeded();
    await expect.poll(() => seenOpacity(page, band), { timeout: 8_000 }).toBe(1);
  });
});

test.describe("under prefers-reduced-motion: reduce", () => {
  test.use(REDUCE);

  test("a navigation raises no wash", async ({ page }) => {
    await recordOverlay(page);
    await page.goto("/");
    await hydrated(page);

    await page.locator('header a[href="/executive-team"]').click();
    await expect(page).toHaveURL(/\/executive-team$/);
    await page.waitForTimeout(800);
    expect(await overlayLog(page)).toEqual([]);
  });

  test("images are never blurred", async ({ page }) => {
    // Held images stay unloaded, so the only thing that can keep them sharp is
    // the reduced-motion rule itself.
    await page.route(/images\.prismic\.io/, () => {});
    await page.goto("/executive-team", { waitUntil: "domcontentloaded" });
    const first = page.locator(".members img").first();
    await expect(first).toHaveClass(/progressive-img/);
    expect(await first.evaluate((el) => getComputedStyle(el).filter)).toBe("none");
  });

  test("a button does not move while pressed", async ({ page }) => {
    await page.goto("/");
    await hydrated(page);

    const button = page.locator('a.bump[href="/contact"]').first();
    const box = (await button.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(400);
    expect(await button.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
    await page.mouse.up();
  });

  test("revealed content is visible at once", async ({ page }) => {
    await page.goto("/dev/animate-in");
    await hydrated(page);
    // The subjects, and the block animateIn writes to inside the ContentWidth one.
    const targets = page.locator("[data-reveal-subject], [data-reveal-subject] > div");
    expect(await targets.count()).toBeGreaterThan(0);
    for (const t of await targets.all()) {
      expect(await t.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    }
  });
  test("/executive-team shows its heading and team at once", async ({ page }) => {
    await page.goto("/executive-team", { waitUntil: "domcontentloaded" });
    expect(await seenOpacity(page, "section h2")).toBe(1);
    expect(await seenOpacity(page, ".members img")).toBe(1);
  });
});
