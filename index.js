#!/usr/bin/env node

import express from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';
import { decompile } from '@run-slicer/cfr';

// ---------------------------------------
// Constants
// ---------------------------------------
const SERVER_NAME = 'javadc';
const PACKAGE_VERSION = '1.1.5';

// ---------------------------------------
// Decompiler Service
// ---------------------------------------
class DecompilerService {
  // Decompile from file path
  async decompileFromPath(classFilePath) {
    try {
      // Check if file exists
      await fs.access(classFilePath);

      // Read the class file
      const classData = await fs.readFile(classFilePath);

      // Convert file path to package format (approximate)
      const internalName = this.getInternalNameFromPath(classFilePath);

      // Use CFR to decompile
      const decompiled = await decompile(internalName, {
        source: async name => {
          if (name === internalName) {
            return classData;
          }

          // For basic Java language classes, return an empty Buffer
          if (name.startsWith('java/lang/')) {
            return Buffer.from([]);
          }

          return null; // No other supporting classes provided
        },
        options: {
          hidelangimports: 'true',
          showversion: 'false',
        },
      });

      return decompiled;
    } catch (error) {
      throw new Error(`Failed to decompile class file: ${error.message}`);
    }
  }

  // Decompile from package name
  async decompileFromPackage(packageName, classpath = []) {
    try {
      // Convert package name to file path format
      const classFilePath = await this.findClassFile(packageName, classpath);
      if (!classFilePath) {
        throw new Error(`Could not find class file for package: ${packageName}`);
      }

      // Get internal package name for CFR (replace dots with slashes)
      const internalName = packageName.replace(/\./g, '/');

      // Read the class file
      const classData = await fs.readFile(classFilePath);

      // Use CFR to decompile
      const decompiled = await decompile(internalName, {
        source: async name => {
          if (name === internalName) {
            return classData;
          }

          // For basic Java language classes, return an empty Buffer
          if (name.startsWith('java/lang/')) {
            return Buffer.from([]);
          }

          return null; // No other supporting classes provided
        },
        options: {
          hidelangimports: 'true',
          showversion: 'false',
        },
      });

      return decompiled;
    } catch (error) {
      throw new Error(`Failed to decompile package: ${error.message}`);
    }
  }

  // Find class file in classpath
  async findClassFile(packageName, classpath = []) {
    // Convert package name to path format (with .class extension)
    const classPathFormat = packageName.replace(/\./g, path.sep) + '.class';

    // Include default classpaths if none specified
    if (classpath.length === 0) {
      // Try to use CLASSPATH environment variable
      const envClasspath = process.env.CLASSPATH;
      if (envClasspath) {
        classpath = envClasspath.split(path.delimiter);
      } else {
        // Use current directory as fallback
        classpath = [process.cwd()];
      }
    }

    // Search each classpath for the file
    for (const cp of classpath) {
      const potentialPath = path.join(cp, classPathFormat);
      try {
        await fs.access(potentialPath);
        return potentialPath; // Found it!
      } catch {
        // File not found in this classpath, continue to next
      }
    }

    return null; // Not found in any classpath
  }

  // Get internal name from path
  getInternalNameFromPath(classFilePath) {
    // Get the filename without extension
    const className = path.basename(classFilePath, '.class');

    // Attempt to find package structure in path
    const pathParts = classFilePath.split(path.sep);
    const classNameIndex = pathParts.findIndex(part => part === className + '.class');

    if (classNameIndex <= 0) {
      return className;
    }

    // Look backward to find potential package parts
    const packageParts = [];
    let i = classNameIndex - 1;

    // This logic attempts to identify package parts by looking for lowercase directory names
    while (i >= 0) {
      const part = pathParts[i];
      // Common Java package naming patterns (lowercase, may contain dots)
      if (/^[a-z][a-z0-9_.]*$/.test(part)) {
        packageParts.unshift(part);
      } else {
        break;
      }
      i--;
    }

    // Combine package parts with the class name
    if (packageParts.length > 0) {
      return packageParts.join('/') + '/' + className;
    }

    return className;
  }
}

// ---------------------------------------
// MCP Server
// ---------------------------------------
class McpServer {
  constructor() {
    this.decompiler = new DecompilerService();
    this.tools = {
      'decompile-from-path': this.decompileFromPath.bind(this),
      'decompile-from-package': this.decompileFromPackage.bind(this),
    };
  }

  // Process JSON-RPC request
  async processRequest(request) {
    const { id, method, params } = request;

    try {
      if (method === 'mcp.tool.list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            server: {
              name: SERVER_NAME,
              version: PACKAGE_VERSION,
              description: 'MCP server for decompiling Java class files',
            },
            tools: [
              {
                name: 'decompile-from-path',
                description: 'Decompiles a Java .class file from a given file path',
                parameters: {
                  classFilePath: {
                    type: 'string',
                    description: 'The absolute path to the .class file',
                  },
                },
              },
              {
                name: 'decompile-from-package',
                description: 'Decompiles a Java class from a package name',
                parameters: {
                  packageName: {
                    type: 'string',
                    description: 'Fully qualified Java package and class name',
                  },
                  classpath: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Array of classpath directories to search',
                    optional: true,
                  },
                },
              },
            ],
          },
        };
      } else if (method === 'mcp.tool.execute') {
        const { tool, args } = params;
        if (!this.tools[tool]) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Tool "${tool}" not found`,
            },
          };
        }

        const result = await this.tools[tool](args);
        return {
          jsonrpc: '2.0',
          id,
          result,
        };
      } else {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found',
          },
        };
      }
    } catch (error) {
      console.error('Error processing request:', error);
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message: error.message,
        },
      };
    }
  }

  // Tool implementation: decompile-from-path
  async decompileFromPath(args) {
    const { classFilePath } = args || {};
    if (!classFilePath) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Missing classFilePath parameter',
          },
        ],
      };
    }

    try {
      const decompiled = await this.decompiler.decompileFromPath(classFilePath);
      return {
        content: [
          {
            type: 'text',
            text: decompiled,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  // Tool implementation: decompile-from-package
  async decompileFromPackage(args) {
    const { packageName, classpath = [] } = args || {};
    if (!packageName) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Missing packageName parameter',
          },
        ],
      };
    }

    try {
      const decompiled = await this.decompiler.decompileFromPackage(packageName, classpath);
      return {
        content: [
          {
            type: 'text',
            text: decompiled,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }
}

// ---------------------------------------
// Server functions
// ---------------------------------------

// Start HTTP server
async function startHttpServer(server, port) {
  return new Promise((resolve, reject) => {
    try {
      const app = express();
      app.use(express.json());

      // Setup MCP endpoint
      app.post('/mcp', async (req, res) => {
        try {
          const response = await server.processRequest(req.body);
          res.json(response);
        } catch (error) {
          console.error('Error processing HTTP request:', error);
          res.status(500).json({
            jsonrpc: '2.0',
            id: req.body.id || null,
            error: {
              code: -32000,
              message: error.message,
            },
          });
        }
      });

      // Start server
      const httpServer = app.listen(port, () => {
        console.log(`MCP Java Decompiler server listening on port ${port}`);
        resolve(httpServer);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Start stdio server
async function startStdioServer(server) {
  process.stdin.setEncoding('utf8');
  let buffer = '';

  process.stdin.on('data', async chunk => {
    buffer += chunk;

    try {
      const request = JSON.parse(buffer);
      buffer = '';

      const response = await server.processRequest(request);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (e) {
      // Not a complete JSON yet, keep buffering
      if (e instanceof SyntaxError) {
        return;
      }

      // Other error
      console.error('Error processing stdio request:', e);
      process.stdout.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32000,
            message: e.message,
          },
        }) + '\n'
      );
      buffer = '';
    }
  });

  process.stdin.on('end', () => {
    console.error('stdin stream ended');
    process.exit(0);
  });

  console.error('MCP Java Decompiler server running in stdio mode');
}

// Main entry point
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const useHttp = args.includes('--http');
    const portIndex = args.indexOf('--port');
    const port = portIndex !== -1 && args[portIndex + 1] ? parseInt(args[portIndex + 1], 10) : 3000;

    // Print banner
    console.error(`
---------------------------------------------
MCP Java Decompiler Server
---------------------------------------------
Model Context Protocol (MCP) server that
decompiles Java bytecode into readable source
---------------------------------------------
`);

    // Create server
    const server = new McpServer();

    // Print mode and start server
    if (useHttp) {
      console.error(`Starting in HTTP mode on port ${port}...`);
      console.error(`Server will be available at: http://localhost:${port}/mcp`);
      await startHttpServer(server, port);
    } else {
      console.error('Starting in stdio mode...');
      console.error('Use this mode when connecting through an MCP client');
      await startStdioServer(server);
    }

    // Add signal handlers for proper shutdown
    process.on('SIGINT', () => {
      console.error('\nShutting down MCP Java Decompiler server...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.error('\nShutting down MCP Java Decompiler server...');
      process.exit(0);
    });
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Export API for programmatic usage
export const server = new McpServer();
export const processRequest = server.processRequest.bind(server);

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
