import database from "infra/database";
import { InternalServerError } from "infra/errors";

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();
    const databaseVersion = await database.query("SHOW server_version;");
    const maxConnections = await database.query("SHOW max_connections;");
    const databaseName = process.env.POSTGRES_DB;
    const openedConnections = await database.query({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1",
      values: [databaseName],
    });

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: databaseVersion.rows[0].server_version,
          max_connections: Number.parseInt(
            maxConnections.rows[0].max_connections,
          ),
          opened_connections: openedConnections.rows[0].count,
        },
      },
    });
  } catch (error) {
    const publicError = new InternalServerError({ cause: error });

    console.log("\nErro dentro do catch do controller /api/v1/status");
    console.error(publicError);

    response.status(publicError.statusCode).json(publicError);
  }
}

export default status;
