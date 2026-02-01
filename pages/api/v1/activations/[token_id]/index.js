import { createRouter } from "next-connect";
import controller from "@infra/controller.js";
import activation from "@models/activation.js";
import authorization from "@models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const requestUser = request.context.user;
  const activationTokenId = request.query.token_id;

  const activationToken = await activation.findOneValidById(activationTokenId);

  await activation.activateUserByUserId(activationToken.user_id);

  const usedActivationToken = await activation.markTokenAsUsed(
    activationToken.id,
  );

  const outputValues = authorization.filterOutput(
    requestUser,
    "read:activation_token",
    usedActivationToken,
  );

  return response.status(200).json(outputValues);
}
