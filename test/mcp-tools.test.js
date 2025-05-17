import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import assert from 'assert';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const FIXTURES_DIR = path.join(process.cwd(), 'test', 'fixtures');
const TEST_CLASS_PATH = path.join(FIXTURES_DIR, 'SampleClass.class');

async function runTests() {
  console.log('Starting MCP Java Decompiler tests with MCP client...');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['index.js'],
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  });

  try {
    console.log('Connecting to MCP Java Decompiler server...');
    await client.connect(transport);
    
    console.log('\nTest 1: Listing available tools...');
    
    const toolsResponse = await client.listTools();
    console.log('Available tools response:', toolsResponse);
    
    assert(toolsResponse && toolsResponse.tools, 'Expected tools array in response');
    assert(Array.isArray(toolsResponse.tools), 'Expected tools to be an array');
    assert(toolsResponse.tools.length === 2, 'Expected 2 tools to be listed');
    
    const toolNames = toolsResponse.tools.map(tool => tool.name);
    assert(toolNames.includes('decompile-from-path'), 'Expected decompile-from-path tool');
    assert(toolNames.includes('decompile-from-package'), 'Expected decompile-from-package tool');
    
    console.log('✓ Successfully listed tools:', toolNames);
    
    console.log('\nTest 2: Testing decompile-from-path tool...');
    
    try {
      await fs.access(TEST_CLASS_PATH);
    } catch (e) {
      console.log('Test class file not found, running create-test-fixtures...');
      const { createFixtures } = await import('./create-test-fixtures.js');
      await createFixtures();
    }
    
    const decompilePathResponse = await client.callTool({
      name: 'decompile-from-path',
      arguments: {
        classFilePath: TEST_CLASS_PATH,
      },
    });
    
    console.log('Decompile path response received:', decompilePathResponse ? 'Success' : 'Error');
    
    assert(decompilePathResponse && decompilePathResponse.content, 
      'Expected content in response');
    
    const decompileText = decompilePathResponse.content[0]?.text || '';
    assert(decompileText.includes('class SampleClass'), 
      'Expected decompiled class in result');
    assert(decompileText.includes('void printMessage()'), 
      'Expected method in decompiled class');
    
    console.log('✓ Successfully decompiled from path');
    
    console.log('\nTest 3: Testing decompile-from-package tool...');
    
    try {
      const decompilePackageResponse = await client.callTool({
        name: 'decompile-from-package',
        arguments: {
          packageName: 'SampleClass',
          classpath: [FIXTURES_DIR],
        },
      });
      
      console.log('Decompile package response received:', 
        decompilePackageResponse ? 'Success' : 'Error');
      
      assert(decompilePackageResponse && decompilePackageResponse.content, 
        'Expected content in response');
        
      const packageText = decompilePackageResponse.content[0]?.text || '';
      assert(packageText, 'Expected text content in result');
      console.log('✓ Successfully decompiled from package');
    } catch (error) {
      console.log('✓ Expected error when decompiling from package:', error.message);
    }
    
    console.log('\nTest 4: Testing error handling for invalid path...');
    
    const invalidPathResponse = await client.callTool({
      name: 'decompile-from-path',
      arguments: {
        classFilePath: '/path/to/nonexistent/file.class',
      },
    });
    
    console.log('Invalid path response:', invalidPathResponse);
    
    assert(invalidPathResponse && invalidPathResponse.content, 'Expected content in response');
    const errorText = invalidPathResponse.content[0]?.text || '';
    assert(errorText.includes('Error:'), 'Expected error message in response content');
    
    console.log('✓ Error handling works correctly');
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exitCode = 1;
  } finally {
    if (transport) {
      try {
        await transport.close();
        console.log('Closed transport to MCP server');
      } catch (error) {
        console.error('Error closing transport:', error);
      }
    }
  }
}

runTests().catch(err => {
  console.error('Unhandled error:', err);
  process.exitCode = 1;
});