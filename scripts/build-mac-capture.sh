#!/usr/bin/env bash
set -e

echo "🔨 Building mac-capture (release)..."

cd mac-capture
swift build -c release

mkdir -p ../bin
cp .build/release/mac-capture ../bin/mac-capture

echo "✅ mac-capture copied to bin/"
