import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest config — for unit tests only.
 *
 * The `@/*` alias is configured manually here (mirroring tsconfig.json's
 * `"@/*": ["./*"]`) instead of via vite-tsconfig-paths. The plugin is
 * ESM-only and breaks Vitest's CommonJS config loader; defining the alias
 * inline avoids that and there's no other use case for the plugin.
 *
 * E2E browser tests run via Playwright (separate `npm run test:e2e`).
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
