import database from "infra/database.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
});

test("POST to /api/v1/migrations should return 200", async () => {
  const liveRun = async () =>
    await fetch("http://localhost:3000/api/v1/migrations", {
      method: "POST",
    });

  const firstResponse = await liveRun();
  const firstResponseBody = await firstResponse.json();

  const secondResponse = await liveRun();
  const secondResponseBody = await secondResponse.json();

  expect(firstResponse.status).toBe(201);
  expect(Array.isArray(firstResponseBody)).toBe(true);
  expect(firstResponseBody.length).toBeGreaterThan(0);
  expect(secondResponse.status).toBe(200);
  expect(Array.isArray(secondResponseBody)).toBe(true);
  expect(secondResponseBody).toHaveLength(0);
});
