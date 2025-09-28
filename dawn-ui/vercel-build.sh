#!/usr/bin/env bash
set -e

# Install compact compiler
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/download/compact-v0.2.0/compact-installer.sh | sh

# Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Update compact
compact update

# Install root dependencies first
cd ..
npm install --legacy-peer-deps

# Install contract dependencies and compile
cd contract
npm install
npm run compact

# Install API dependencies
cd ../api
npm install

# Build the UI
cd ../dawn-ui
npm install --legacy-peer-deps
npm run build
