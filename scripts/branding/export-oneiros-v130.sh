#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "${SCRIPT_DIRECTORY}/../.." && pwd)"
MODULE_CACHE_ROOT="${TMPDIR:-/tmp}/oneiros-swift-module-cache"

mkdir -p "${MODULE_CACHE_ROOT}"
cd "${REPOSITORY_ROOT}"

SWIFT_MODULECACHE_PATH="${MODULE_CACHE_ROOT}" \
CLANG_MODULE_CACHE_PATH="${MODULE_CACHE_ROOT}" \
swift scripts/branding/export-oneiros-v130.swift

node scripts/branding/validate-oneiros-v130.mjs
