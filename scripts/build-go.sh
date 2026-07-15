#!/usr/bin/env bash
# Cross-compiles each Go service to dist/<service>/bootstrap for the
# Lambda provided.al2023 ARM64 runtime (ADR-002).
# Prefers Docker (golang:1.22); falls back to native go.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# When invoked on the host, always go through with-go.sh so Docker is preferred.
# Inside the container, GO_IN_DOCKER=1 skips re-entry (native go in the image).
if [[ "${GO_IN_DOCKER:-}" != "1" ]]; then
  exec "$REPO_ROOT/scripts/with-go.sh" env GO_IN_DOCKER=1 ./scripts/build-go.sh
fi

mkdir -p dist

for svc in intake scheduling notification; do
  echo "building $svc..."
  (cd services/go && \
    CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
    go build -ldflags="-s -w" -tags lambda.norpc -o "../../dist/$svc/bootstrap" "./$svc")
done

echo "done: $(ls dist)"
