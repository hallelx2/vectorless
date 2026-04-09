export class VectorlessError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = "VectorlessError";
  }
}

export class AuthenticationError extends VectorlessError {
  constructor(message: string, requestId?: string) {
    super(message, 401, "authentication_error", requestId);
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends VectorlessError {
  constructor(message: string, requestId?: string) {
    super(message, 404, "not_found", requestId);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends VectorlessError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, requestId?: string) {
    super(message, 429, "rate_limit_exceeded", requestId);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends VectorlessError {
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    fieldErrors?: Record<string, string[]>,
    requestId?: string
  ) {
    super(message, 400, "validation_error", requestId);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class ConflictError extends VectorlessError {
  constructor(message: string, requestId?: string) {
    super(message, 409, "conflict", requestId);
    this.name = "ConflictError";
  }
}

export class ServerError extends VectorlessError {
  constructor(message: string, requestId?: string) {
    super(message, 500, "server_error", requestId);
    this.name = "ServerError";
  }
}
