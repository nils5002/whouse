#!/usr/bin/env sh
set -eu

BRANCH="${1:-main}"
APP_DIR="${APP_DIR:-$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)}"
RUNTIME_DIR="${RUNTIME_DIR:-/opt/web/cloud_web_runtime}"
ENV_FILE="${ENV_FILE:-$RUNTIME_DIR/.env}"
PROD_COMPOSE_FILE="${PROD_COMPOSE_FILE:-$RUNTIME_DIR/docker-compose.prod.yml}"
PROJECT_NAME="${PROJECT_NAME:-cloud_web}"
DEPLOY_TARGET_DIR="${DEPLOY_TARGET_DIR:-/opt/stacks/cloud_web}"

log() {
  printf '%s\n' "$*"
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || die "git nicht gefunden"
command -v docker >/dev/null 2>&1 || die "docker nicht gefunden"
command -v rsync >/dev/null 2>&1 || die "rsync nicht gefunden"

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  die "weder 'docker compose' noch 'docker-compose' verfuegbar"
fi

[ -d "$APP_DIR/.git" ] || die "APP_DIR ist kein Git-Repository: $APP_DIR"
[ -f "$ENV_FILE" ] || die "Runtime .env fehlt: $ENV_FILE"
[ -f "$PROD_COMPOSE_FILE" ] || die "Runtime compose override fehlt: $PROD_COMPOSE_FILE"
mkdir -p "$DEPLOY_TARGET_DIR"

cd "$APP_DIR"

if [ -n "$(git status --porcelain)" ]; then
  STASH_TAG="deploy-autostash-$(date +%Y%m%d_%H%M%S)"
  git stash push --include-untracked -m "$STASH_TAG" >/dev/null || true
  log "Hinweis: lokaler Git-Stand war dirty und wurde gestasht: $STASH_TAG"
fi

log "Aktualisiere Git-Stand fuer Branch: $BRANCH"
git fetch --prune origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

log "Synchronisiere Code nach $DEPLOY_TARGET_DIR (ohne Runtime-Dateien)"
rsync -a \
  --exclude '.git/' \
  --exclude '.venv/' \
  --exclude 'backend/.venv/' \
  --exclude 'frontend/node_modules/' \
  --exclude 'frontend/dist/' \
  --exclude '__pycache__/' \
  --exclude '*.pyc' \
  --exclude '*.log' \
  --exclude '*.db' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'docker-compose.override.yml' \
  --exclude 'docker-compose.prod.yml' \
  --exclude 'docker-compose.production.yml' \
  --exclude 'deploy/runtime/' \
  --exclude 'deploy/server-local/' \
  --exclude 'cloudflared/' \
  "$APP_DIR"/ "$DEPLOY_TARGET_DIR"/

log "Starte kontrolliertes Compose-Deploy (runtime-only)"
$COMPOSE_CMD \
  --project-name "$PROJECT_NAME" \
  --env-file "$ENV_FILE" \
  -f "$PROD_COMPOSE_FILE" \
  up -d --build --remove-orphans

log "Container-Status:"
$COMPOSE_CMD \
  --project-name "$PROJECT_NAME" \
  --env-file "$ENV_FILE" \
  -f "$PROD_COMPOSE_FILE" \
  ps

log "Deploy abgeschlossen."
