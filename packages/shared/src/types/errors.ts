export type ErrorCode =
  | "validation_error"
  | "authentication_error"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "payload_too_large"
  | "rate_limit_exceeded"
  | "quota_exceeded"
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
