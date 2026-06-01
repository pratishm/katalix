import { expect, test } from "@playwright/test";

test("renders the generated Katalix home screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Welcome to App")).toBeVisible();
  await expect(page.getByTestId("katalix-diagnostics")).toContainText(
    "All generated Katalix manifests are valid.",
  );
});
