#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import http from 'http';

// First, create a simple MCP server using the compiled code
const server = spawn('node', ['dist/index.js'], {
  env: { ...process.env, MCP_USE_HTTP: 'true', PORT: '3000' },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Output server logs
server.stdout.on('data', data => {
  console.log(`Server stdout: ${data}`);
});

server.stderr.on('data', data => {
  console.log(`Server stderr: ${data}`);
});

// Path to the test Java class
const classFilePath = '/tmp/mcp-javadc-test-1747502338041/TestClass.class';

// Wait for server to start
setTimeout(() => {
  // Make sure the test class file exists
  if (!fs.existsSync(classFilePath)) {
    console.error(`Test class file not found: ${classFilePath}`);
    console.error('Run npm run test:setup first to create the test class');
    server.kill();
    process.exit(1);
  }

  // Make a request to the server
  const reqData = JSON.stringify({
    jsonrpc: '2.0',
    id: '1',
    method: 'mcp.tool.execute',
    params: {
      tool: 'decompile-from-path',
      args: {
        classFilePath
      }
    }
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(reqData)
    }
  };

  const req = http.request(options, res => {
    console.log(`Response status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', chunk => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:');
      try {
        const parsed = JSON.parse(responseData);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(responseData);
      }
      
      // Kill the server
      server.kill();
      process.exit(0);
    });
  });

  req.on('error', error => {
    console.error(`Request error: ${error.message}`);
    server.kill();
    process.exit(1);
  });

  // Send the request
  req.write(reqData);
  req.end();
}, 1000); // Wait 1 second for the server to start