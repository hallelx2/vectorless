export interface VectorlessConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

const DEFAULTS: Omit<VectorlessConfig, "apiKey"> = {
  baseUrl: "https://api.vectorless.store",
  timeout: 30_000,
  maxRetries: 3,
  retryDelay: 500,
};

export function resolveConfig(
  partial?: Partial<VectorlessConfig>
): VectorlessConfig {
  const apiKey =
    partial?.apiKey ??
    (typeof process !== "undefined"
      ? process.env?.VECTORLESS_API_KEY
      : undefined);

  if (!apiKey) {
    throw new Error(
      "Vectorless API key is required. Pass it as `apiKey` in the constructor " +
        "or set the VECTORLESS_API_KEY environment variable."
    );
  }

  return { ...DEFAULTS, ...partial, apiKey };
}
