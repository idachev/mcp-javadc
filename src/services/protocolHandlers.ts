// @ts-expect-error Importing SDK dynamically
import sdk from '@modelcontextprotocol/sdk';

/**
 * Register core MCP protocol handlers to ensure compatibility
 * with Claude and other MCP clients.
 *
 * @param server The MCP server instance
 */
export function registerProtocolHandlers(server: typeof sdk.McpServer) {
  // Register the list method to return available tools
  server.setRequestHandler('mcp.tool.list', async () => {
    // Return tool definitions matching what we've registered
    return {
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
    };
  });

  // Register the execute method if needed
  server.setRequestHandler('mcp.tool.execute', async () => {
    // The SDK might already handle this internally, but we're ensuring it's registered
    // Params are available at request.params if needed
    // Avoiding unused variables to satisfy linting

    // This implementation is a fallback in case the SDK doesn't handle it properly
    // It should delegate to the appropriate tool handler that we've already registered
    // using server.tool() in registerDecompileTools

    // Return a placeholder error if the method is invoked directly
    return {
      error: {
        code: -32602,
        message:
          "Tool execution should be handled by the SDK's internal implementation. Direct calls to mcp.tool.execute are not supported.",
      },
    };
  });
}
