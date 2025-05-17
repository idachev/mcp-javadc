#!/bin/bash

# Script to run the MCP Java Decompiler server

# Parse arguments
MODE="stdio"
PORT=3000

while [[ $# -gt 0 ]]; do
  case $1 in
    --http)
      MODE="http"
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--http] [--port PORT]"
      echo ""
      echo "Options:"
      echo "  --http       Run in HTTP mode (default: stdio)"
      echo "  --port PORT  HTTP port to use (default: 3000)"
      echo "  --help       Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Build the project if needed
if [ ! -d "dist" ]; then
  echo "Building project..."
  npm run build
fi

# Run the server
if [ "$MODE" = "http" ]; then
  echo "Starting server in HTTP mode on port $PORT..."
  PORT=$PORT MCP_USE_HTTP=true node dist/index.js
else
  echo "Starting server in stdio mode..."
  node dist/index.js
fi