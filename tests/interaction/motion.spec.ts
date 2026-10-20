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
});
