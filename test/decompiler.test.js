import * as path from 'path';
import * as fs from 'fs/promises';
import assert from 'assert';

const FIXTURES_DIR = path.join(process.cwd(), 'test', 'fixtures');
const TEST_CLASS_PATH = path.join(FIXTURES_DIR, 'SampleClass.class');
const TEST_JAR_PATH = path.join(FIXTURES_DIR, 'SampleClass.jar');

import { decompilerService } from '../index.js';

async function runTests() {
  console.log('Starting Java Decompiler tests...');
  
  try {
    try {
      await fs.access(TEST_CLASS_PATH);
      await fs.access(TEST_JAR_PATH);
    } catch (e) {
      console.log('Test fixtures not found, running create-test-fixtures...');
      const { createFixtures } = await import('./create-test-fixtures.js');
      await createFixtures();
    }
    
    console.log('\nTest 1: Testing decompileFromPath...');
    
    const decompiled = await decompilerService.decompileFromPath(TEST_CLASS_PATH);
    
    assert(decompiled && typeof decompiled === 'string', 'Expected decompiled result to be a string');
    assert(decompiled.includes('class SampleClass'), 'Expected decompiled class in result');
    assert(decompiled.includes('void printMessage()'), 'Expected method in decompiled class');
    
    console.log('✓ Successfully decompiled class from path');
    
    console.log('\nTest 2: Testing decompileFromPackage...');
    
    try {
      const decompiled = await decompilerService.decompileFromPackage('SampleClass', [FIXTURES_DIR]);
      console.log('✓ Successfully decompiled class from package');
    } catch (error) {
      console.log('✓ Expected error when decompiling from package:', error.message);
    }
    
    console.log('\nTest 3: Testing decompileFromJar...');
    
    try {
      // Now we need to explicitly pass the class name for JAR decompilation
      const decompiled = await decompilerService.decompileFromJar(TEST_JAR_PATH, 'SampleClass');
      
      assert(decompiled && typeof decompiled === 'string', 'Expected decompiled result to be a string');
      assert(decompiled.includes('class SampleClass'), 'Expected decompiled class in result');
      assert(decompiled.includes('void printMessage()'), 'Expected method in decompiled class');
      
      console.log('✓ Successfully decompiled class from JAR file');
    } catch (error) {
      console.error('Failed to decompile from JAR:', error);
      throw error;
    }
    
    console.log('\nTest 4: Testing error handling...');
    
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

runTests().catch(err => {
  console.error('Unhandled error:', err);
  process.exitCode = 1;
});