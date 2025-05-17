# MCP Java Decompiler Server - Claude Memory File

This file contains instructions and context for Claude when working on this project.

## Project Overview

This project is a Model Context Protocol (MCP) server that provides Java decompilation services. It allows AI assistants and tools to decompile Java bytecode (.class files) into readable source code by exposing a standard MCP interface.

## Key Features

- Uses the Model Context Protocol (MCP) to provide a standardized API
- Provides tools to decompile Java class files from file paths or package names
- Supports both HTTP and stdio transports for flexible integration
- Implements proper error handling and temporary file management

## Project Structure

- `index.js`: Main server file that contains all the logic
- `server.cjs`: CommonJS entry point that loads the main file

## Development Commands

To run frequently used commands:

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in HTTP mode
PORT=3000 MCP_USE_HTTP=true npm start

# Use helper script
./run.sh --http --port 3000
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
- Express (for HTTP transport)
- CFR (@run-slicer/cfr - JavaScript port of the CFR Java decompiler)
- Model Context Protocol (MCP) SDK
- Zod (for parameter validation)

## Future Improvements

Potential enhancements to consider:

- Add unit tests and integration tests
- Support for decompiling entire JAR files
- Add authentication for HTTP transport
- Implement caching of decompiled results
- Add more configuration options (decompiler settings)
- Create a Docker container for easier deployment

## MCP Protocol Notes

The MCP server uses the following structure:

- Setup a McpServer with name and version
- Register tools with name, parameters schema, and execute function
- Register core protocol handlers for compatibility with clients
- Connect server to transport (HTTP or stdio)
- Return properly formatted responses with content array

### Important Protocol Handler Registration

The server explicitly registers handlers for core MCP protocol methods:

1. `mcp.tool.list`: Returns available tools and their parameters
2. `mcp.tool.execute`: Handles tool execution requests

These registrations are essential for compatibility with Claude and other MCP clients.

## Troubleshooting

Common issues:

- If CFR fails to decompile, ensure the class file is valid and readable
- Check CLASSPATH environment variable when using package-based decompilation
- Ensure temporary directories are properly cleaned up
- Verify the input class file exists and is accessible
- If you encounter "Method not found" errors from Claude, ensure protocol handlers are properly registered