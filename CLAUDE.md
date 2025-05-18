# MCP Java Decompiler Server - Claude Development Guide

This file contains development-focused instructions and context for Claude when working on this project.

## Project Structure

- `index.js`: Main server file that contains all the logic

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run the server
npm start

# Create test fixtures (sample Java class for testing)
npm run test:setup

# Run tests
npm test

# Use MCP Inspector for interactive testing
npx @modelcontextprotocol/inspector node ./index.js
```

## Implementation Details

The server is built on the MCP SDK with:

- `Server` class for core functionality
- Tool registration with parameter schemas
- Standard response formatting
- `StdioServerTransport` for I/O communication

### Key Code Sections

1. **Server Initialization**: Setup with name and version
2. **Tool Registration**: Handlers for the decompiler functions
3. **Request Handling**: Functions for the core MCP protocol methods
4. **Decompiler Service**: Implementation of the decompiler functionality
5. **Transport Setup**: Configuration for stdio transport

### Protocol Handler Registration

The server registers these protocol handlers:

1. `ListToolsRequestSchema`: Handles `mcp.tool.list` to return available tools with parameter schemas
2. `CallToolRequestSchema`: Handles `mcp.tool.execute` to execute tools with validation

## Development Troubleshooting

Common development issues:

- If adding new tool parameters, update both the schema and the handler function
- If changing decompiler options, test with various Java versions
- When modifying JAR handling, ensure proper cleanup of temporary files
- Proper error handling is essential for MCP protocol compatibility
- Test with the MCP Inspector to verify tool registration and execution
- If you encounter "Method not found" errors, check protocol handler registration
- Version numbers must be updated in both package.json and the SERVER_VERSION constant
