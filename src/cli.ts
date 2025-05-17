#!/usr/bin/env node

/**
 * CLI entry point for the MCP Java Decompiler server
 * This file enables the package to be run with npx
 */

import { createServer, startServer } from './index.js';

// Print banner
console.error(`
---------------------------------------------
MCP Java Decompiler Server
---------------------------------------------
Model Context Protocol (MCP) server that
decompiles Java bytecode into readable source
---------------------------------------------
`);

// Parse command line arguments
const args = process.argv.slice(2);
const useHttp = args.includes('--http');
const portIndex = args.indexOf('--port');
const port = portIndex !== -1 && args[portIndex + 1] ? parseInt(args[portIndex + 1], 10) : 3000;

// Override environment variables based on arguments
if (useHttp) {
  process.env.MCP_USE_HTTP = 'true';
  process.env.PORT = port.toString();
}

// Print mode
if (useHttp) {
  console.error(`Starting in HTTP mode on port ${port}...`);
  console.error(`Server will be available at: http://localhost:${port}/mcp`);
} else {
  console.error('Starting in stdio mode...');
  console.error('Use this mode when connecting through an MCP client');
}

// Start the server
async function main() {
  try {
    const server = await createServer();

    // Add signal handlers for proper shutdown
    process.on('SIGINT', () => {
      console.error('\nShutting down MCP Java Decompiler server...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.error('\nShutting down MCP Java Decompiler server...');
      process.exit(0);
    });

    // Start the server with the appropriate transport
    await startServer(server);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main();
