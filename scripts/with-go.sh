#!/usr/bin/env bash
# Run a command with Go available.
# Prefer native `go` (CI / local installs); fall back to Docker golang:1.22.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GO_IMAGE="${GO_IMAGE:-golang:1.22}"

if command -v go >/dev/null 2>&1; then
  exec "$@"
fi

use_docker() {
  command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1
}

if use_docker; then
  rel_cwd="${PWD#"$REPO_ROOT"}"
  rel_cwd="${rel_cwd#/}"
  work_dir="/workspace"
  if [[ -n "$rel_cwd" && "$PWD" == "$REPO_ROOT"* ]]; then
    work_dir="/workspace/$rel_cwd"
  fi

  exec docker run --rm \
    -v "$REPO_ROOT:/workspace" \
    -w "$work_dir" \
    -e CGO_ENABLED="${CGO_ENABLED:-0}" \
    -e GOOS="${GOOS:-}" \
    -e GOARCH="${GOARCH:-}" \
    -e GOCACHE=/tmp/go-cache \
    -e GOMODCACHE=/tmp/go-mod \
    "$GO_IMAGE" \
    "$@"
fi

echo "error: go is not installed and Docker is not running" >&2
echo "install Go 1.22+, or start Docker Desktop" >&2
exit 1
