#!/usr/bin/env bash
# Run a command with Go available.
# Prefer Docker (golang:1.22) when the daemon is up; otherwise use native `go`.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GO_IMAGE="${GO_IMAGE:-golang:1.22}"

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

if command -v go >/dev/null 2>&1; then
  exec "$@"
fi

echo "error: Docker is not running and go is not installed" >&2
echo "start Docker Desktop, or install Go 1.22+" >&2
exit 1
