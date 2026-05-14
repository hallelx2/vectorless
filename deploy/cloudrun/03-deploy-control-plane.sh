#!/usr/bin/env bash
# 03-deploy-control-plane.sh
#
# Builds the control-plane image, pushes it, generates the config from
# the template (filling in the server URL + freshly-minted OAuth and
# dashboard secrets), uploads as a Cloud Run secret, deploys.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# deploy/ lives inside vectorless-dashboard; sibling service repos sit
# one directory above. So three "../"s to reach the project root.
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${PROJECT_ID:?}"; : "${REGION:?}"
: "${NEON_CP_URL:?}"; : "${SERVER_URL:?Run 02-deploy-server.sh first}"
: "${UPSTREAM_AUTH_TOKEN:?Run 02-deploy-server.sh first}"
: "${DOMAIN:?}"; : "${API_HOSTNAME:?}"

# Mint the OAuth + dashboard secrets if not already set.
if [[ -z "${OAUTH_JWT_SECRET:-}" ]]; then
  OAUTH_JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
  echo "OAUTH_JWT_SECRET=$OAUTH_JWT_SECRET" >> "$ENV_FILE"
fi

if [[ -z "${DASHBOARD_SERVICE_TOKEN:-}" ]]; then
  DASHBOARD_SERVICE_TOKEN=$(openssl rand -base64 48 | tr -d '\n')
  echo "DASHBOARD_SERVICE_TOKEN=$DASHBOARD_SERVICE_TOKEN" >> "$ENV_FILE"
fi

SERVICE="vectorless-control-plane"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/vectorless/control-plane"
TAG="$(date -u +%Y%m%d-%H%M%S)"

# ── 1. Build & push ───────────────────────────────────────────────
echo "→ Building image $IMAGE:$TAG…"
docker build \
  -f "$PROJECT_ROOT/vectorless-control-plane/Dockerfile" \
  --build-arg "VERSION=$TAG" \
  -t "$IMAGE:$TAG" \
  -t "$IMAGE:latest" \
  "$PROJECT_ROOT/vectorless-control-plane"

echo "→ Pushing image…"
docker push "$IMAGE:$TAG"
docker push "$IMAGE:latest"

# ── 2. Generate config ────────────────────────────────────────────
echo "→ Generating control-plane.config.yaml from template…"
CONFIG_FILE="$SCRIPT_DIR/.cp.config.generated.yaml"

export NEON_CP_URL SERVER_URL UPSTREAM_AUTH_TOKEN
export DOMAIN API_HOSTNAME
export OAUTH_JWT_SECRET DASHBOARD_SERVICE_TOKEN

envsubst < "$SCRIPT_DIR/control-plane.config.yaml.tpl" > "$CONFIG_FILE"

# ── 3. Upload secret ──────────────────────────────────────────────
echo "→ Uploading config as Secret Manager secret 'control-plane-config'…"
if gcloud secrets describe control-plane-config >/dev/null 2>&1; then
  gcloud secrets versions add control-plane-config --data-file="$CONFIG_FILE" --quiet
else
  gcloud secrets create control-plane-config \
    --replication-policy=automatic \
    --data-file="$CONFIG_FILE" \
    --quiet
fi

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding control-plane-config \
  --member="serviceAccount:$SA" \
  --role=roles/secretmanager.secretAccessor \
  --quiet >/dev/null

rm -f "$CONFIG_FILE"

# ── 4. Deploy ─────────────────────────────────────────────────────
echo "→ Deploying $SERVICE…"
gcloud run deploy "$SERVICE" \
  --image="$IMAGE:$TAG" \
  --region="$REGION" \
  --port=9090 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=4 \
  --timeout=120s \
  --concurrency=80 \
  --allow-unauthenticated \
  --command="controlplane" \
  --args="--config,//etc/vectorless/config.yaml" \
  --set-secrets="//etc/vectorless/config.yaml=control-plane-config:latest" \
  --quiet
  # MSYS path-conversion fix: double-leading-slash escape — Git Bash on
  # Windows would otherwise rewrite /etc/vectorless/... into a Windows
  # path before gcloud serialises the args.

CP_URL=$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)')

echo ""
echo "✓ Control-plane deployed: $CP_URL"
echo ""

# Save for downstream scripts (env update / dashboard wiring).
if grep -q '^CP_URL=' "$ENV_FILE"; then
  perl -i -pe "s|^CP_URL=.*|CP_URL=$CP_URL|" "$ENV_FILE"
else
  echo "CP_URL=$CP_URL" >> "$ENV_FILE"
fi

echo "Smoke tests:"
echo "  curl $CP_URL/.well-known/oauth-authorization-server"
echo "  curl -X POST $CP_URL/oauth/register \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"client_name\":\"smoke\",\"redirect_uris\":[\"http://127.0.0.1:9999/cb\"]}'"
echo ""
echo "Save the DASHBOARD_SERVICE_TOKEN value from .env — you'll paste"
echo "it into Vercel in phase 6."
echo ""
echo "Next: ./04-map-domain.sh"
