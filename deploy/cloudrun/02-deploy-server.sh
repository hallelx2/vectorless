#!/usr/bin/env bash
# 02-deploy-server.sh
#
# Builds the vectorless-server image, pushes to Artifact Registry,
# generates server.config.yaml from .env + the template, uploads it
# as a Cloud Run secret, and deploys the service.
#
# Run this from anywhere — paths are resolved relative to the script.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# deploy/ lives inside vectorless-dashboard; sibling service repos sit
# one directory above. So three "../"s to reach the project root.
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ Missing $ENV_FILE — run 01-bootstrap.sh first (and fill in .env)."
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${PROJECT_ID:?}"; : "${REGION:?}"
: "${NEON_SERVER_URL:?}"; : "${ANTHROPIC_API_KEY:?}"
: "${R2_ENDPOINT:?}"; : "${R2_BUCKET:?}"; : "${R2_ACCESS_KEY:?}"; : "${R2_SECRET_KEY:?}"

# Generate the shared secret if not already in .env.
if [[ -z "${UPSTREAM_AUTH_TOKEN:-}" ]]; then
  echo "→ Generating UPSTREAM_AUTH_TOKEN…"
  UPSTREAM_AUTH_TOKEN=$(openssl rand -base64 48 | tr -d '\n')
  echo "UPSTREAM_AUTH_TOKEN=$UPSTREAM_AUTH_TOKEN" >> "$ENV_FILE"
fi

SERVICE="vectorless-server"
GHCR_IMAGE="${GHCR_SERVER_IMAGE:-ghcr.io/hallelx2/vectorless-server:main}"
AR_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/vectorless/server"
TAG="$(date -u +%Y%m%d-%H%M%S)"

# ── 1. Get the image ──────────────────────────────────────────────
# Two modes:
#   BUILD_LOCALLY=true   build from local source and push to Artifact Registry
#   (default)            pull the public image from ghcr.io and mirror it to AR
#
# We always end up with the image in GCP Artifact Registry because Cloud
# Run pulls from there with no extra auth.
if [[ "${BUILD_LOCALLY:-false}" == "true" ]]; then
  echo "→ BUILD_LOCALLY=true — building from $PROJECT_ROOT/vectorless-server/Dockerfile…"
  docker build \
    -f "$PROJECT_ROOT/vectorless-server/Dockerfile" \
    --build-arg "VERSION=$TAG" \
    -t "$AR_IMAGE:$TAG" \
    -t "$AR_IMAGE:latest" \
    "$PROJECT_ROOT"
  docker push "$AR_IMAGE:$TAG"
  docker push "$AR_IMAGE:latest"
  DEPLOY_IMAGE="$AR_IMAGE:$TAG"
else
  echo "→ Pulling $GHCR_IMAGE and mirroring to Artifact Registry…"
  docker pull "$GHCR_IMAGE"
  docker tag "$GHCR_IMAGE" "$AR_IMAGE:$TAG"
  docker tag "$GHCR_IMAGE" "$AR_IMAGE:latest"
  docker push "$AR_IMAGE:$TAG"
  docker push "$AR_IMAGE:latest"
  DEPLOY_IMAGE="$AR_IMAGE:$TAG"
  echo "   (override with BUILD_LOCALLY=true ./02-deploy-server.sh to build from your local source)"
fi

# ── 2. Generate config file from template ─────────────────────────
echo "→ Generating server.config.yaml from template…"
CONFIG_FILE="$SCRIPT_DIR/.server.config.generated.yaml"

# Export every required var so envsubst can pick them up.
export UPSTREAM_AUTH_TOKEN NEON_SERVER_URL ANTHROPIC_API_KEY
export R2_ENDPOINT R2_BUCKET R2_ACCESS_KEY R2_SECRET_KEY

envsubst < "$SCRIPT_DIR/server.config.yaml.tpl" > "$CONFIG_FILE"

# ── 3. Upload as Cloud Run secret ─────────────────────────────────
echo "→ Uploading config as Secret Manager secret 'server-config'…"
if gcloud secrets describe server-config >/dev/null 2>&1; then
  gcloud secrets versions add server-config --data-file="$CONFIG_FILE" --quiet
else
  gcloud secrets create server-config \
    --replication-policy=automatic \
    --data-file="$CONFIG_FILE" \
    --quiet
fi

# Cloud Run's compute service account needs read access to the secret.
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
gcloud secrets add-iam-policy-binding server-config \
  --member="serviceAccount:$SA" \
  --role=roles/secretmanager.secretAccessor \
  --quiet >/dev/null

# Don't leave the secret on disk.
rm -f "$CONFIG_FILE"

# ── 4. Deploy to Cloud Run ────────────────────────────────────────
echo "→ Deploying $SERVICE…"
gcloud run deploy "$SERVICE" \
  --image="$DEPLOY_IMAGE" \
  --region="$REGION" \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=4 \
  --timeout=120s \
  --concurrency=20 \
  --no-allow-unauthenticated \
  --command="/vectorless-server" \
  --args="--role,server,--config,/etc/vectorless/config.yaml" \
  --set-secrets="/etc/vectorless/config.yaml=server-config:latest" \
  --quiet

# ── 5. Allow public access (the control-plane will fronts auth) ───
# We want internal-only access if possible, but the control-plane
# runs in Cloud Run too. Easiest: allow all traffic, rely on the
# VLS_AUTH_API_KEY bearer check. For tighter security, restrict to
# the control-plane's service account once that's deployed (phase 3).
gcloud run services add-iam-policy-binding "$SERVICE" \
  --region="$REGION" \
  --member=allUsers \
  --role=roles/run.invoker \
  --quiet >/dev/null

SERVER_URL=$(gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)')

echo ""
echo "✓ Server deployed: $SERVER_URL"
echo ""
echo "→ Saving SERVER_URL to .env for phase 3…"
# Update or append SERVER_URL in .env
if grep -q '^SERVER_URL=' "$ENV_FILE"; then
  # macOS sed needs '' after -i; GNU sed doesn't. Use a portable Perl one-liner.
  perl -i -pe "s|^SERVER_URL=.*|SERVER_URL=$SERVER_URL|" "$ENV_FILE"
else
  echo "SERVER_URL=$SERVER_URL" >> "$ENV_FILE"
fi

echo ""
echo "Smoke test:"
echo "  curl $SERVER_URL/healthz"
echo ""
echo "Next: ./03-deploy-control-plane.sh"
