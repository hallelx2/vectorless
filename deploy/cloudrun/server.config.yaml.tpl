# Server config template — placeholders ${VAR} get substituted by
# 02-deploy-server.sh and uploaded as a Cloud Run secret.

server:
  addr: ":8080"
  read_timeout: 30s
  # write_timeout has to cover the longest synchronous request, which
  # for us is the QStash ingest webhook. We bumped Cloud Run to 600s
  # so this matches.
  write_timeout: 600s
  drain_timeout: 15s

auth:
  mode: "api_key"
  api_key: "${UPSTREAM_AUTH_TOKEN}"

metrics:
  enabled: true

tracing:
  enabled: false

rate_limit:
  enabled: false

engine:
  database:
    url: "${NEON_SERVER_URL}"
    max_conns: 10

  storage:
    driver: "gcs"
    gcs:
      bucket: "${GCS_BUCKET}"

  # QStash drives ingest jobs as HTTP push: every job is a POST to
  # ${webhook_base_url}/internal/jobs/{kind} signed by Upstash. This
  # lets Cloud Run scale to zero — instances spin up on the inbound
  # webhook the same way they do for any user-facing request.
  queue:
    driver: "qstash"
    qstash:
      token: "${QSTASH_TOKEN}"
      webhook_base_url: "${SERVER_URL}"
      current_signing_key: "${QSTASH_CURRENT_SIGNING_KEY}"
      next_signing_key: "${QSTASH_NEXT_SIGNING_KEY}"

  llm:
    driver: "gemini"
    gemini:
      api_key: "${GEMINI_API_KEY}"
      model: "gemini-2.5-flash"

  retrieval:
    strategy: "chunked-tree"
    chunked_tree:
      max_tokens_per_call: 60000
      max_parallel_calls: 8
      include_sibling_breadcrumbs: true

  log:
    level: "info"
    format: "json"
