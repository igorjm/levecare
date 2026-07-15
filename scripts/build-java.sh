#!/usr/bin/env bash
# Packages patients-service (shaded jar for Lambda). Uses Docker
# (maven:3.9-eclipse-temurin-21) when `mvn` is not on PATH.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT/services/patients"

echo "building patients-service..."
"$REPO_ROOT/scripts/with-maven.sh" -q -DskipTests package
echo "done: $(ls -la target/patients-service.jar 2>/dev/null || ls target/*.jar)"
