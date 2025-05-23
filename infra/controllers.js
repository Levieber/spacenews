import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
} from "infra/errors.js";

function onNoMatchHandler(_request, response) {
  const publicError = new MethodNotAllowedError();

  return response.status(publicError.statusCode).json(publicError);
}

function onErrorHandler(error, _request, response) {
  if (error instanceof ValidationError || error instanceof NotFoundError) {
    return response.status(error.statusCode).json(error);
  }

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
