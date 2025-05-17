import { z } from 'zod';
// @ts-ignore
import sdk from '@modelcontextprotocol/sdk';
const { McpServer } = sdk;
import type { McpToolParams } from '../types/modelcontextprotocol.js';
import { DecompilerService } from '../services/decompiler.js';

/**
 * Register decompilation tools with the MCP server
 */
export function registerDecompileTools(server: any) {
  const decompilerService = new DecompilerService();

  // Tool 1: Decompile from file path
  server.tool(
    'decompile-from-path', 
    'Decompiles a Java .class file from a given file path',
    async (extra) => {
      const { args } = extra.request.params;
      const classFilePath = args?.classFilePath as string;
      
      try {
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
        
        const decompiled = await decompilerService.decompileFromPath(classFilePath);
        return {
          content: [
            {
              type: 'text',
              text: decompiled,
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error.message}`,
              },
            ],
          };
        }
        throw error;
      }
    }
  );

  // Tool 2: Decompile from package name
  server.tool(
    'decompile-from-package',
    'Decompiles a Java class from a package name',
    async (extra) => {
      const { args } = extra.request.params;
      const packageName = args?.packageName as string;
      const classpath = args?.classpath as string[] || [];
      
      try {
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
        
        const decompiled = await decompilerService.decompileFromPackage(packageName, classpath);
        return {
          content: [
            {
              type: 'text',
              text: decompiled,
            },
          ],
        };
      } catch (error) {
        if (error instanceof Error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error.message}`,
              },
            ],
          };
        }
        throw error;
      }
    }
  );
}