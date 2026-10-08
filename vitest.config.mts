import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          exclude: ["src/**/*.int.test.ts", "src/**/*.load.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.int.test.ts"],
          globalSetup: ["src/test/integration-global-setup.ts"],
          // Integration tests share one database: run files sequentially.
          fileParallelism: false,
        },
      },
      {
        resolve: { alias },
        test: {
          // Phase 7: many guests at once against the disposable test database.
          name: "load",
          environment: "node",
          include: ["src/**/*.load.test.ts"],
          globalSetup: ["src/test/integration-global-setup.ts"],
          fileParallelism: false,
          testTimeout: 180_000,
        },
      },
    ],
  },
});
