import type { VectorlessConfig } from "./config.js";
import { withRetry } from "./retry.js";
import {
  VectorlessError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  ConflictError,
  ServerError,
} from "./errors.js";

const VERSION = "0.1.0";

async function parseErrorResponse(
  response: Response
): Promise<VectorlessError> {
  const requestId = response.headers.get("x-request-id") ?? undefined;

  try {
    const body = (await response.json()) as {
      error?: {
        code?: string;
        message?: string;
        field_errors?: Record<string, string[]>;
      };
    };
    const message =
      body.error?.message ?? `Request failed with status ${response.status}`;

    switch (response.status) {
      case 401:
        return new AuthenticationError(message, requestId);
      case 404:
        return new NotFoundError(message, requestId);
      case 429: {
        const retryAfter = response.headers.get("retry-after");
        return new RateLimitError(
          message,
          retryAfter ? parseInt(retryAfter, 10) : undefined,
          requestId
        );
      }
      case 400:
        return new ValidationError(
          message,
          body.error?.field_errors,
          requestId
        );
      case 409:
        return new ConflictError(message, requestId);
      default:
        if (response.status >= 500) {
          return new ServerError(message, requestId);
        }
        return new VectorlessError(
          message,
          response.status,
          body.error?.code ?? "unknown",
          requestId
        );
    }
  } catch {
    return new VectorlessError(
      `Request failed with status ${response.status}`,
      response.status,
      "unknown",
      requestId
    );
  }
}

export class HttpTransport {
  constructor(private config: VectorlessConfig) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(
    path: string,
    body?: unknown,
    opts?: { isMultipart?: boolean }
  ): Promise<T> {
    return this.request<T>("POST", path, body, opts);
  }

  async delete(path: string): Promise<void> {
    await this.request<void>("DELETE", path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts?: { isMultipart?: boolean }
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      "User-Agent": `vectorless-ts/${VERSION}`,
    };

    if (!opts?.isMultipart && body && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const fetchBody =
      body instanceof FormData
        ? body
        : body
          ? JSON.stringify(body)
          : undefined;

    return withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: fetchBody,
          signal: controller.signal,
        });

        if (!response.ok) {
          throw await parseErrorResponse(response);
        }

        if (response.status === 204) return undefined as T;
        return (await response.json()) as T;
      } finally {
        clearTimeout(timeoutId);
      }
    }, this.config);
  }
}
