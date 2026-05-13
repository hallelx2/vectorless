#!/usr/bin/env bash
# 04-map-domain.sh
#
# Map api.vectorless.store → vectorless-control-plane on Cloud Run.
# Cloud Run prints DNS records you need to add to your registrar
# (Cloudflare if vectorless.store is on Cloudflare DNS).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${REGION:?}"; : "${API_HOSTNAME:?}"

SERVICE="vectorless-control-plane"

echo "→ Verifying domain ownership (one-time per domain)…"
echo "  If this is your first time mapping a Cloud Run domain to"
echo "  $API_HOSTNAME, the GCP console will walk you through a TXT"
echo "  record proving you own the parent domain. Visit:"
echo "    https://console.cloud.google.com/run/domains"
echo ""

read -r -p "Continue? Domain ownership confirmed [y/N] " ok
[[ "$ok" == "y" ]] || { echo "Aborted."; exit 1; }

echo "→ Creating domain mapping…"
gcloud beta run domain-mappings create \
  --service="$SERVICE" \
  --domain="$API_HOSTNAME" \
  --region="$REGION" \
  --quiet || true

echo ""
echo "→ Required DNS records (add at your registrar / Cloudflare):"
gcloud beta run domain-mappings describe \
  --domain="$API_HOSTNAME" \
  --region="$REGION" \
  --format='value(status.resourceRecords)'

echo ""
echo "  Most setups: a single CNAME"
echo "    api.vectorless.store CNAME ghs.googlehosted.com"
echo ""
echo "  In Cloudflare, set the proxy status to DNS-only (grey cloud)"
echo "  so Cloud Run can serve the cert directly. Cloudflare proxy"
echo "  (orange cloud) breaks Cloud Run's managed TLS."
echo ""

read -r -p "Press Enter once DNS has propagated (try ~5 min)…"

echo "→ Smoke test:"
curl -fsSL "https://$API_HOSTNAME/.well-known/oauth-authorization-server" \
  && echo "" && echo "✓ Domain mapping is live."

echo ""
echo "Next: update Vercel env vars (deploy/README.md phase 6)."
