import { test, expect } from "@playwright/test";

/**
 * Auth regression suite.
 *
 * The bug we keep almost-fixing: signing in with email + password lands the
 * user back on /login on the first click, requiring a second click. Root
 * cause: cookie-write race between client-side signInWithPassword and the
 * post-signin navigation. The current fix is a native form POST to
 * /api/auth/signin (Route Handler) — the 303 redirect ships Set-Cookie in
 * the same response, so cookies are unambiguously present on the GET that
 * follows.
 *
 * This file's job is to fail loudly the *next* time the regression slips in.
 *
 * **Required env vars:**
 *   E2E_TEST_EMAIL    — existing confirmed Supabase user
 *   E2E_TEST_PASSWORD — its password
 *
 * Use a dedicated test account. These tests sign in / out / hit the dashboard
 * — they don't write to the locker or billing.
 *
 * If env vars are missing, the suite is skipped (so a fresh clone doesn't
 * fail before you've configured anything).
 */
const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("auth: sign-in", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping. See tests/e2e/auth.spec.ts."
  );

  test.beforeEach(async ({ context }) => {
    // Always start from a clean cookie jar so we don't accidentally pass
    // because we were already signed in from a previous test.
    await context.clearCookies();
  });

  test("first-click sign-in lands on /dashboard within 5 seconds", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);

    // Single click. Tight timeout — if this takes >5s something is wrong.
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 5_000 }),
      page.getByRole("button", { name: /^sign in$/i }).click(),
    ]);

    // Server-rendered dashboard chrome present (proves the GET to /dashboard
    // saw the auth cookie, not just a client-side redirect).
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(EMAIL!)).toBeVisible();
  });

  test("session persists across navigations", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL("**/dashboard");

    // Hop around protected pages — should never bounce to /login.
    for (const path of ["/gear-locker", "/compare", "/billing", "/account"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path));
    }
  });

  test("?next= sends user to the requested protected page after signin", async ({
    page,
  }) => {
    // Hit a protected page while logged out — bounces to /login?next=…
    await page.goto("/billing");
    await expect(page).toHaveURL(/\/login\?.*next=%2Fbilling/);

    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await page.waitForURL("**/billing");
    await expect(page.getByRole("heading", { name: /^billing$/i })).toBeVisible();
  });

  test("invalid credentials return to /login with an inline error (no nav loop)", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("definitely-not-a-real-user@example.com");
    await page.getByLabel("Password").fill("Wrong-password-123!");

    await page.getByRole("button", { name: /^sign in$/i }).click();

    // 303 → redirected back to /login with ?authError=…
    await page.waitForURL(/\/login\?.*authError=/);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("signed-in users hitting /login bounce to /dashboard", async ({ page }) => {
    // Sign in
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL("**/dashboard");

    // Try to navigate back to /login while signed in — proxy.ts should bounce
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("sign out then back in works (no stale cookie issues)", async ({ page }) => {
    // Sign in
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page.waitForURL("**/dashboard");

    // Sign out
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"));

    // Sign back in — should still be one-click
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL!);
    await page.getByLabel("Password").fill(PASSWORD!);
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 5_000 }),
      page.getByRole("button", { name: /^sign in$/i }).click(),
    ]);
  });
});
