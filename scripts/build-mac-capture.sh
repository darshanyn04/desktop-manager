#!/usr/bin/env bash

echo "🔨 Building mac-capture (release)..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MAC_CAPTURE_DIR="$ROOT_DIR/src/mac-capture"
BIN_DIR="$ROOT_DIR/bin"

if ! command -v swift >/dev/null 2>&1; then
  echo "⚠️ Swift not found. Skipping mac-capture build."
  exit 0
fi

if [ ! -d "$MAC_CAPTURE_DIR" ]; then
  echo "⚠️ mac-capture source not found at $MAC_CAPTURE_DIR"
  echo "⚠️ Skipping native build."
  exit 0
fi

cd "$MAC_CAPTURE_DIR"

echo "📁 Building in $MAC_CAPTURE_DIR"
swift build -c release || {
  echo "⚠️ Swift build failed. Continuing without native capture."
  exit 0
}

mkdir -p "$BIN_DIR"

if [ -f ".build/release/mac-capture" ]; then
  cp .build/release/mac-capture "$BIN_DIR/mac-capture"
  chmod +x "$BIN_DIR/mac-capture"
  echo "✅ mac-capture copied to bin/"
else
  echo "⚠️ mac-capture binary not found after build."
fi
