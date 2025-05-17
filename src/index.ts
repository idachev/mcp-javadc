import express from 'express';
// Use dynamic imports for the SDK
// @ts-expect-error Importing SDK dynamically
import sdk from '@modelcontextprotocol/sdk';

const { McpServer } = sdk;
const { StreamableHTTPServerTransport } = sdk;
const { StdioServerTransport } = sdk;

import { registerDecompileTools } from './tools/decompileTools.js';

/**
 * Package version from package.json
 */
const PACKAGE_VERSION = '1.0.0';

/**
 * Create and initialize the MCP server
 *
 * @returns Initialized MCP server instance
 */
export async function createServer() {
  // Initialize MCP server
  const server = new McpServer({
    name: 'java-decompiler',
    version: PACKAGE_VERSION,
    description: 'MCP server for decompiling Java class files',
  });

  // Register tools
  registerDecompileTools(server);

  return server;
}

/**
 * Start the server with the appropriate transport
 *
 * @param server - The MCP server instance
 * @returns Promise that resolves when the server is started
 */
export async function startServer(server: typeof McpServer) {
  // Check if we should run in HTTP mode or stdio mode
  const useHTTP = process.env.MCP_USE_HTTP === 'true';

  if (useHTTP) {
    // Set up HTTP transport
    const app = express();
    app.use(express.json());

    const port = parseInt(process.env.PORT || '3000', 10);

    // Store transports for each session
    const transports: Record<string, typeof StreamableHTTPServerTransport> = {};

    // Setup MCP endpoint
    app.all('/mcp', async (req, res) => {
      const sessionId = (req.headers['x-mcp-session-id'] as string) || 'default';

      if (!transports[sessionId]) {
        // Create new transport for this session
        transports[sessionId] = new StreamableHTTPServerTransport();

        // Connect the server to the transport
        server.connect(transports[sessionId], { sessionId }).catch((error: Error) => {
          console.error(`Error connecting to transport for session ${sessionId}:`, error);
          delete transports[sessionId];
        });
      }

      // Process the request
      await transports[sessionId].handleRequest(req, res);
    });

    // Start HTTP server
    return new Promise<void>(resolve => {
      app.listen(port, () => {
        console.log(`MCP Java Decompiler server listening on port ${port}`);
        resolve();
      });
    });
  } else {
    // Use stdio transport (for CLI usage)
    const transport = new StdioServerTransport();

    try {
      // Connect server to stdio transport
      await server.connect(transport);
      console.error('MCP Java Decompiler server running in stdio mode');
    } catch (error) {
      console.error('Error starting server in stdio mode:', error);
      process.exit(1);
    }
  }
}

/**
 * Main function to run the server
 */
async function main() {
  try {
    const server = await createServer();
    await startServer(server);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
