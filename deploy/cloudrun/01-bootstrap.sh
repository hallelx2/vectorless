#!/usr/bin/env bash
# 01-bootstrap.sh
#
# One-time GCP setup: project config, enable APIs, create Artifact
# Registry repo, configure docker auth. Idempotent — re-running is safe.
#
# Reads deploy/cloudrun/.env (you create this — see deploy/README.md
# phase 1 for the required keys).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ Missing $ENV_FILE — copy .env.example to .env and fill it in."
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${PROJECT_ID:?PROJECT_ID not set in .env}"
: "${REGION:?REGION not set in .env (e.g. us-central1)}"

REPO="vectorless"

echo "→ Setting active project to $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

echo "→ Setting default region to $REGION"
gcloud config set run/region "$REGION"
gcloud config set artifacts/location "$REGION"

echo "→ Enabling required APIs (this is slow on first run)…"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  --quiet

echo "→ Creating Artifact Registry repo '$REPO' (skipped if exists)…"
if ! gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Vectorless Go service images" \
    --quiet
else
  echo "  (already exists)"
fi

echo "→ Configuring docker authentication for $REGION-docker.pkg.dev"
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

echo ""
echo "✓ Bootstrap complete."
echo "  Project:   $PROJECT_ID"
echo "  Region:    $REGION"
echo "  Registry:  $REGION-docker.pkg.dev/$PROJECT_ID/$REPO"
echo ""
echo "Next: ./02-deploy-server.sh"
