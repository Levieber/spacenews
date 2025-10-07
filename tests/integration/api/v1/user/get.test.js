import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import orchestrator from "@tests/orchestrator.js";
import session from "@models/session.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const expectedUsername = "UserWithValidSession";

      const createdUser = await orchestrator.createUser({
        username: expectedUsername,
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: createdUser.id,
        username: expectedUsername,
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const cacheControl = response.headers.get("Cache-Control");

      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );

      const renewedSession = await session.findOneValidByToken(
        createdSession.token,
      );

      expect(renewedSession.created_at).toEqual(createdSession.created_at);
      expect(renewedSession.expires_at > createdSession.expires_at).toBe(true);
      expect(renewedSession.updated_at > createdSession.updated_at).toBe(true);

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: renewedSession.token,
        path: "/",
        httpOnly: true,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
      });
    });

    test("With halfway-expired session", async () => {
      vi.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS / 2),
      });

      const expectedUsername = "UserWithHalfwayExpiredSession";

      const createdUser = await orchestrator.createUser({
        username: expectedUsername,
      });

      const createdSession = await orchestrator.createSession(createdUser.id);

      vi.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: createdUser.id,
        username: expectedUsername,
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const renewedSession = await session.findOneValidByToken(
        createdSession.token,
      );

      renewedSession.expires_at.setMilliseconds(0);
      createdSession.expires_at.setMilliseconds(0);

      expect(renewedSession.created_at).toEqual(createdSession.created_at);
      expect(renewedSession.updated_at > createdSession.updated_at).toBe(true);
      expect(renewedSession.expires_at > createdSession.expires_at).toBe(true);
      expect(renewedSession.expires_at).toEqual(
        new Date(
          +createdSession.expires_at + session.EXPIRATION_IN_MILLISECONDS / 2,
        ),
      );

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: renewedSession.token,
        path: "/",
        httpOnly: true,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
      });
    });

    test("With nonexistent session", async () => {
      const nonexistentToken =
        "f9f35d250d33ba744f5a42864cdefa17d630ac394d585a4f6de25d5c8aefa64c";

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });

    test("With expired session", async () => {
      vi.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser();
      const createdSession = await orchestrator.createSession(createdUser.id);

      vi.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      const responseBody = await response.json();

      expect(response.status).toBe(401);
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
