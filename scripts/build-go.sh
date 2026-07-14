#!/usr/bin/env bash
# Cross-compiles each Go service to dist/<service>/bootstrap for the
# Lambda provided.al2023 ARM64 runtime (ADR-002).
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p dist

for svc in intake scheduling notification; do
  echo "building $svc..."
  (cd services/go && \
    CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
    go build -ldflags="-s -w" -tags lambda.norpc -o "../../dist/$svc/bootstrap" "./$svc")
done

echo "done: $(ls dist)"
