#!/bin/bash
# Script to start a local development server for testing the React application

REACT_APP_DIR="/workspaces/wyatt-personal-aws/src/frontend/react-app"
PORT=3000

# Use direct paths to Node.js and npm binaries
NODE_PATH=$(which node 2>/dev/null || echo "")
NPM_PATH=$(which npm 2>/dev/null || echo "")

if [ -z "$NODE_PATH" ] || [ -z "$NPM_PATH" ]; then
    echo "Error: Node.js/npm is not installed or not in PATH."
    echo "Node path: $NODE_PATH"
    echo "NPM path: $NPM_PATH"
    exit 1
fi

echo "Using Node.js at: $NODE_PATH ($(node -v))"
echo "Using npm at: $NPM_PATH ($(npm -v))"

# Check if the React app directory exists
if [ ! -d "$REACT_APP_DIR" ]; then
    echo "Error: React app directory not found at $REACT_APP_DIR"
    exit 1
fi

# Navigate to the React app directory
cd "$REACT_APP_DIR" || exit 1

# Install dependencies if node_modules doesn't exist
if [ ! -d "$REACT_APP_DIR/node_modules" ]; then
    echo "Installing dependencies..."
    "$NPM_PATH" install
fi

echo "Starting React development server at http://localhost:$PORT"
echo "Press Ctrl+C to stop the server"

# Start React development server with explicit path
"$NPM_PATH" start
