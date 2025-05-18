import retry from "async-retry";
import { Faker, pt_BR } from "@faker-js/faker";
import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";

async function waitForAllServices() {
  await waitForWebServer();

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

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
};

export default orchestrator;
