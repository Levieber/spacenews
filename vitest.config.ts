import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

const env = dotenv.config({ path: ".env.development", quiet: true }).parsed;

export default defineConfig({
  test: {
    env,
    pool: "threads",
    globals: true,
    isolate: false,
    fileParallelism: false,
    forceRerunTriggers: [
      "**/package.json/**",
      "**/vitest.config.*/**",
      "**/vite.config.*/**",
      "**/jsconfig.json/**",
      "**/pages/**/*",
      "**/models/**/*",
      "**/infra/**/*",
    ],
  },
});
