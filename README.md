# MCP Java Decompiler Server (v1.2.3)

A Model Context Protocol (MCP) server for decompiling Java class files. This server allows AI assistants and tools that implement the MCP protocol to decompile Java bytecode into readable source code.

## Features

- Decompile Java .class files from file path
- Decompile Java classes from package name (e.g., java.util.ArrayList)
- Decompile Java classes from JAR files
- Specify which class to extract from JAR files
- Full MCP-compatible API
- Stdio transport for seamless integration
- Clean error handling
- Temporary file management

## Prerequisites

- Node.js 16+ 
- npm
- No Java requirement (using JavaScript port of CFR decompiler)

## Installation

### Option 1: Using npx (Recommended)

You can run the server directly with npx without installing:

```bash
# Run the server
npx -y @idachev/mcp-javadc
```


### Option 2: Global Installation

```bash
# Install globally
npm install -g @idachev/mcp-javadc

# Run the server
mcpjavadc
```

### Option 3: From Source

```bash
# Clone the repository
git clone https://github.com/idachev/mcp-javadc.git
cd mcp-javadc

# Install dependencies
npm install

# Run the server
npm start
```

## Usage

### Quick Start

The easiest way to run the server:

```bash
npm start
```

### Integrating with MCP Clients

To use with an MCP client (like Claude or another MCP-compatible AI assistant):

```bash
# Configure the MCP client to use this server
npx some-mcp-client --server "node /path/to/mcp-javadc/index.js"
```

Example MCP client configuration:

```json
{
  "mcpServers": {
    "javaDecompiler": {
      "command": "npx",
      "args": ["-y", "@idachev/mcp-javadc"],
      "env": {
        "CLASSPATH": "/path/to/java/classes"
      }
    }
  }
}
```

## MCP Tools

The server provides three main tools:

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

### 3. decompile-from-jar

Decompiles a Java class from a JAR file.

Parameters:
- `jarFilePath`: Absolute path to the JAR file (required)
- `className`: Fully qualified class name to extract from the JAR (required) (e.g., "com.example.MyClass")

Example request:
```json
{
  "jsonrpc": "2.0",
  "id": "3",
  "method": "mcp.tool.execute",
  "params": {
    "tool": "decompile-from-jar",
    "args": {
      "jarFilePath": "/path/to/example.jar",
      "className": "com.example.MyClass"
    }
  }
}
```

## Known Issues

### Java Class Decompilation

The CFR decompiler (@run-slicer/cfr) is a JavaScript port of the popular CFR Java decompiler. It works well with:

1. Standard Java class files
2. Classes that are part of a known package structure
3. Modern Java features (up through Java 14)
4. JAR files containing Java classes

If you encounter issues with a specific class file, try:
- Using the `decompile-from-package` tool with explicit classpath
- Using the `decompile-from-jar` tool with explicit class name
- Ensuring the class file is a valid Java bytecode file
- Checking for corrupt class files or JAR archives

### Maven Repository Usage

When working with JAR files from Maven repositories:
- Use the `find ~/.m2 -name "*dependency-name*jar"` command to locate JAR files
- Filter out source and javadoc JARs using `grep -v source | grep -v javadoc`
- Use `jar tf your-jar-file.jar | grep .class` to list available classes in a JAR
- Check that class names match the package structure in the JAR


## Configuration

### Environment Variables

- `CLASSPATH`: Java classpath for finding class files (used when no classpath is specified)

## Development

```bash
# Run in development mode
npm run dev

# Create test fixtures (creates sample Java class for testing)
npm run test:setup

# Run tests 
npm test

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Run with MCP Inspector for interactive testing
npx @modelcontextprotocol/inspector node ./index.js
```

## Testing with MCP Inspector

You can use the official MCP Inspector tool to test the server functionality interactively:

```bash
# Install and run the MCP Inspector with the decompiler server
npx @modelcontextprotocol/inspector node ./index.js
```

The Inspector provides a user-friendly web interface that allows you to:
- List all available tools
- Execute the decompilation tools with custom parameters
- View and explore the decompiled output
- Test different inputs and error scenarios

This is especially useful for debugging and understanding the MCP server's capabilities before integrating it with other applications.

## How It Works

1. The server uses the CFR decompiler (@run-slicer/cfr - a JavaScript port of the popular CFR Java decompiler)
2. When a decompile request is received, the server:
   - Reads the class file data directly or extracts it from a JAR file
   - Processes the class file with CFR decompiler
   - Returns the formatted source code
3. For JAR files, the server:
   - Creates a temporary directory for extraction
   - Extracts the JAR contents
   - Decompiles the specified class (or first class if none specified)
   - Cleans up the temporary directory

## License

ISC
