import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import type { ErrorCode } from "@vectorless/shared";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function notFound(message: string): ApiError {
  return new ApiError(404, "not_found", message);
}

export function badRequest(
  message: string,
  fieldErrors?: Record<string, string[]>
): ApiError {
  return new ApiError(400, "validation_error", message, fieldErrors);
}

export function unauthorized(message = "Invalid or missing API key"): ApiError {
  return new ApiError(401, "authentication_error", message);
}

export function conflict(message: string): ApiError {
  return new ApiError(409, "conflict", message);
}

export function payloadTooLarge(message: string): ApiError {
  return new ApiError(413, "payload_too_large", message);
}

export function errorHandler(
  error: FastifyError | ApiError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.id;

  if (error instanceof ApiError) {
    return reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        status: error.statusCode,
        request_id: requestId,
        field_errors: error.fieldErrors,
      },
    });
  }

  // Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: {
        code: "validation_error",
        message: error.message,
        status: 400,
        request_id: requestId,
      },
    });
  }

  // Unexpected errors
  request.log.error(error);
  return reply.status(500).send({
    error: {
      code: "server_error",
      message: "An unexpected error occurred",
      status: 500,
      request_id: requestId,
    },
  });
}
