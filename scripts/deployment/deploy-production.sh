#!/usr/bin/env bash
set -Eeuo pipefail

NAMESPACE="stockify-production"
BACKEND_DEPLOYMENT="stockify-production-backend"
FRONTEND_DEPLOYMENT="stockify-production-frontend"
BACKEND_CONTAINER="backend"
FRONTEND_CONTAINER="frontend"
REGISTRY="ghcr.io/jayyidjidan"

BACKUP_DIR="/home/devops/backups/stockify"
PRODUCTION_URL="https://stockify.web.id"

k() {
    /usr/local/bin/k3s kubectl "$@"
}

if [[ $# -ne 1 || ! "$1" =~ ^[a-fA-F0-9]{40}$ ]]; then
    echo "Usage: deploy.sh <40-character-commit-sha>"
    exit 1
fi

SHA="${1,,}"
BACKEND_IMAGE="${REGISTRY}/stockify-backend:${SHA}"
FRONTEND_IMAGE="${REGISTRY}/stockify-frontend:${SHA}"

mkdir -p "$BACKUP_DIR"

get_image() {
    k -n "$NAMESPACE" get deployment "$1" \
      -o "jsonpath={.spec.template.spec.containers[?(@.name==\"$2\")].image}"
}

echo "==> Reading current Production images"

OLD_BACKEND="$(get_image "$BACKEND_DEPLOYMENT" "$BACKEND_CONTAINER")"
OLD_FRONTEND="$(get_image "$FRONTEND_DEPLOYMENT" "$FRONTEND_CONTAINER")"

if [[ -z "$OLD_BACKEND" || -z "$OLD_FRONTEND" ]]; then
    echo "ERROR: Could not read existing Production images."
    exit 1
fi

rollback() {
    echo
    echo "==> Deployment failed. Rolling back application images."

    trap - ERR
    set +e

    k -n "$NAMESPACE" set image \
      "deployment/$BACKEND_DEPLOYMENT" \
      "$BACKEND_CONTAINER=$OLD_BACKEND"

    k -n "$NAMESPACE" set image \
      "deployment/$FRONTEND_DEPLOYMENT" \
      "$FRONTEND_CONTAINER=$OLD_FRONTEND"

    k -n "$NAMESPACE" rollout status \
      "deployment/$BACKEND_DEPLOYMENT" --timeout=180s

    k -n "$NAMESPACE" rollout status \
      "deployment/$FRONTEND_DEPLOYMENT" --timeout=180s

    curl -fsS --max-time 15 \
      "$PRODUCTION_URL/api/v1/health" >/dev/null

    if [[ $? -eq 0 ]]; then
        echo "ROLLBACK SUCCESSFUL"
    else
        echo "CRITICAL: Rollback health check failed."
    fi

    exit 1
}

trap rollback ERR

echo "==> Checking PostgreSQL Pod"

PG_POD="$(k -n "$NAMESPACE" get pods \
  -l app.kubernetes.io/name=stockify-postgres \
  -o jsonpath='{.items[0].metadata.name}')"

if [[ -z "$PG_POD" ]]; then
    echo "ERROR: Production PostgreSQL Pod not found."
    exit 1
fi

k -n "$NAMESPACE" wait \
  --for=condition=Ready "pod/$PG_POD" --timeout=120s

echo "==> Creating Production PostgreSQL backup"

BACKUP_TIME="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="${BACKUP_DIR}/stockify-k3s-production-${SHA}-${BACKUP_TIME}.dump"

k -n "$NAMESPACE" exec "$PG_POD" -- sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$BACKUP_FILE"

chmod 600 "$BACKUP_FILE"

if [[ ! -s "$BACKUP_FILE" ]]; then
    echo "ERROR: PostgreSQL backup is empty."
    exit 1
fi

echo "==> Verifying PostgreSQL backup"

if ! command -v pg_restore >/dev/null 2>&1; then
    echo "ERROR: pg_restore is not installed on the VPS."
    exit 1
fi

pg_restore --list "$BACKUP_FILE" >/dev/null

echo "==> Updating Production Backend image"

k -n "$NAMESPACE" set image \
  "deployment/$BACKEND_DEPLOYMENT" \
  "$BACKEND_CONTAINER=$BACKEND_IMAGE"

echo "==> Updating Production Frontend image"

k -n "$NAMESPACE" set image \
  "deployment/$FRONTEND_DEPLOYMENT" \
  "$FRONTEND_CONTAINER=$FRONTEND_IMAGE"

echo "==> Waiting for Backend rollout"

k -n "$NAMESPACE" rollout status \
  "deployment/$BACKEND_DEPLOYMENT" --timeout=240s

echo "==> Waiting for Frontend rollout"

k -n "$NAMESPACE" rollout status \
  "deployment/$FRONTEND_DEPLOYMENT" --timeout=240s

echo "==> Checking Production API health"

HEALTHY=false

for attempt in $(seq 1 12); do
    if curl -fsS --max-time 15 \
      "$PRODUCTION_URL/api/v1/health" >/dev/null; then
        HEALTHY=true
        break
    fi

    echo "Health check ${attempt}/12 failed; retrying..."
    sleep 5
done

if [[ "$HEALTHY" != "true" ]]; then
    echo "ERROR: Production API health check failed."
    exit 1
fi

echo "==> Checking Production Frontend"

curl -fsSI --max-time 15 "$PRODUCTION_URL/" >/dev/null

trap - ERR

echo
echo "======================================"
echo "PRODUCTION K3S DEPLOYMENT SUCCESSFUL"
echo "Commit: ${SHA}"
echo "Backend: ${BACKEND_IMAGE}"
echo "Frontend: ${FRONTEND_IMAGE}"
echo "Database backup: ${BACKUP_FILE}"
echo "======================================"
