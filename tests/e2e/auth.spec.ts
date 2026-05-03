import { test, expect } from "@playwright/test";

/**
 * Auth happy-path regression.
 *
 * This test exists because we hit a real bug where signing in with email +
 * password landed the user back on /login on the first click — a cookie
 * race between the client-side signInWithPassword and router.push. The fix
 * was converting sign-in to a Server Action so cookie + redirect ship in
 * one HTTP response. This test guards against that regression coming back.
 *
 * **Required env vars when running locally or in CI:**
 *   E2E_TEST_EMAIL    — existing confirmed Supabase user
 *   E2E_TEST_PASSWORD — its password
 *
 * Use a dedicated test account that has nothing else interesting in it; this
 * test signs in as that user and then signs out. It does not mutate the
 * locker or billing.
 *
 * If those env vars are missing, the test is skipped (so a clean clone
 * doesn't fail before the user has set things up).
 */
const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("sign-in", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping. See tests/e2e/auth.spec.ts."
  );

  test("first-click sign-in lands on /dashboard (no second click required)", async ({
    page,
  }) => {
    await page.goto("/login");

    // Form is visible.
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    // Fill the form.
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);

    // Click submit ONCE and expect the dashboard URL.
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 10_000 }),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);

    // Dashboard chrome is rendered.
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("signed-in users hitting /login bounce to /dashboard", async ({ page }) => {
    // Sign in first
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/dashboard");

    // Try to navigate back to /login while signed in
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("invalid credentials surface an inline error without redirecting", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("not-a-real-user@example.com");
    await page.getByLabel("Password").fill("Wrong-password-123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Server Action returns the error; client renders it. Should still be on /login.
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toBeVisible();
  });
});
