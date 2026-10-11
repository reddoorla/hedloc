import { test, expect, type Page } from "@playwright/test";

const FIXTURE = "/dev/executive-team";
const NAMES = ["Member One", "Member Two", "Member Three", "Member Four Longer Placeholder"];
const PX = 1;

async function openFixture(page: Page) {
  await page.goto(FIXTURE);
  await expect(page.getByTestId("team-section")).toHaveAttribute("data-hydrated", "true");
  const members = page.locator("button.members");
  await expect(members).toHaveCount(NAMES.length);
  return members;
}

async function box(page: Page, selector: string) {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`${selector} has no box`);
  return b;
}

async function expectBioInsideSection(page: Page, lastParagraph: string) {
  const last = page.getByText(lastParagraph);
  await expect(last).toBeVisible();
  const { bioBottom, contentBottom } = await page
    .getByTestId("team-section")
    .evaluate((section, text) => {
      const paragraph = [...section.querySelectorAll("p")].find((p) =>
        p.textContent!.startsWith(text),
      )!;
      const s = section.getBoundingClientRect();
      return {
        bioBottom: paragraph.getBoundingClientRect().bottom,
        contentBottom: s.bottom - parseFloat(getComputedStyle(section).paddingBottom),
      };
    }, lastParagraph);
  expect(bioBottom).toBeLessThanOrEqual(contentBottom + PX);
}

function bioPanel(page: Page) {
  return page.getByTestId("team-bio");
}

async function lineOffsets(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((els) =>
    els.map((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const left = el.closest("button")!.getBoundingClientRect().left;
      return [...range.getClientRects()].map((line) => Math.round(line.left - left));
    }),
  );
}

async function expectLinesFromLeftEdge(page: Page, selector: string) {
  const offsets = await lineOffsets(page, selector);
  expect(offsets.length).toBeGreaterThan(0);
  expect(Math.max(...offsets.map((lines) => lines.length))).toBeGreaterThan(1);
  for (const lines of offsets) for (const offset of lines) expect(offset).toBeLessThanOrEqual(PX);
}

for (const width of [1440, 1024]) {
  test.describe(`Executive Team at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("the four members fill one row, from its left edge to its right edge", async ({
      page,
    }) => {
      const members = await openFixture(page);
      await expect(bioPanel(page)).toHaveCSS("opacity", "0");
      const row = await box(page, "#team-top >> xpath=..");
      const boxes = [];
      for (let i = 0; i < NAMES.length; i++) boxes.push((await members.nth(i).boundingBox())!);

      for (const b of boxes) expect(Math.abs(b.y - boxes[0].y)).toBeLessThanOrEqual(PX);
      expect(Math.abs(boxes[0].x - row.x)).toBeLessThanOrEqual(PX);
      const last = boxes[boxes.length - 1];
      expect(Math.abs(last.x + last.width - (row.x + row.width))).toBeLessThanOrEqual(PX);
      for (const b of boxes) expect(Math.abs(b.width - boxes[0].width)).toBeLessThanOrEqual(PX);
    });

    test("each member opens their own bio beside their headshot, and Close returns to the row", async ({
      page,
    }) => {
      const members = await openFixture(page);
      for (const [i, name] of NAMES.entries()) {
        await members.nth(i).click();
        await expect(page.getByText(`${name} bio.`)).toBeVisible();
        await expect(bioPanel(page)).toHaveCSS("opacity", "1");
        await expect(page.locator("#team-top h4")).toHaveText(name);
        await expect(page.locator("#team-top img")).toHaveAttribute("alt", name);
        for (const other of NAMES.filter((n) => n !== name)) {
          await expect(page.getByText(`${other} bio.`)).toHaveCount(0);
        }

        const selected = await box(page, "#team-top button");
        const firstColumn = await members.first().boundingBox();
        expect(Math.abs(selected.x - firstColumn!.x)).toBeLessThanOrEqual(PX);
        expect(Math.abs(selected.width - firstColumn!.width)).toBeLessThanOrEqual(PX);
        const bio = await page.getByText(`${name} bio.`).boundingBox();
        expect(bio!.x).toBeGreaterThan(selected.x + selected.width);

        await page.locator("#team-top button").click();
        await expect(page.getByText(`${name} bio.`)).toHaveCount(0);
        await expect(bioPanel(page)).toHaveCSS("opacity", "0");
      }
    });

    test("names and titles start at the column's left edge, even when a name wraps", async ({
      page,
    }) => {
      const members = await openFixture(page);
      await expectLinesFromLeftEdge(page, "button.members h4, button.members h5");
      await members.nth(3).click();
      await expect(page.locator("#team-top h4")).toHaveText(NAMES[3]);
      await expectLinesFromLeftEdge(page, "#team-top h4, #team-top h5");
    });

    test("a double-click on the first member leaves their bio open", async ({ page }) => {
      const members = await openFixture(page);
      await members.first().dblclick();
      await page.waitForTimeout(500);
      await expect(page.getByText(`${NAMES[0]} bio.`)).toBeVisible();
      await expect(page.locator("#team-top h4")).toHaveText(NAMES[0]);
    });

    test("the first member answers a click straight after Close", async ({ page }) => {
      const members = await openFixture(page);
      const first = (await members.first().boundingBox())!;
      await members.nth(2).click();
      await expect(page.getByText(`${NAMES[2]} bio.`)).toBeVisible();
      await page.locator("#team-top button").click();
      await page.mouse.click(first.x + first.width / 2, first.y + first.height / 2);
      await expect(page.getByText(`${NAMES[0]} bio.`)).toBeVisible();
    });

    test("a double-click on the open card closes it without opening the first member", async ({
      page,
    }) => {
      const members = await openFixture(page);
      await members.nth(2).click();
      await expect(bioPanel(page)).toHaveCSS("opacity", "1");
      await page.locator("#team-top button").dblclick();
      await page.waitForTimeout(500);
      await expect(bioPanel(page)).toHaveCSS("opacity", "0");
      await expect(page.getByText(`${NAMES[0]} bio.`)).toHaveCount(0);
    });

    test("the open card's name sits where the first member's name does", async ({ page }) => {
      const members = await openFixture(page);
      const memberName = (await members.first().locator("h4").boundingBox())!;
      await members.nth(2).click();
      await expect(page.locator("#team-top h4")).toHaveText(NAMES[2]);
      const cardName = await box(page, "#team-top h4");
      expect(Math.abs(cardName.y - memberName.y)).toBeLessThanOrEqual(PX);
      expect(Math.abs(cardName.x - memberName.x)).toBeLessThanOrEqual(PX);
    });

    test("the longest bio stays inside the section instead of running into the footer", async ({
      page,
    }) => {
      const members = await openFixture(page);
      await members.nth(3).click();
      await expectBioInsideSection(page, "Member Four Longer Placeholder paragraph 5.");
    });
  });
}

for (const width of [768, 390]) {
  test.describe(`Executive Team at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("the members stack, one per line, full width", async ({ page }) => {
      const members = await openFixture(page);
      const row = await box(page, "#team-top >> xpath=..");
      let previousBottom = -Infinity;
      for (let i = 0; i < NAMES.length; i++) {
        const b = (await members.nth(i).boundingBox())!;
        expect(Math.abs(b.x - row.x)).toBeLessThanOrEqual(PX);
        expect(Math.abs(b.width - row.width)).toBeLessThanOrEqual(PX);
        expect(b.y).toBeGreaterThanOrEqual(previousBottom);
        previousBottom = b.y + b.height;
      }
    });

    test("the 4th member opens their bio and Close puts it away", async ({ page }) => {
      const members = await openFixture(page);
      await expect(bioPanel(page)).toHaveCSS("opacity", "0");
      await members.nth(3).click();
      await expect(page.getByText("Member Four Longer Placeholder bio.")).toBeVisible();
      await expect(bioPanel(page)).toHaveCSS("opacity", "1");
      await expectBioInsideSection(page, "Member Four Longer Placeholder paragraph 5.");
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page.getByText("Member Four Longer Placeholder bio.")).toHaveCount(0);
      await expect(bioPanel(page)).toHaveCSS("opacity", "0");
    });
  });
}
