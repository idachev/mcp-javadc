# MCP Java Decompiler Server - Claude Memory File

This file contains instructions and context for Claude when working on this project.

## Project Overview

This project is a Model Context Protocol (MCP) server that provides Java decompilation services. It allows AI assistants and tools to decompile Java bytecode (.class files) into readable source code by exposing a standard MCP interface.

## Key Features

- Uses the Model Context Protocol (MCP) to provide a standardized API
- Provides tools to decompile Java class files from file paths or package names
- Uses stdio transport for seamless integration with MCP clients
- Implements proper error handling and temporary file management

## Project Structure

- `index.js`: Main server file that contains all the logic

## Development Commands

To run frequently used commands:

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run using the start script
npm start

# Use helper script
./run.sh
```

## MCP Tools

The server provides two tools:

1. `decompile-from-path`: Decompiles a Java class file from a file path
   - Input: `classFilePath` (absolute path to the .class file)
   
2. `decompile-from-package`: Decompiles a Java class from a package name
   - Input: `packageName` (fully qualified Java package and class name)
   - Input (optional): `classpath` (array of classpath directories to search)

## Technology Stack

- JavaScript (ES Modules)
- Node.js
- CFR (@run-slicer/cfr - JavaScript port of the CFR Java decompiler)
- Model Context Protocol (MCP) SDK (@modelcontextprotocol/sdk)
- Zod (for parameter validation)

## Implementation Details

The server uses the official MCP SDK to provide proper protocol handling:

- Uses `Server` from the MCP SDK for core functionality
- Registers tool handlers with parameter schemas
- Implements proper response formatting
- Uses `StdioServerTransport` for standard input/output communication

## Future Improvements

Potential enhancements to consider:

- Add unit tests and integration tests
- Support for decompiling entire JAR files
- Implement caching of decompiled results
- Add more configuration options (decompiler settings)
- Create a Docker container for easier deployment

## MCP Protocol Notes

The MCP server uses the following structure:

- Setup a Server with name and version
- Register tools with name, parameters schema, and execute function
- Register core protocol handlers for compatibility with clients
- Connect server to stdio transport
- Return properly formatted responses with content array

### Important Protocol Handler Registration

The server uses the official MCP SDK to properly register protocol handlers:

1. `ListToolsRequestSchema`: Handles the `mcp.tool.list` method and returns available tools with their parameter schemas
2. `CallToolRequestSchema`: Handles the `mcp.tool.execute` method to execute tools with proper validation

These registrations are essential for compatibility with Claude and other MCP clients.

## Troubleshooting

Common issues:

- If CFR fails to decompile, ensure the class file is valid and readable
- Check CLASSPATH environment variable when using package-based decompilation
- Ensure temporary directories are properly cleaned up
- Verify the input class file exists and is accessible
- If you encounter "Method not found" errors from Claude, ensure protocol handlers are properly registered