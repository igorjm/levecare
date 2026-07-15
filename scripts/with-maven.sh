#!/usr/bin/env bash
# Run a Maven command.
# Prefer Docker (maven:3.9-eclipse-temurin-21) when the daemon is up;
# otherwise use native `mvn`. Mounts ~/.m2 for dependency cache.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAVEN_IMAGE="${MAVEN_IMAGE:-maven:3.9-eclipse-temurin-21}"
M2_CACHE="${M2_CACHE:-$HOME/.m2}"

use_docker() {
  command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1
}

if use_docker; then
  mkdir -p "$M2_CACHE"

  rel_cwd="${PWD#"$REPO_ROOT"}"
  rel_cwd="${rel_cwd#/}"
  work_dir="/workspace"
  if [[ -n "$rel_cwd" && "$PWD" == "$REPO_ROOT"* ]]; then
    work_dir="/workspace/$rel_cwd"
  fi

  exec docker run --rm \
    -v "$REPO_ROOT:/workspace" \
    -v "$M2_CACHE:/root/.m2" \
    -w "$work_dir" \
    "$MAVEN_IMAGE" \
    mvn "$@"
fi

if command -v mvn >/dev/null 2>&1; then
  exec mvn "$@"
fi

echo "error: Docker is not running and mvn is not installed" >&2
echo "start Docker Desktop, or install Java 21 + Maven" >&2
exit 1
