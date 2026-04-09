import { Client } from "@upstash/qstash";
import { config } from "../config.js";

const qstash = new Client({
  token: config.QSTASH_TOKEN,
  baseUrl: config.QSTASH_URL,
});

export interface IngestJobPayload {
  doc_id: string;
  project_id: string;
  storage_path: string;
  source_type: string;
  toc_strategy: string;
  embed_sections: boolean;
}

export async function enqueueIngest(payload: IngestJobPayload): Promise<void> {
  await qstash.publishJSON({
    url: `${config.API_BASE_URL}/v1/webhooks/ingest`,
    body: payload,
    retries: 3,
    contentBasedDeduplication: true,
  });
}
