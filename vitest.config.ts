import { defineConfig } from "vitest/config";

// Unit tests live next to the code (src/**/__tests__/*.test.ts).
// Playwright specs use the *.spec.ts suffix under e2e/ and must not be collected by vitest.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
