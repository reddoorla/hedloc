import { test, expect } from "@playwright/test";

test("the contact fields tell the browser what to autofill", async ({ page }) => {
  await page.goto("/contact");
  const fields = await page
    .locator("form input:not([type=hidden]):not([name=bot-field]), form textarea")
    .evaluateAll((els) =>
      els.map((e) => `${e.getAttribute("name")}=${e.getAttribute("autocomplete")}`),
    );
  expect(fields).toEqual(["name=name", "email=email", "phone=tel", "message=null"]);
  await expect(page.locator("input[name=bot-field]")).toHaveAttribute("autocomplete", "off");
});
