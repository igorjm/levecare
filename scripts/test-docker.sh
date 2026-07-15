#!/usr/bin/env bash
# Run Go + Java unit tests using native tools when present, otherwise Docker.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Go test + vet"
(
  cd services/go
  "$REPO_ROOT/scripts/with-go.sh" go test ./...
  "$REPO_ROOT/scripts/with-go.sh" go vet ./...
)

echo "==> Java verify"
(
  cd services/patients
  "$REPO_ROOT/scripts/with-maven.sh" -q verify
)

echo "all tests passed"
