import { createRouter } from "next-connect";
import database from "@infra/database.js";
import controller from "@infra/controller.js";
import authorization from "@models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const requestUser = request.context.user;

  const updatedAt = new Date().toISOString();
  const databaseVersion = await database.query("SHOW server_version;");
  const maxConnections = await database.query("SHOW max_connections;");
  const databaseName = process.env.POSTGRES_DB;
  const openedConnections = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1",
    values: [databaseName],
  });

  const systemStatus = {
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
  };

  const outputValues = authorization.filterOutput(
    requestUser,
    "read:status",
    systemStatus,
  );

  return response.status(200).json(outputValues);
}
