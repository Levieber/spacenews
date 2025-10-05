import { createRouter } from "next-connect";
import controller from "@infra/controller.js";
import migrator from "@models/migrator.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(_request, response) {
  const pendingMigrations = await migrator.listPendingMigrations();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(_request, response) {
  const migratedMigrations = await migrator.runPendingMigrations();
  return response
    .status(migratedMigrations.length > 0 ? 201 : 200)
    .json(migratedMigrations);
}
