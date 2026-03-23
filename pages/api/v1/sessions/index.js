import { createRouter } from "next-connect";
import controller from "@infra/controller.js";
import authentication from "@models/authentication.js";
import authorization from "@models/authorization.js";
import session from "@models/session.js";
import { ForbiddenError } from "@infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("create:session"), postHandler)
  .delete(deleteHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso você acredite que isto seja um erro.",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  controller.setSessionCookie(response, newSession.token);

  const outputValues = authorization.filterOutput(
    authenticatedUser,
    "read:session",
    newSession,
  );

  return response.status(201).json(outputValues);
}

async function deleteHandler(request, response) {
  const requestUser = request.context.user;
  const sessionToken = request.cookies.session_id;

  const savedSession = await session.findOneValidByToken(sessionToken);

  const expiredSession = await session.expireById(savedSession.id);

  controller.clearSessionCookie(response);

  const outputValues = authorization.filterOutput(
    requestUser,
    "read:session",
    expiredSession,
  );

  return response.status(200).json(outputValues);
}
