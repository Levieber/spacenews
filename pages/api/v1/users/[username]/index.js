import { createRouter } from "next-connect";
import { ForbiddenError } from "@infra/errors.js";
import controller from "@infra/controller.js";
import user from "@models/user.js";
import authorization from "@models/authorization.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const requestUser = request.context.user;

  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  const outputValues = authorization.filterOutput(
    requestUser,
    "read:user",
    userFound,
  );

  return response.status(200).json(outputValues);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const requestUser = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(requestUser, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário",
      action:
        "Verifique se você possui a permissão necessária para atualizar outro usuário",
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  const outputValues = authorization.filterOutput(
    requestUser,
    "read:user",
    updatedUser,
  );

  return response.status(200).json(outputValues);
}
