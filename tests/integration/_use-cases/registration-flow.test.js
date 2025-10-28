import webServer from "@infra/web-server.js";
import activation from "@models/activation.js";
import user from "@models/user.js";
import orchestrator from "@tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  const expectedEmail = "registration.flow@gmail.com";
  const userPassword = "RegistrationFlowPassword";
  let createUserResponseBody;
  let activationToken;

  test("Create user account", async () => {
    const expectedUsername = "RegistrationFlow";

    const createUserResponse = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: expectedUsername,
          email: expectedEmail,
          password: userPassword,
        }),
      },
    );

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponse.status).toBe(201);
    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: expectedUsername,
      email: expectedEmail,
      features: ["read:activation_token"],
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@spacenews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@gmail.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no SpaceNews!");
    expect(lastEmail.text).toContain("RegistrationFlow");

    const activationTokenId = orchestrator.extractActivationTokenId(
      lastEmail.text,
    );

    activationToken = await activation.findOneValidById(activationTokenId);

    expect(lastEmail.text).toContain(
      `${webServer.origin}/register/activate/${activationToken.id}`,
    );

    expect(createUserResponseBody.id).toBe(activationToken.user_id);
    expect(activationToken.used_at).toBe(null);
    expect(Number(activationToken.expires_at)).toBeGreaterThan(Date.now());
  });

  test("Activate account", async () => {
    const response = await fetch(
      `http://localhost:3000/api/v1/activations/${activationToken.id}`,
      {
        method: "PATCH",
      },
    );

    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(Date.parse(responseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername(
      createUserResponseBody.username,
    );

    expect(activatedUser.features).toEqual(["create:session"]);
  });

  test("Login", async () => {
    const createSessionResponse = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: expectedEmail,
          password: userPassword,
        }),
      },
    );

    expect(createSessionResponse.status).toBe(201);

    const createSessionResponseBody = await createSessionResponse.json();

    expect(createSessionResponseBody.user_id).toBe(createUserResponseBody.id);
  });

  test("Get user information", async () => {});
});
