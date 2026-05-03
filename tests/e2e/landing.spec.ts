import { test, expect } from "@playwright/test";

/**
 * Anonymous-page smoke tests. These run against any deployment without
 * needing test credentials, so they're a good first signal that a deploy
 * actually works at all.
 */
test("landing page renders the headline + waitlist form", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /gear intelligence you can/i })
  ).toBeVisible();
  await expect(page.getByPlaceholder(/you@somewhere\.com/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /join waitlist/i })).toBeVisible();
});

test("login page renders the form and a forgot-password link", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /forgot your password/i })).toBeVisible();
});

test("/dashboard redirects to /login when unauthenticated", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  // Should preserve next= so post-login the user lands where they tried to go
  await expect(page).toHaveURL(/next=%2Fdashboard/);
});
