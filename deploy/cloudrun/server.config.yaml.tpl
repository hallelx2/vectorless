# Server config template — placeholders ${VAR} get substituted by
# 02-deploy-server.sh and uploaded as a Cloud Run secret.

server:
  addr: ":8080"
  read_timeout: 30s
  write_timeout: 120s
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
    driver: "s3"
    s3:
      endpoint: "${R2_ENDPOINT}"
      region: "auto"
      bucket: "${R2_BUCKET}"
      access_key: "${R2_ACCESS_KEY}"
      secret_key: "${R2_SECRET_KEY}"
      use_path_style: false

  queue:
    driver: "river"
    river:
      num_workers: 4

  llm:
    driver: "anthropic"
    anthropic:
      api_key: "${ANTHROPIC_API_KEY}"
      model: "claude-sonnet-4-20250514"

  retrieval:
    strategy: "chunked-tree"
    chunked_tree:
      max_tokens_per_call: 60000
      max_parallel_calls: 8
      include_sibling_breadcrumbs: true

  log:
    level: "info"
    format: "json"
