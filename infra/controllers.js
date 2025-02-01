import { InternalServerError, MethodNotAllowedError } from "infra/errors";

function onNoMatchHandler(request, response) {
  const publicError = new MethodNotAllowedError();

  return response.status(publicError.statusCode).json(publicError);
}

function onErrorHandler(error, request, response) {
  const publicError = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });

  console.error(publicError);

  response.status(publicError.statusCode).json(publicError);
}

const controllers = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controllers;
