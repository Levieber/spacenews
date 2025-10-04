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
    test("With nonexistent 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
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

      const errorResponse = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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

      const errorResponse = await fetch(
        `http://localhost:3000/api/v1/users/${user2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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

    test("With unique 'username'", async () => {
      const initialUsername = "uniqueUser1";
      const expectedUsername = "uniqueUser2";

      const uniqueUsernameUser = await orchestrator.createUser({
        username: initialUsername,
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${uniqueUsernameUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
        features: ["read:activation_token"],
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

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${uniqueEmailUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
        features: ["read:activation_token"],
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

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${newPasswordUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
        features: ["read:activation_token"],
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
});
