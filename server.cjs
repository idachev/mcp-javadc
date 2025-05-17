#!/usr/bin/env node

/**
 * CommonJS entry point for the MCP Java Decompiler server
 * This provides better compatibility when running with npx
 */

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

// Print banner
console.error(`
---------------------------------------------
MCP Java Decompiler Server (javadc)
---------------------------------------------
Model Context Protocol (MCP) server that
decompiles Java bytecode into readable source
---------------------------------------------
`);

// Print mode
if (useHttp) {
  console.error(`Starting in HTTP mode on port ${port}...`);
  console.error(`Server will be available at: http://localhost:${port}/mcp`);
} else {
  console.error('Starting in stdio mode...');
  console.error('Use this mode when connecting through an MCP client');
}

// Import the ESM module using dynamic import
(async () => {
  try {
    // Load the main module
    await import('./index.js');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();