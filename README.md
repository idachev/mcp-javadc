# MCP Java Decompiler Server

A Model Context Protocol (MCP) server for decompiling Java class files. This server allows AI assistants and tools that implement the MCP protocol to decompile Java bytecode into readable source code.

## Features

- Decompile Java .class files from file path
- Decompile Java classes from package name (e.g., java.util.ArrayList)
- Full MCP-compatible API
- Support for both HTTP and stdio transports
- Clean error handling
- Temporary file management

## Prerequisites

- Node.js 16+ 
- npm
- Java (for the fernflower decompiler to work properly)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-javadc.git
cd mcp-javadc

# Install dependencies
npm install

# Build the TypeScript project
npm run build
```

## Usage

### Quick Start

The easiest way to run the server:

```bash
# Run with the provided script
./run.sh 

# For HTTP mode
./run.sh --http --port 3000
```

### Running as HTTP Server

```bash
# Start with HTTP transport
PORT=3000 MCP_USE_HTTP=true npm start

# Or use the development version
PORT=3000 MCP_USE_HTTP=true npm run dev
```

The server will be available at `http://localhost:3000/mcp`.

### Integrating with MCP Clients

To use with an MCP client (like Claude or another MCP-compatible AI assistant):

```bash
# Configure the MCP client to use this server
npx some-mcp-client --server "node /path/to/mcp-javadc/dist/index.js"
```

Example MCP client configuration:

```json
{
  "mcpServers": {
    "javaDecompiler": {
      "command": "node",
      "args": ["/path/to/mcp-javadc/dist/index.js"],
      "env": {
        "CLASSPATH": "/path/to/java/classes"
      }
    }
  }
}
```

## MCP Tools

The server provides two main tools:

### 1. decompile-from-path

Decompiles a Java .class file from a file path.

Parameters:
- `classFilePath`: Absolute path to the Java .class file

Example request:
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "mcp.tool.execute",
  "params": {
    "tool": "decompile-from-path",
    "args": {
      "classFilePath": "/path/to/Example.class"
    }
  }
}
```

### 2. decompile-from-package

Decompiles a Java class from a package name.

Parameters:
- `packageName`: Fully qualified Java package and class name (e.g., java.util.ArrayList)
- `classpath`: (Optional) Array of classpath directories to search

Example request:
```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "mcp.tool.execute",
  "params": {
    "tool": "decompile-from-package",
    "args": {
      "packageName": "java.util.ArrayList",
      "classpath": ["/path/to/rt.jar", "/path/to/classes"]
    }
  }
}
```

## Configuration

### Environment Variables

- `PORT`: HTTP port number (default: 3000)
- `MCP_USE_HTTP`: Set to "true" to use HTTP transport instead of stdio
- `CLASSPATH`: Java classpath for finding class files (used when no classpath is specified)

## Development

```bash
# Run in development mode (with ts-node)
npm run dev

# Run tests (when implemented)
npm test
```

## How It Works

1. The server uses the fernflower decompiler (a Node.js wrapper around the Java fernflower decompiler)
2. When a decompile request is received, the server:
   - Creates a temporary directory
   - Processes the class file with fernflower
   - Reads the decompiled Java source
   - Returns the formatted source code
   - Cleans up temporary files

## License

ISC