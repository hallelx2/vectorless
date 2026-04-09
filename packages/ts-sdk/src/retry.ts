import type { VectorlessConfig } from "./config.js";
import { VectorlessError, RateLimitError } from "./errors.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(): number {
  return Math.random() * 200;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Pick<VectorlessConfig, "maxRetries" | "retryDelay">
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error instanceof VectorlessError) {
        // Rate limit: respect Retry-After header
        if (error.status === 429) {
          const delay =
            error instanceof RateLimitError && error.retryAfter != null
              ? error.retryAfter * 1000
              : config.retryDelay * Math.pow(2, attempt);
          if (attempt < config.maxRetries) {
            await sleep(delay + jitter());
            continue;
          }
        }

        // Don't retry 4xx errors (except 408 timeout and 429 rate limit)
        if (
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 408 &&
          error.status !== 429
        ) {
          throw error;
        }
      }

      // Retry 5xx, network errors, timeouts
      if (attempt < config.maxRetries) {
        await sleep(config.retryDelay * Math.pow(2, attempt) + jitter());
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
}
