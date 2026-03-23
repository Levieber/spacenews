import { createRouter } from "next-connect";
import controller from "@infra/controller.js";
import migrator from "@models/migrator.js";
import authorization from "@models/authorization.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:migrations"), getHandler)
  .post(controller.canRequest("apply:migrations"), postHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const requestUser = request.context.user;

  const pendingMigrations = await migrator.listPendingMigrations();

  const outputValues = authorization.filterOutput(
    requestUser,
    "read:migrations",
    pendingMigrations,
  );

  return response.status(200).json(outputValues);
}

async function postHandler(request, response) {
  const requestUser = request.context.user;

  const migratedMigrations = await migrator.runPendingMigrations();

  const outputValues = authorization.filterOutput(
    requestUser,
    "read:migrations",
    migratedMigrations,
  );

  return response
    .status(migratedMigrations.length > 0 ? 201 : 200)
    .json(outputValues);
}
