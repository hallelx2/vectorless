import { z } from "zod";

export const errorCodeSchema = z.enum([
  "validation_error",
  "authentication_error",
  "not_found",
  "conflict",
  "payload_too_large",
  "rate_limit_exceeded",
  "server_error",
]);

export const errorResponseSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    status: z.number().int(),
    request_id: z.string().optional(),
    field_errors: z.record(z.array(z.string())).optional(),
  }),
});
