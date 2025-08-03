import path from "node:path";
import database from "infra/database";
import { runner as migrationRunner } from "node-pg-migrate";
import { ServiceError } from "infra/errors";

const defaultMigrationOptions = {
  dir: path.resolve("infra", "migrations"),
  direction: "up",
  dryRun: true,
  log: () => {},
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });

    return pendingMigrations;
  } catch (error) {
    const serviceError = new ServiceError({
      message: "Erro na listagem das migrations pendentes",
      cause: error,
    });
    throw serviceError;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });

    return migratedMigrations;
  } catch (error) {
    const serviceError = new ServiceError({
      message: "Erro na execução das migrations pendentes",
      cause: error,
    });
    throw serviceError;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
