export type ErrorCode =
  | "validation_error"
  | "authentication_error"
  | "not_found"
  | "conflict"
  | "payload_too_large"
  | "rate_limit_exceeded"
  | "server_error";

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    status: number;
    request_id?: string;
    field_errors?: Record<string, string[]>;
  };
}
