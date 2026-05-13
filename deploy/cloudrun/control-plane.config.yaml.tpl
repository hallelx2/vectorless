# Control-plane config template. ${VARS} are substituted by
# 03-deploy-control-plane.sh and uploaded as a Cloud Run secret.

server:
  addr: ":9090"
  read_timeout: 30s
  write_timeout: 120s
  drain_timeout: 15s

database:
  url: "${NEON_CP_URL}"
  max_conns: 10

session:
  cookie_name: "vls_session"
  cookie_domain: ".${DOMAIN}"
  duration: 720h
  secure: true

cors:
  enabled: true
  allowed_origins:
    - "https://${DOMAIN}"
    - "https://www.${DOMAIN}"
    - "https://mcp.${DOMAIN}"
  max_age: 86400

upstream:
  url: "${SERVER_URL}"
  auth_token: "${UPSTREAM_AUTH_TOKEN}"
  timeout: 120s

# Polar / Plunk / SES are optional — leave blank until you wire them up.
polar:
  access_token: ""
plunk:
  base_url: ""
ses:
  region: "us-east-1"
  from_address: "noreply@${DOMAIN}"
  from_name: "Vectorless"

app_url: "https://${DOMAIN}"

oauth:
  jwt_secret: "${OAUTH_JWT_SECRET}"
  issuer: "https://${API_HOSTNAME}"
  access_token_ttl: 900
  refresh_token_ttl: 2592000
  mcp_resource_url: "https://mcp.${DOMAIN}/api/mcp"

dashboard:
  url: "https://${DOMAIN}"
  service_token: "${DASHBOARD_SERVICE_TOKEN}"

metrics:
  enabled: true

log:
  level: "info"
  format: "json"
