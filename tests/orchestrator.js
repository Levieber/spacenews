import retry from "async-retry";
import { Faker, pt_BR } from "@faker-js/faker";
import database from "@infra/database.js";
import migrator from "@models/migrator.js";
import user from "@models/user.js";
import session from "@models/session.js";

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    await retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
      minTimeout: 200,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) {
        throw new Error();
      }
    }
  }

  async function waitForEmailServer() {
    await retry(fetchEmailServer, {
      retries: 100,
      maxTimeout: 1000,
      minTimeout: 200,
    });

    async function fetchEmailServer() {
      const response = await fetch(process.env.EMAIL_HTTP_URL);

      if (response.status !== 200) {
        throw new Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

const faker = new Faker({
  locale: pt_BR,
});

async function createUser(userValues) {
  const username =
    userValues?.username || faker.internet.username().replace(/[.-_]/g, "");
  const email = userValues?.email || faker.internet.email();
  const password = userValues?.password || faker.internet.password();

  return await user.create({
    username,
    email,
    password,
  });
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(`${process.env.EMAIL_HTTP_URL}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailResponse = await fetch(`${process.env.EMAIL_HTTP_URL}/messages`);

  const emailBody = await emailResponse.json();

  const lastEmail = emailBody.at(-1);

  const emailTextResponse = await fetch(
    `${process.env.EMAIL_HTTP_URL}/messages/${lastEmail.id}.plain`,
  );

  const emailText = await emailTextResponse.text();

  return {
    ...lastEmail,
    text: emailText,
  };
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
};

export default orchestrator;
