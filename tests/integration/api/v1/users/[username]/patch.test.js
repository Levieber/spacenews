import { version as uuidVersion } from "uuid";
import orchestrator from "@tests/orchestrator.js";
import user from "@models/user.js";
import password from "@models/password.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With unique 'username'", async () => {
      const uniqueUsernameUser = await orchestrator.createUser({
        username: "uniqueAnonymousUser",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${uniqueUsernameUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUser2",
          }),
        },
      );

      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        action: 'Verifique se o seu usuário possui a permissão "update:user".',
        message: "Você não possui permissão para executar essa ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent 'username'", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser.id);
      const session = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${session.token}`,
          },
        },
      );

      const responseBody = await response.json();

      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O nome de usuário informado não foi encontrado no sistema.",
        action: "Verifique se o nome de usuário está digitado corretamente.",
        status_code: 404,
      });
    });

    test("With duplicated 'username'", async () => {
      const user1 = await orchestrator.createUser({ username: "user1" });
      const user2 = await orchestrator.createUser({ username: "user2" });

      const activatedUser = await orchestrator.activateUser(user2.id);
      const session = await orchestrator.createSession(activatedUser.id);

      const errorResponse = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            username: user1.username,
          }),
        },
      );

      const errorResponseBody = await errorResponse.json();

      expect(errorResponse.status).toBe(400);
      expect(errorResponseBody).toEqual({
        name: "ValidationError",
        message: "O nome de usuário informado já está sendo utilizado.",
        action: "Utilize outro nome de usuário para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      const user1 = await orchestrator.createUser({
        email: "email1@gmail.com",
      });

      const user2 = await orchestrator.createUser({
        email: "email2@gmail.com",
      });

      const activatedUser = await orchestrator.activateUser(user2.id);
      const session = await orchestrator.createSession(activatedUser.id);

      const errorResponse = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            email: user1.email,
          }),
        },
      );

      const errorResponseBody = await errorResponse.json();

      expect(errorResponse.status).toBe(400);
      expect(errorResponseBody).toEqual({
        name: "ValidationError",
        message: "O e-mail informado já está sendo utilizado.",
        action: "Utilize outro e-mail para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With `userB` targeting `userA`", async () => {
      const userA = await orchestrator.createUser({ username: "userA" });
      const userB = await orchestrator.createUser({ username: "userB" });

      const activatedUser = await orchestrator.activateUser(userB.id);
      const session = await orchestrator.createSession(activatedUser.id);

      const errorResponse = await fetch(
        `http://localhost:3000/api/v1/users/${userA.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            username: "userC",
          }),
        },
      );

      const errorResponseBody = await errorResponse.json();

      expect(errorResponse.status).toBe(403);
      expect(errorResponseBody).toEqual({
        action:
          "Verifique se você possui a permissão necessária para atualizar outro usuário",
        message: "Você não possui permissão para atualizar outro usuário",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With unique 'username'", async () => {
      const initialUsername = "uniqueUser1";
      const expectedUsername = "uniqueUser2";

      const uniqueUsernameUser = await orchestrator.createUser({
        username: initialUsername,
      });

      const activatedUser = await orchestrator.activateUser(
        uniqueUsernameUser.id,
      );

      const session = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${uniqueUsernameUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            username: expectedUsername,
          }),
        },
      );

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: expectedUsername,
        email: uniqueUsernameUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const initialEmail = "uniqueUser1";
      const expectedEmail = "uniqueEmail2@gmail.com";

      const uniqueEmailUser = await orchestrator.createUser({
        email: initialEmail,
      });

      const activatedUser = await orchestrator.activateUser(uniqueEmailUser.id);

      const session = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${uniqueEmailUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            email: expectedEmail,
          }),
        },
      );

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: uniqueEmailUser.username,
        email: expectedEmail,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      const initialPassword = "newPassword1";
      const expectedPassword = "newPassword2";

      const newPasswordUser = await orchestrator.createUser({
        password: initialPassword,
      });

      const activatedUser = await orchestrator.activateUser(newPasswordUser.id);

      const session = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${newPasswordUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
          body: JSON.stringify({
            password: expectedPassword,
          }),
        },
      );

      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: newPasswordUser.username,
        email: newPasswordUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(
        newPasswordUser.username,
      );

      const correctPasswordMatch = await password.compare(
        expectedPassword,
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        initialPassword,
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });

  describe("Privileged user", () => {
    test("With `update:user:others` targeting `defaultUser`", async () => {
      const privilegedUser = await orchestrator.createUser();

      const activatedPrivilegedUser = await orchestrator.activateUser(
        privilegedUser.id,
      );

      await orchestrator.addFeaturesToUser(privilegedUser.id, [
        "update:user:others",
      ]);

      const privilegedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser.id,
      );

      const defaultUser = await orchestrator.createUser();

      const expectedUsername = "AlteradoPorPrivilegiado";

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
          body: JSON.stringify({
            username: expectedUsername,
          }),
        },
      );

      const responseBody = await response.json();

      const createdAt = defaultUser.created_at.toISOString();

      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: defaultUser.id,
        username: expectedUsername,
        email: defaultUser.email,
        features: defaultUser.features,
        password: responseBody.password,
        created_at: createdAt,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > createdAt).toBe(true);
    });
  });
});
