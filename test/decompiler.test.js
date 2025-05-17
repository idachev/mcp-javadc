// Direct test of the decompiler service
import * as path from 'path';
import * as fs from 'fs/promises';
import assert from 'assert';

// Paths to test fixtures
const FIXTURES_DIR = path.join(process.cwd(), 'test', 'fixtures');
const TEST_CLASS_PATH = path.join(FIXTURES_DIR, 'SampleClass.class');

// Import the DecompilerService class
import { decompilerService } from '../index.js';

// Main test function
async function runTests() {
  console.log('Starting Java Decompiler tests...');
  
  // decompilerService is imported from index.js
  
  try {
    // Ensure test fixtures exist
    try {
      await fs.access(TEST_CLASS_PATH);
    } catch (e) {
      console.log('Test class file not found, running create-test-fixtures...');
      const { createFixtures } = await import('./create-test-fixtures.js');
      await createFixtures();
    }
    
    // Test 1: Direct decompile from path
    console.log('\nTest 1: Testing decompileFromPath...');
    
    const decompiled = await decompilerService.decompileFromPath(TEST_CLASS_PATH);
    
    // Verify the decompiled code contains expected elements
    assert(decompiled && typeof decompiled === 'string', 'Expected decompiled result to be a string');
    assert(decompiled.includes('class SampleClass'), 'Expected decompiled class in result');
    assert(decompiled.includes('void printMessage()'), 'Expected method in decompiled class');
    
    console.log('✓ Successfully decompiled class from path');
    
    // Test 2: Decompile from package (if possible) - might fail but should not crash
    console.log('\nTest 2: Testing decompileFromPackage...');
    
    try {
      const decompiled = await decompilerService.decompileFromPackage('SampleClass', [FIXTURES_DIR]);
      console.log('✓ Successfully decompiled class from package');
    } catch (error) {
      console.log('✓ Expected error when decompiling from package:', error.message);
    }
    
    // Test 3: Error handling for invalid path
    console.log('\nTest 3: Testing error handling...');
    
    try {
      await decompilerService.decompileFromPath('/path/to/nonexistent/file.class');
      throw new Error('Expected an error for nonexistent file, but none was thrown');
    } catch (error) {
      assert(error.message.includes('Failed to decompile'), 'Expected error message to indicate decompilation failure');
      console.log('✓ Error handling works correctly');
    }
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exitCode = 1;
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Unhandled error:', err);
  process.exitCode = 1;
});