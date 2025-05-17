#!/usr/bin/env node

/**
 * CommonJS entry point for the MCP Java Decompiler server
 * This provides better compatibility when running with npx
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');
const os = require('os');

// Manual implementation of the core functionality
// This avoids dependency on the MCP SDK's complex export structure

// Simple decompiler service
class DecompilerService {
  constructor() {
    // Load CFR decompiler
    try {
      // @run-slicer/cfr is already a dependency in package.json
      this.cfr = require('@run-slicer/cfr');
    } catch (error) {
      console.error('Failed to load @run-slicer/cfr decompiler:', error.message);
      process.exit(1);
    }
  }

  async decompileFromPath(classFilePath) {
    try {
      // Check if file exists
      await fs.promises.access(classFilePath);
      
      // Create temp output directory
      const tempDir = await this.createTempDir();
      
      try {
        // Run CFR decompiler
        const sourceCode = await this.cfr.decompile(classFilePath);
        
        // CFR returns the source code directly
        return sourceCode;
      } finally {
        // Cleanup temp directory
        await this.cleanupTempDir(tempDir);
      }
    } catch (error) {
      throw new Error(`Failed to decompile class file: ${error.message}`);
    }
  }
  
  async decompileFromPackage(packageName, classpath = []) {
    try {
      // Convert package name to file path format
      const classFilePath = await this.findClassFile(packageName, classpath);
      if (!classFilePath) {
        throw new Error(`Could not find class file for package: ${packageName}`);
      }
      
      // Decompile the found class file
      return await this.decompileFromPath(classFilePath);
    } catch (error) {
      throw new Error(`Failed to decompile package: ${error.message}`);
    }
  }
  
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
        await fs.promises.access(potentialPath);
        return potentialPath; // Found it!
      } catch {
        // File not found in this classpath, continue to next
      }
    }
    
    return null; // Not found in any classpath
  }
  
  async createTempDir() {
    const tempDir = path.join(
      os.tmpdir(),
      `javadc-${crypto.randomBytes(8).toString('hex')}`
    );
    await fs.promises.mkdir(tempDir, { recursive: true });
    return tempDir;
  }
  
  async cleanupTempDir(tempDir) {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up temporary directory:', error);
    }
  }
}

// Simple MCP-like server
class SimpleMcpServer {
  constructor() {
    this.decompilerService = new DecompilerService();
    this.tools = {
      'decompile-from-path': async (args) => {
        try {
          const { classFilePath } = args;
          if (!classFilePath) {
            return this.formatError('Missing classFilePath parameter');
          }
          
          const decompiled = await this.decompilerService.decompileFromPath(classFilePath);
          return this.formatResult(decompiled);
        } catch (error) {
          return this.formatError(error.message);
        }
      },
      
      'decompile-from-package': async (args) => {
        try {
          const { packageName, classpath = [] } = args;
          if (!packageName) {
            return this.formatError('Missing packageName parameter');
          }
          
          const decompiled = await this.decompilerService.decompileFromPackage(packageName, classpath);
          return this.formatResult(decompiled);
        } catch (error) {
          return this.formatError(error.message);
        }
      }
    };
  }
  
  formatResult(text) {
    return {
      content: [
        {
          type: 'text',
          text
        }
      ]
    };
  }
  
  formatError(message) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`
        }
      ]
    };
  }
  
  handleRequest(jsonRpcRequest) {
    return new Promise(async (resolve) => {
      try {
        const { id, method, params } = jsonRpcRequest;
        
        if (method !== 'mcp.tool.execute') {
          return resolve({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: 'Method not found'
            }
          });
        }
        
        const { tool, args } = params;
        
        if (!this.tools[tool]) {
          return resolve({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Tool "${tool}" not found`
            }
          });
        }
        
        try {
          const result = await this.tools[tool](args);
          resolve({
            jsonrpc: '2.0',
            id,
            result
          });
        } catch (error) {
          resolve({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32000,
              message: error.message
            }
          });
        }
      } catch (error) {
        resolve({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error'
          }
        });
      }
    });
  }
}

// Main function to run the server
async function main() {
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
  
  // Create server
  const server = new SimpleMcpServer();
  
  // Start server in appropriate transport mode
  if (useHttp) {
    // HTTP mode
    const app = express();
    app.use(express.json());
    
    // Handle MCP requests
    app.all('/mcp', async (req, res) => {
      try {
        const response = await server.handleRequest(req.body);
        res.json(response);
      } catch (error) {
        res.status(500).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32000,
            message: error.message
          }
        });
      }
    });
    
    // Start HTTP server
    app.listen(port, () => {
      console.log(`MCP Java Decompiler server listening on port ${port}`);
    });
  } else {
    // Stdio mode
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    
    process.stdin.on('data', async (chunk) => {
      buffer += chunk;
      
      try {
        const request = JSON.parse(buffer);
        buffer = '';
        
        const response = await server.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (e) {
        // Not a complete JSON object yet, keep buffering
        if (e instanceof SyntaxError) {
          return;
        }
        
        // Other error, send error response
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error'
          }
        }) + '\n');
        
        buffer = '';
      }
    });
  }
}

// Start the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});