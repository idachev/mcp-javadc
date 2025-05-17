#!/bin/bash

# Script to run the MCP Java Decompiler server

if [[ "$1" == "--help" ]]; then
  echo "Usage: $0 [--help]"
  echo ""
  echo "Options:"
  echo "  --help       Show this help"
  exit 0
fi

if [[ $# -gt 0 ]]; then
  echo "Unknown option: $1"
  echo "Use --help for usage information"
  exit 1
fi

npm start