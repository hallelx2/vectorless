import type { Context } from "hono";
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

export function errorHandler(err: Error, c: Context) {
  const requestId =
    c.req.header("x-request-id") || crypto.randomUUID().slice(0, 8);

  if (err instanceof ApiError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          status: err.statusCode,
          request_id: requestId,
          field_errors: err.fieldErrors || null,
        },
      },
      err.statusCode as any
    );
  }

  // Unexpected errors
  console.error("Unexpected error:", err);
  return c.json(
    {
      error: {
        code: "server_error",
        message: "An unexpected error occurred",
        status: 500,
        request_id: requestId,
      },
    },
    500
  );
}
