import { test, expect, type Page } from "@playwright/test";

const FIXTURE = "/dev/executive-team";
const NAMES = ["Member One", "Member Two", "Member Three", "Member Four Annamalai"];
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
  const bio = await last.boundingBox();
  const section = await box(page, "[data-testid=team-section]");
  const paddingBottom = await page
    .getByTestId("team-section")
    .evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
  expect(bio!.y + bio!.height).toBeLessThanOrEqual(section.y + section.height - paddingBottom + PX);
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
  for (const lines of offsets) for (const offset of lines) expect(offset).toBeLessThanOrEqual(PX);
}

for (const width of [1440, 1024]) {
  test.describe(`Executive Team at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("the four members fill one row, from its left edge to its right edge", async ({
      page,
    }) => {
      const members = await openFixture(page);
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
        await expect(page.locator("#team-top h4")).toHaveText(name);
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

    test("the longest bio stays inside the section instead of running into the footer", async ({
      page,
    }) => {
      const members = await openFixture(page);
      await members.nth(3).click();
      await expectBioInsideSection(page, "Member Four Annamalai paragraph 5.");
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
      await members.nth(3).click();
      await expect(page.getByText("Member Four Annamalai bio.")).toBeVisible();
      await expectBioInsideSection(page, "Member Four Annamalai paragraph 5.");
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page.getByText("Member Four Annamalai bio.")).toHaveCount(0);
    });
  });
}
