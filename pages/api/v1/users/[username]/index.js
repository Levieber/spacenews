import { createRouter } from "next-connect";
import controllers from "infra/controllers.js";
import user from "models/user.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controllers.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);
  return response.status(200).json(userFound);
}
