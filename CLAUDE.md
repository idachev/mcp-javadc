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

- `src/index.ts`: Main server entry point that sets up MCP server and transport
- `src/services/decompiler.ts`: Core decompiler service that interacts with CFR decompiler
- `src/tools/decompileTools.ts`: MCP tool definitions for decompilation operations
- `src/types/modelcontextprotocol.d.ts`: TypeScript definitions for MCP SDK

## Development Commands

To run frequently used commands:

```bash
# Install dependencies
npm install

# Build the TypeScript project
npm run build

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

- TypeScript
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

## TypeScript Notes

When building or updating the TypeScript code:

- Ensure MCP SDK imports use correct paths (@modelcontextprotocol/sdk)
- The MCP tools API changed between versions, check docs for current format
- Use proper type annotations, especially for callback parameters

## MCP Protocol Notes

The MCP server uses the following structure:

- Setup a McpServer with name and version
- Register tools with name, parameters schema, and execute function
- Connect server to transport (HTTP or stdio)
- Return properly formatted responses with content array

## Troubleshooting

Common issues:

- If CFR fails to decompile, ensure the class file is valid and readable
- Check CLASSPATH environment variable when using package-based decompilation
- Ensure temporary directories are properly cleaned up
- Verify the input class file exists and is accessible