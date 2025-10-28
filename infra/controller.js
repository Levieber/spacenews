import * as cookie from "cookie";
import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "@infra/errors.js";
import session from "@models/session.js";
import user from "@models/user.js";

function onNoMatchHandler(_request, response) {
  const publicError = new MethodNotAllowedError();

  return response.status(publicError.statusCode).json(publicError);
}

function onErrorHandler(error, _request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);

    return response.status(error.statusCode).json(error);
  }

  const publicError = new InternalServerError({
    cause: error,
  });

  console.error(publicError);

  response.status(publicError.statusCode).json(publicError);
}

function setSessionCookie(response, sessionId) {
  const setCookie = cookie.serialize("session_id", sessionId, {
    path: "/",
    httpOnly: true,
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
  });

  response.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    httpOnly: true,
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectAuthenticatedUser(request);
  } else {
    injectAnonymousUser(request);
  }

  return next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  const savedSession = await session.findOneValidByToken(sessionToken);
  const savedUser = await user.findOneById(savedSession.user_id);

  Object.assign(request, {
    context: {
      ...request.context,
      user: savedUser,
    },
  });
}

function injectAnonymousUser(request) {
  const anonymousUser = {
    features: ["read:activation_token", "create:session", "create:user"],
  };

  Object.assign(request, {
    context: {
      ...request.context,
      user: anonymousUser,
    },
  });
}

function canRequest(feature) {
  return function middleware(request, response, next) {
    const currentUser = request.context.user;

    if (currentUser.features.includes(feature)) {
      return next();
    }

    throw new ForbiddenError({
      message: "Você não possui permissão para executar essa ação",
      action: `Verifique se o seu usuário possui a permissão "${feature}"`,
    });
  };
}

const controller = {
  canRequest,
  clearSessionCookie,
  injectAnonymousOrUser,
  setSessionCookie,
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
