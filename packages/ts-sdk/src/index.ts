export { VectorlessClient } from "./client.js";
export type {
  VectorlessConfig,
  AddDocumentOptions,
  AddDocumentResponse,
  ToCManifest,
  ToCEntry,
  PageRange,
  Section,
  DocumentSummary,
  DocumentDetail,
  ListDocumentsOptions,
  ListDocumentsResponse,
  WaitForReadyOptions,
} from "./types.js";
export {
  VectorlessError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  ConflictError,
  ServerError,
} from "./errors.js";
