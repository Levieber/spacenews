import { createRouter } from "next-connect";
import controller from "@infra/controller.js";
import migrator from "@models/migrator.js";
import authorization from "@models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:migrations"), getHandler);
router.post(controller.canRequest("apply:migrations"), postHandler);

export default router.handler(controller.errorHandlers);

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
