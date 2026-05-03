import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — full-browser end-to-end tests.
 *
 * Default `BASE_URL` is the live deployed environment so anyone can run
 * E2E against prod with zero local setup. Override via env var to run against
 * localhost when actively developing:
 *
 *   E2E_BASE_URL=http://localhost:3000 npm run test:e2e
 *
 * Tests live in tests/e2e/. They expect a seeded Supabase user; see
 * tests/e2e/auth.spec.ts header for the seeding contract.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry in CI is enough to filter genuine flakes from real bugs without
  // blowing up the test wall-clock when many tests fail (was 2).
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Per-test cap: if a single test takes longer, kill it. Default 30s is fine
  // but being explicit so a hanging test can't run away with the whole job.
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    // `||` instead of `??` because an empty-string env var (which CI produces
    // when a secret isn't set) would still satisfy `??` and leave baseURL
    // empty — causing every test to fail with "Cannot navigate to invalid URL".
    // `||` also falls through on empty string.
    baseURL: process.env.E2E_BASE_URL || "https://truekit-ten.vercel.app",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
