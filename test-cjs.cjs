#!/usr/bin/env node

/**
 * Test script for the CommonJS server
 */

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

// Path to test class from our setup script
const classFilePath = '/tmp/mcp-javadc-test-1747502338041/TestClass.class';

// Start server as a child process
console.log('Starting MCP server in HTTP mode...');
const server = spawn('node', ['server.cjs', '--http', '--port', '3000'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

// Wait for server to start
setTimeout(() => {
  // Make sure the test class file exists
  if (!fs.existsSync(classFilePath)) {
    console.error(`Test class file not found: ${classFilePath}`);
    console.error('Run npm run test:setup first to create the test class');
    server.kill();
    process.exit(1);
  }

  console.log(`\nSending decompile request for: ${classFilePath}`);
  
  // Prepare request data
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

  // Send HTTP request
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

  const req = http.request(options, (res) => {
    console.log(`Response status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('\nResponse:');
      try {
        const parsed = JSON.parse(responseData);
        console.log(JSON.stringify(parsed, null, 2));
        
        // Check if result contains decompiled code
        if (parsed.result && 
            parsed.result.content && 
            parsed.result.content[0] && 
            parsed.result.content[0].text &&
            parsed.result.content[0].text.includes('class TestClass')) {
          console.log('\n✅ TEST PASSED: Successfully decompiled Java class\n');
        } else {
          console.log('\n❌ TEST FAILED: Decompilation result did not contain expected content\n');
        }
      } catch (e) {
        console.log(responseData);
        console.log('\n❌ TEST FAILED: Invalid JSON response\n');
      }
      
      // Kill the server
      server.kill();
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error(`\n❌ TEST FAILED: ${error.message}\n`);
    server.kill();
    process.exit(1);
  });

  // Send the request
  req.write(reqData);
  req.end();
}, 1000); // Wait 1 second for the server to start