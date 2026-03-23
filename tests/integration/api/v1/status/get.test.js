import webServer from "@infra/web-server.js";
import orchestrator from "@tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch(`${webServer.origin}/api/v1/status`);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.dependencies.database.version).toBeUndefined();
      expect(responseBody.dependencies.database.max_connections).toBe(100);
      expect(responseBody.dependencies.database.opened_connections).toBe(1);
    });
  });

  describe("Default user", () => {
    test("Retrieving current system status", async () => {
      const user = await orchestrator.createUser();

      const activatedUser = await orchestrator.activateUser(user.id);

      const session = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(`${webServer.origin}/api/v1/status`, {
        headers: {
          Cookie: `session_id=${session.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.dependencies.database.max_connections).toBe(100);
      expect(responseBody.dependencies.database.opened_connections).toBe(1);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Privileged user", () => {
    describe("With `read:status:all`", () => {
      test("Retrieving current system status", async () => {
        const privilegedUser = await orchestrator.createUser();

        const activatedPrivilegedUser = await orchestrator.activateUser(
          privilegedUser.id,
        );

        await orchestrator.addFeaturesToUser(privilegedUser.id, [
          "read:status:all",
        ]);

        const privilegedUserSession = await orchestrator.createSession(
          activatedPrivilegedUser.id,
        );

        const response = await fetch(`${webServer.origin}/api/v1/status`, {
          headers: {
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
        });

        const responseBody = await response.json();

        expect(response.status).toBe(200);
        expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
        expect(responseBody.dependencies.database.max_connections).toBe(100);
        expect(responseBody.dependencies.database.opened_connections).toBe(1);
        expect(responseBody.dependencies.database).toHaveProperty("version");
        expect(responseBody.dependencies.database.version).toBe("16.0");
      });
    });
  });
});
