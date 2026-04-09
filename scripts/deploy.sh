#!/bin/bash
# ============================================================
# Vectorless — Full Deployment Automation
# ============================================================
# Usage: bash scripts/deploy.sh [step]
#
# Steps:
#   all        — Run everything (first-time setup)
#   git        — Push code to GitHub
#   secrets    — Set GitHub repo secrets
#   railway    — Deploy API to Railway
#   sdk-ts     — Publish TypeScript SDK to npm
#   sdk-py     — Publish Python SDK to PyPI
#   verify     — Run post-deploy verification
# ============================================================

set -e

REPO="hallelx2/vectorless"
DOMAIN="vectorless.store"
API_DOMAIN="api.vectorless.store"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ─── Step 1: Git Setup & Push ────────────────────────────
step_git() {
  info "Setting up Git remote and pushing code..."

  # Add remote if not exists
  if ! git remote | grep -q origin; then
    git remote add origin "https://github.com/${REPO}.git"
    ok "Remote added: origin -> ${REPO}"
  else
    ok "Remote already set"
  fi

  # Add all files and commit
  git add -A
  if git diff --staged --quiet; then
    info "No changes to commit"
  else
    git commit -m "feat: Full Vectorless platform — API server, TypeScript SDK, Python SDK, dashboard

- Fastify API with Neon Postgres, Cloudflare R2, QStash
- Document ingestion pipeline (PDF, DOCX, TXT, URL)
- 3 ToC strategies: extract, hybrid, generate
- LLM abstraction (Gemini Vertex AI + Anthropic Claude)
- BYOK (Bring Your Own Key) with AES-256-GCM encryption
- TypeScript SDK (zero deps, CJS + ESM)
- Python SDK (httpx + pydantic, sync + async)
- Next.js dashboard with Better Auth
- OpenAPI 3.1 spec
- CI/CD with GitHub Actions

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
    ok "Changes committed"
  fi

  # Push
  git push -u origin main 2>/dev/null || git push -u origin master
  ok "Code pushed to GitHub"
}

# ─── Step 2: GitHub Secrets ──────────────────────────────
step_secrets() {
  info "Setting GitHub repository secrets..."

  # Read from .env files
  API_ENV="apps/api/.env"

  if [ ! -f "$API_ENV" ]; then
    err "apps/api/.env not found. Create it first."
    exit 1
  fi

  # Source the env file (handle quoted values)
  set -a
  source <(grep -v '^#' "$API_ENV" | grep '=' | sed 's/^/export /')
  set +a

  # Set secrets (only non-empty values)
  declare -A secrets=(
    ["DATABASE_URL"]="$DATABASE_URL"
    ["R2_ACCOUNT_ID"]="$R2_ACCOUNT_ID"
    ["R2_ACCESS_KEY_ID"]="$R2_ACCESS_KEY_ID"
    ["R2_SECRET_ACCESS_KEY"]="$R2_SECRET_ACCESS_KEY"
    ["R2_BUCKET_NAME"]="$R2_BUCKET_NAME"
    ["QSTASH_URL"]="$QSTASH_URL"
    ["QSTASH_TOKEN"]="$QSTASH_TOKEN"
    ["QSTASH_CURRENT_SIGNING_KEY"]="$QSTASH_CURRENT_SIGNING_KEY"
    ["QSTASH_NEXT_SIGNING_KEY"]="$QSTASH_NEXT_SIGNING_KEY"
    ["GOOGLE_CLOUD_PROJECT"]="$GOOGLE_CLOUD_PROJECT"
    ["BETTER_AUTH_SECRET"]="$BETTER_AUTH_SECRET"
  )

  for key in "${!secrets[@]}"; do
    if [ -n "${secrets[$key]}" ]; then
      echo "${secrets[$key]}" | gh secret set "$key" --repo "$REPO"
      ok "Secret set: $key"
    else
      warn "Skipped empty: $key"
    fi
  done

  # Vertex credentials as base64
  if [ -f "apps/api/vertex-credentials.json" ]; then
    base64 -w0 apps/api/vertex-credentials.json | gh secret set "GOOGLE_CREDENTIALS_BASE64" --repo "$REPO"
    ok "Secret set: GOOGLE_CREDENTIALS_BASE64"
  fi

  info "To add SDK publishing tokens, run:"
  echo "  gh secret set NPM_TOKEN --repo $REPO"
  echo "  gh secret set PYPI_TOKEN --repo $REPO"
}

# ─── Step 3: Railway Deploy ─────────────────────────────
step_railway() {
  info "Deploying API to Railway..."

  # Check if logged in
  if ! railway whoami 2>/dev/null; then
    info "Please login to Railway:"
    railway login
  fi

  # Link to project (or create)
  if ! railway status 2>/dev/null | grep -q "Project"; then
    info "Creating Railway project..."
    railway init --name vectorless-api
  fi

  # Set environment variables from .env
  info "Setting Railway environment variables..."
  API_ENV="apps/api/.env"

  while IFS= read -r line; do
    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue

    # Extract key=value
    key=$(echo "$line" | cut -d'=' -f1)
    value=$(echo "$line" | cut -d'=' -f2-)
    # Remove surrounding quotes
    value=$(echo "$value" | sed 's/^"//;s/"$//')

    if [ -n "$key" ] && [ -n "$value" ]; then
      railway variables set "$key=$value" 2>/dev/null
      ok "Railway var: $key"
    fi
  done < <(grep -v '^#' "$API_ENV" | grep '=')

  # Deploy
  info "Deploying to Railway..."
  railway up --detach

  ok "Railway deployment started!"
  info "Get your Railway URL from: railway open"
  info "Then update API_BASE_URL to: https://api.vectorless.store"
}

# ─── Step 4: Publish TypeScript SDK ──────────────────────
step_sdk_ts() {
  info "Publishing TypeScript SDK to npm..."

  cd packages/ts-sdk

  # Build
  pnpm build
  ok "TypeScript SDK built"

  # Run tests
  pnpm test
  ok "Tests passed"

  # Check if logged in to npm
  if ! npm whoami 2>/dev/null; then
    info "Please login to npm:"
    npm login
  fi

  # Publish
  npm publish --access public
  ok "Published to npm: vectorless@$(node -pe 'require("./package.json").version')"

  cd ../..
}

# ─── Step 5: Publish Python SDK ──────────────────────────
step_sdk_py() {
  info "Publishing Python SDK to PyPI..."

  cd sdks/python

  # Build
  uv build
  ok "Python SDK built"

  # Run tests
  uv run pytest tests/test_client.py -v
  ok "Tests passed"

  # Publish
  if [ -z "$PYPI_TOKEN" ]; then
    warn "PYPI_TOKEN not set. Please provide your PyPI token:"
    read -s -p "Token: " PYPI_TOKEN
    echo ""
  fi

  uv publish --token "$PYPI_TOKEN"
  ok "Published to PyPI: vectorless@$(python -c 'import tomllib; print(tomllib.load(open("pyproject.toml","rb"))["project"]["version"])')"

  cd ../..
}

# ─── Step 6: Post-Deploy Verification ────────────────────
step_verify() {
  info "Running post-deployment verification..."

  API_URL="https://${API_DOMAIN}"

  echo ""
  info "1. Health check..."
  HEALTH=$(curl -sS "${API_URL}/health" 2>&1)
  if echo "$HEALTH" | grep -q '"ok"'; then
    ok "API is healthy: $HEALTH"
  else
    err "Health check failed: $HEALTH"
  fi

  echo ""
  info "2. Auth check (should reject)..."
  AUTH=$(curl -sS "${API_URL}/v1/documents" 2>&1)
  if echo "$AUTH" | grep -q 'authentication_error'; then
    ok "Auth correctly rejects unauthenticated requests"
  else
    err "Auth check unexpected: $AUTH"
  fi

  echo ""
  info "3. npm package check..."
  NPM_INFO=$(npm view vectorless version 2>&1)
  if [ $? -eq 0 ]; then
    ok "npm package found: vectorless@${NPM_INFO}"
  else
    warn "npm package not yet published"
  fi

  echo ""
  info "4. PyPI package check..."
  PYPI_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" "https://pypi.org/pypi/vectorless/json")
  if [ "$PYPI_STATUS" = "200" ]; then
    ok "PyPI package found: vectorless"
  else
    warn "PyPI package issue (status: $PYPI_STATUS)"
  fi

  echo ""
  info "5. Dashboard check..."
  DASH_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" "https://${DOMAIN}" 2>&1)
  if [ "$DASH_STATUS" = "200" ]; then
    ok "Dashboard is live: https://${DOMAIN}"
  else
    warn "Dashboard returned status: $DASH_STATUS"
  fi

  echo ""
  ok "Verification complete!"
}

# ─── Main ────────────────────────────────────────────────
STEP="${1:-all}"

echo ""
echo "================================================"
echo "  Vectorless Deployment"
echo "  Domain: ${DOMAIN}"
echo "================================================"
echo ""

case "$STEP" in
  git)     step_git ;;
  secrets) step_secrets ;;
  railway) step_railway ;;
  sdk-ts)  step_sdk_ts ;;
  sdk-py)  step_sdk_py ;;
  verify)  step_verify ;;
  all)
    step_git
    echo ""
    step_secrets
    echo ""
    info "Next steps (manual):"
    echo "  1. Run: railway login && bash scripts/deploy.sh railway"
    echo "  2. Set up Cloudflare Pages at https://dash.cloudflare.com"
    echo "  3. Update Spaceship nameservers to Cloudflare's"
    echo "  4. Run: bash scripts/deploy.sh sdk-ts"
    echo "  5. Run: bash scripts/deploy.sh sdk-py"
    echo "  6. Run: bash scripts/deploy.sh verify"
    ;;
  *)
    err "Unknown step: $STEP"
    echo "Usage: bash scripts/deploy.sh [all|git|secrets|railway|sdk-ts|sdk-py|verify]"
    exit 1
    ;;
esac
