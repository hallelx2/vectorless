export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  status: "active" | "revoked";
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CreateApiKeyRequest {
  name: string;
  expires_at?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string; // Full key, shown only once
  key_prefix: string;
  created_at: string;
}
