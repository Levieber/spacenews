import { createRouter } from "next-connect";
import controller from "@infra/controller.js";
import user from "@models/user.js";
import session from "@models/session.js";
import authorization from "@models/authorization.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const requestUser = request.context.user;
  const sessionToken = request.cookies.session_id;

  const savedSession = await session.findOneValidByToken(sessionToken);

  const renewedSession = await session.renew(savedSession.id);

  controller.setSessionCookie(response, renewedSession.token);

  const userFound = await user.findOneById(savedSession.user_id);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  const outputValues = authorization.filterOutput(
    requestUser,
    "read:user:self",
    userFound,
  );

  return response.status(200).json(outputValues);
}
