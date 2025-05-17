import { z } from 'zod';
import { McpServer, McpToolParams } from '@modelcontextprotocol/sdk';
import { DecompilerService } from '../services/decompiler.js';

/**
 * Register decompilation tools with the MCP server
 */
export function registerDecompileTools(server: McpServer) {
  const decompilerService = new DecompilerService();

  // Tool 1: Decompile from file path
  server.tool(
    'decompile-from-path',
    {
      classFilePath: z.string().describe('Absolute path to the Java .class file'),
    },
    {
      description: 'Decompiles a Java .class file from a given file path',
      execute: async (params: McpToolParams) => {
        try {
          const classFilePath = params.classFilePath as string;
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
      },
    }
  );

  // Tool 2: Decompile from package name
  server.tool(
    'decompile-from-package',
    {
      packageName: z
        .string()
        .describe('Fully qualified Java package and class name (e.g. java.util.ArrayList)'),
      classpath: z
        .array(z.string())
        .optional()
        .describe('Optional array of classpath directories to search'),
    },
    {
      description: 'Decompiles a Java class from a package name',
      execute: async (params: McpToolParams) => {
        try {
          const packageName = params.packageName as string;
          const classpath = params.classpath || [];
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
      },
    }
  );
}
