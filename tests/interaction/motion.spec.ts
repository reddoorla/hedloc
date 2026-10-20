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

// Operator, 2026-10-20: the team bio "feels too slow", and the home images
// should stagger in, "a bit sooner", the way reddoorla/reddoor-website does it
// (one reveal per image, up to 400ms of left-to-right delay; the travel here is
// a fixed 96px, see TILE_REVEAL in the home page).
test.describe("bio and image-band timing, with motion allowed", () => {
  test.use(MOTION);

  const tiles = "section [data-reveal-tile]";

  /** The opacity a reader sees on every band tile, in DOM order. */
  const tileOpacities = (page: Page) =>
    page.locator(tiles).evaluateAll((els) =>
      els.map((el) => {
        let o = 1;
        for (let n: Element | null = el; n; n = n.parentElement) {
          o *= Number(getComputedStyle(n).opacity);
        }
        return o;
      }),
    );

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    // The open card shows a headshot the reader has just seen sharp in the
    // grid. Blurring it up again held the bio's photo soft for 1.5s after the
    // text had arrived, which is what read as slow.
    test(`an opened bio's headshot is sharp at once (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/executive-team");
      await hydrated(page);
      const first = page.locator("button.members").first();
      await first.scrollIntoViewIfNeeded();
      await expect(first.locator("img")).toHaveClass(/progressive-img--loaded/, {
        timeout: 10_000,
      });
      await first.click();
      const opened = page
        .locator("#team-top img, [data-testid=team-bio] img")
        .locator("visible=true");
      await expect(opened).toHaveCount(1);
      expect(await opened.evaluate((el) => getComputedStyle(el).filter)).toBe("none");
    });

    // How long the bio takes to arrive, read from the animations themselves,
    // since a wall-clock reading depends on when the runner gets a frame. Svelte
    // runs an intro's delay as its own animation before the fade, so the text's
    // total is every animation it runs while opening: 75 + 150ms here, 150 +
    // 150ms on main. The panel behind it is a 150ms CSS transition.
    test(`an opened bio arrives within 250ms (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/executive-team");
      await hydrated(page);
      await page.locator("button.members").first().scrollIntoViewIfNeeded();
      const timing = await page.evaluate(async () => {
        (document.querySelector("button.members") as HTMLElement).click();
        const panel = document.querySelector("[data-testid=team-bio]")!;
        // Each animation's length, read when first seen: Svelte drops a finished
        // animation's effect.
        const seen = { panel: new Map<Animation, number>(), text: new Map<Animation, number>() };
        const record = (map: Map<Animation, number>, el: Element | null) => {
          for (const a of el?.getAnimations() ?? []) {
            const t = a.effect?.getTiming();
            if (t && !map.has(a)) map.set(a, Number(t.delay ?? 0) + Number(t.duration ?? 0));
          }
        };
        const t0 = performance.now();
        while (performance.now() - t0 < 800) {
          record(seen.panel, panel);
          record(seen.text, panel.firstElementChild);
          await new Promise((r) => requestAnimationFrame(r));
        }
        const total = (map: Map<Animation, number>) => [...map.values()].reduce((a, b) => a + b, 0);
        return { panel: total(seen.panel), text: total(seen.text), textAnims: seen.text.size };
      });
      expect(timing.textAnims, "the bio text animates in").toBeGreaterThan(0);
      expect(timing.text, "bio text, delay plus fade (ms)").toBeLessThanOrEqual(250);
      expect(timing.panel, "bio panel fade (ms)").toBeLessThanOrEqual(200);
    });
  }

  test.describe("the home image band at 1440×900", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("each image reveals on its own, later the further right it sits", async ({ page }) => {
      await page.goto("/");
      await hydrated(page);
      const delays = await page.locator(tiles).evaluateAll((els) =>
        els.map((el) => {
          let top = 0;
          let left = 0;
          for (let n = el as HTMLElement | null; n; n = n.offsetParent as HTMLElement | null) {
            top += n.offsetTop;
            left += n.offsetLeft;
          }
          const style = (el as HTMLElement).style;
          return { top, left, delay: parseFloat(style.transitionDelay), travel: style.transform };
        }),
      );
      expect(delays.length, "one reveal per image").toBe(4);
      // Every tile hides at the travel app.css gives [data-reveal="tile"] at
      // first paint (the unit test binds that rule to TILE_REVEAL). A tile with
      // a travel of its own would slide at hydration and start late.
      expect(delays.map((d) => d.travel)).toEqual(Array(4).fill("translateY(96px)"));
      // The top row (vertical image, then the two to its right) staggers left to right.
      const firstTop = Math.min(...delays.map((d) => d.top));
      const row = delays
        .filter((d) => Math.abs(d.top - firstTop) < 2)
        .sort((a, b) => a.left - b.left);
      expect(row.length).toBe(3);
      expect(row[0].delay).toBeLessThan(row[1].delay);
      expect(row[1].delay).toBeLessThan(row[2].delay);
      expect(row[2].delay).toBeLessThanOrEqual(400);
    });

    test("the whole top row starts in once the band is 150px into view", async ({ page }) => {
      await page.goto("/");
      await hydrated(page);
      const images = "section img.progressive-img";
      // Scroll so the band's top, in its laid-out (unshifted) place, sits 150px
      // above the bottom of the viewport, and name the images on that top row.
      const topRow = await page.locator(images).evaluateAll((els) => {
        const top = (el: Element) => {
          let t = 0;
          for (let n = el as HTMLElement | null; n; n = n.offsetParent as HTMLElement | null) {
            t += n.offsetTop;
          }
          return t;
        };
        const rowTop = Math.min(...els.map(top));
        window.scrollTo(0, rowTop - window.innerHeight + 150);
        return els.map((el, i) => (Math.abs(top(el) - rowTop) < 2 ? i : -1)).filter((i) => i >= 0);
      });
      expect(topRow.length, "three images in the band's top row").toBe(3);
      // On main, none of them had started.
      for (const i of topRow) {
        await expect
          .poll(() => seenOpacity(page, `${images} >> nth=${i}`), { timeout: 4_000 })
          .toBeGreaterThan(0);
      }
    });

    test("every image ends fully in once scrolled to", async ({ page }) => {
      await page.goto("/");
      await hydrated(page);
      for (const tile of await page.locator(tiles).all()) await tile.scrollIntoViewIfNeeded();
      await expect.poll(() => tileOpacities(page), { timeout: 8_000 }).toEqual([1, 1, 1, 1]);
    });
  });

  // The top-right pair used to overrun the row by up to 41px, by an amount
  // that depended on which image size had loaded (#74); now it ends flush with
  // the image below it at every desktop width.
  for (const width of [1440, 1920, 2560]) {
    test(`the band's top row ends flush with the image below it (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });
      const boxes = await page.locator(tiles).evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right };
        }),
      );
      expect(boxes.length).toBe(4);
      const [, small, side, bottom] = boxes;
      expect(Math.abs(side.right - bottom.right), "right edges").toBeLessThanOrEqual(1);
      expect(Math.abs(small.left - bottom.left), "left edges").toBeLessThanOrEqual(1);
      expect(Math.abs(side.left - small.right - 40), "the 40px gap").toBeLessThanOrEqual(1);
    });
  }

  test.describe("the home image list at 390×844", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("each image reveals on its own and ends fully in", async ({ page }) => {
      await page.goto("/");
      await hydrated(page);
      const count = await page.locator(tiles).count();
      expect(count, "one reveal per image").toBe(3);
      // All three wait below the fold until the reader scrolls to them.
      await page.waitForTimeout(3_000);
      expect(await tileOpacities(page)).toEqual([0, 0, 0]);
      for (const tile of await page.locator(tiles).all()) await tile.scrollIntoViewIfNeeded();
      await expect.poll(() => tileOpacities(page), { timeout: 8_000 }).toEqual([1, 1, 1]);
    });
  });
});
