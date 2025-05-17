import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk';
import { StdioServerTransport } from '@modelcontextprotocol/sdk';

import { registerDecompileTools } from './tools/decompileTools.js';

/**
 * Create and initialize the MCP server
 */
async function createServer() {
  // Initialize MCP server
  const server = new McpServer({
    name: 'java-decompiler',
    version: '1.0.0',
    description: 'MCP server for decompiling Java class files'
  });
  
  // Register tools
  registerDecompileTools(server);
  
  return server;
}

/**
 * Start the server
 */
async function main() {
  const server = await createServer();
  
  // Check if we should run in HTTP mode or stdio mode
  const useHTTP = process.env.MCP_USE_HTTP === 'true';
  
  if (useHTTP) {
    // Set up HTTP transport
    const app = express();
    app.use(express.json());
    
    const port = process.env.PORT || 3000;
    
    // Store transports for each session
    const transports: Record<string, StreamableHTTPServerTransport> = {};
    
    // Setup MCP endpoint
    app.all('/mcp', async (req, res) => {
      const sessionId = req.headers['x-mcp-session-id'] as string || 'default';
      
      if (!transports[sessionId]) {
        // Create new transport for this session
        transports[sessionId] = new StreamableHTTPServerTransport();
        
        // Connect the server to the transport
        server.connect(transports[sessionId]).catch((error: Error) => {
          console.error(`Error connecting to transport for session ${sessionId}:`, error);
          delete transports[sessionId];
        });
      }
      
      // Process the request
      await transports[sessionId].handleRequest(req, res);
    });
    
    // Start HTTP server
    app.listen(port, () => {
      console.log(`MCP Java Decompiler server listening on port ${port}`);
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

// Start the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});