import path from "node:path";
import migrationRunner from "node-pg-migrate";
import database from "infra/database";

async function migrations(request, response) {
  const dbClient = await database.getNewClient();

  const defaultMigrationOptions = {
    dbClient,
    dir: path.join("infra", "migrations"),
    direction: "up",
    dryRun: true,
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationOptions);

    await dbClient.end();

    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    await dbClient.end();

    return response
      .status(migratedMigrations.length > 0 ? 201 : 200)
      .json(migratedMigrations);
  }

  return response.status(405).end();
}

export default migrations;
