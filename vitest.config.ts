import { defineConfig } from "vitest/config";

process.loadEnvFile(".env.development");

const env = process.env;

export default defineConfig({
  test: {
    env,
    pool: "threads",
    globals: true,
    isolate: false,
    fileParallelism: false,
    watchTriggerPatterns: [
      {
        pattern: /pages\/api\/v1\/(.*)\/index.js/,
        testsToRun: toRunApiTests,
      },
    ],
  },
  resolve: {
    alias: [
      {
        find: "@models",
        replacement: new URL("./models", import.meta.url).pathname,
      },
      {
        find: "@infra",
        replacement: new URL("./infra", import.meta.url).pathname,
      },
      {
        find: "@tests",
        replacement: new URL("./tests", import.meta.url).pathname,
      },
    ],
  },
});

function toRunApiTests(
  _id: string,
  match: RegExpMatchArray,
): string[] | string | null | undefined | void {
  const baseUrl = `tests/integration/api/v1/${match[1]}`;

  return [
    `${baseUrl}/get.test.js`,
    `${baseUrl}/post.test.js`,
    `${baseUrl}/put.test.js`,
    `${baseUrl}/delete.test.js`,
  ];
}
