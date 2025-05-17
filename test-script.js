#!/usr/bin/env node

/**
 * Simple test script for the MCP Java Decompiler server
 * 
 * This script creates a simple Java class, compiles it, and then
 * tests the decompiler server by sending requests to decompile it.
 */

import fs from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';
import os from 'os';

// Create a temporary directory for the test
const tempDir = path.join(os.tmpdir(), `mcp-javadc-test-${Date.now()}`);

async function setupTest() {
  // Create test directory
  await fs.mkdir(tempDir, { recursive: true });
  console.log(`Created test directory: ${tempDir}`);
  
  // Create a simple Java class
  const javaSource = `
public class TestClass {
    private String message;
    
    public TestClass(String message) {
        this.message = message;
    }
    
    public void printMessage() {
        System.out.println(message);
    }
    
    public static void main(String[] args) {
        TestClass test = new TestClass("Hello from TestClass");
        test.printMessage();
    }
}
`;
  
  // Write Java source to file
  const javaFilePath = path.join(tempDir, 'TestClass.java');
  await fs.writeFile(javaFilePath, javaSource);
  console.log(`Created Java file: ${javaFilePath}`);
  
  try {
    // Compile the Java file
    execSync(`javac ${javaFilePath}`, { stdio: 'inherit' });
    console.log('Compiled Java file successfully');
    
    // Verify the class file exists
    const classFilePath = path.join(tempDir, 'TestClass.class');
    await fs.access(classFilePath);
    console.log(`Class file created at: ${classFilePath}`);
    
    return classFilePath;
  } catch (error) {
    console.error('Error compiling Java file:', error.message);
    throw error;
  }
}

async function runTest(classFilePath) {
  // Test the MCP server by sending a decompile request
  // This simulates what an MCP client would send
  
  const request = {
    jsonrpc: '2.0',
    id: '1',
    method: 'mcp.tool.execute',
    params: {
      tool: 'decompile-from-path',
      args: {
        classFilePath
      }
    }
  };
  
  console.log('\nTest request payload:');
  console.log(JSON.stringify(request, null, 2));
  
  console.log('\nTo test with stdio:');
  console.log(`echo '${JSON.stringify(request)}' | node dist/index.js`);
  
  console.log('\nTo test with HTTP server:');
  console.log(`curl -X POST http://localhost:3000/mcp \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(request)}'`);
}

async function cleanup() {
  try {
    // Clean up the test directory
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`\nCleaned up test directory: ${tempDir}`);
  } catch (error) {
    console.error('Error cleaning up:', error.message);
  }
}

// Run the test
async function main() {
  try {
    console.log('=== MCP Java Decompiler Test ===\n');
    
    const classFilePath = await setupTest();
    await runTest(classFilePath);
    
    if (process.argv.includes('--cleanup')) {
      await cleanup();
    } else {
      console.log(`\nTest files left at: ${tempDir}`);
      console.log('Run with --cleanup to remove test files');
    }
    
    console.log('\n=== Test Setup Complete ===');
  } catch (error) {
    console.error('\nTest setup failed:', error);
    process.exit(1);
  }
}

main();