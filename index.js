#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs/promises';
import { decompile } from '@run-slicer/cfr';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';

const SERVER_NAME = 'javadc';
const PACKAGE_VERSION = '1.1.5';

class DecompilerService {
  async decompileFromPath(classFilePath) {
    try {
      await fs.access(classFilePath);
      const classData = await fs.readFile(classFilePath);
      const internalName = this.getInternalNameFromPath(classFilePath);

      const decompiled = await decompile(internalName, {
        source: async name => {
          if (name === internalName) {
            return classData;
          }
          if (name.startsWith('java/lang/')) {
            return Buffer.from([]);
          }
          return null;
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

  async decompileFromPackage(packageName, classpath = []) {
    try {
      const classFilePath = await this.findClassFile(packageName, classpath);
      if (!classFilePath) {
        throw new Error(`Could not find class file for package: ${packageName}`);
      }

      const internalName = packageName.replace(/\./g, '/');
      const classData = await fs.readFile(classFilePath);

      const decompiled = await decompile(internalName, {
        source: async name => {
          if (name === internalName) {
            return classData;
          }
          if (name.startsWith('java/lang/')) {
            return Buffer.from([]);
          }
          return null;
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

  async findClassFile(packageName, classpath = []) {
    const classPathFormat = packageName.replace(/\./g, path.sep) + '.class';

    if (classpath.length === 0) {
      const envClasspath = process.env.CLASSPATH;
      if (envClasspath) {
        classpath = envClasspath.split(path.delimiter);
      } else {
        classpath = [process.cwd()];
      }
    }

    for (const cp of classpath) {
      const potentialPath = path.join(cp, classPathFormat);
      try {
        await fs.access(potentialPath);
        return potentialPath;
      } catch {
        // Continue to next classpath
      }
    }

    return null;
  }

  getInternalNameFromPath(classFilePath) {
    const className = path.basename(classFilePath, '.class');
    const pathParts = classFilePath.split(path.sep);
    const classNameIndex = pathParts.findIndex(part => part === className + '.class');

    if (classNameIndex <= 0) {
      return className;
    }

    const packageParts = [];
    let i = classNameIndex - 1;

    while (i >= 0) {
      const part = pathParts[i];
      if (/^[a-z][a-z0-9_.]*$/.test(part)) {
        packageParts.unshift(part);
      } else {
        break;
      }
      i--;
    }

    if (packageParts.length > 0) {
      return packageParts.join('/') + '/' + className;
    }

    return className;
  }
}

const DecompileFromPathSchema = z.object({
  classFilePath: z.string().describe('The absolute path to the .class file'),
});

const DecompileFromPackageSchema = z.object({
  packageName: z.string().describe('Fully qualified Java package and class name'),
  classpath: z.array(z.string())
    .describe('Array of classpath directories to search')
    .optional(),
});

const decompilerService = new DecompilerService();

const server = new Server(
  {
    name: SERVER_NAME,
    version: PACKAGE_VERSION,
    description: 'MCP server for decompiling Java class files',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'decompile-from-path',
        description: 'Decompiles a Java .class file from a given file path',
        parameters_schema: DecompileFromPathSchema,
      },
      {
        name: 'decompile-from-package',
        description: 'Decompiles a Java class from a package name',
        parameters_schema: DecompileFromPackageSchema,
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { tool, args } = request.params;
  
  switch (tool) {
    case 'decompile-from-path': {
      const { classFilePath } = args;
      if (!classFilePath) {
        return {
          content: [{ type: 'text', text: 'Error: Missing classFilePath parameter' }],
        };
      }
      
      try {
        const decompiled = await decompilerService.decompileFromPath(classFilePath);
        return {
          content: [{ type: 'text', text: decompiled }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
        };
      }
    }
    
    case 'decompile-from-package': {
      const { packageName, classpath = [] } = args;
      if (!packageName) {
        return {
          content: [{ type: 'text', text: 'Error: Missing packageName parameter' }],
        };
      }
      
      try {
        const decompiled = await decompilerService.decompileFromPackage(packageName, classpath);
        return {
          content: [{ type: 'text', text: decompiled }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
        };
      }
    }
    
    default:
      return {
        content: [{ type: 'text', text: `Error: Unknown tool ${tool}` }],
      };
  }
});

async function main() {
  try {
    console.error(`
---------------------------------------------
MCP Java Decompiler Server
---------------------------------------------
Model Context Protocol (MCP) server that
decompiles Java bytecode into readable source
---------------------------------------------
`);

    console.error('Starting in stdio mode...');
    console.error('Use this mode when connecting through an MCP client');
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Java Decompiler server running on stdio');

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

export { server };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
