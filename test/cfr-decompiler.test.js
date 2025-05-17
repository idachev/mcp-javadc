// Test for CFR Java decompiler
import { DecompilerService } from '../dist/services/decompiler.js';
import * as fs from 'fs';
import * as path from 'path';

// Path to test fixtures
const FIXTURES_DIR = path.join(process.cwd(), 'test', 'fixtures');
const TEST_CLASS_PATH = path.join(FIXTURES_DIR, 'SampleClass.class');

/**
 * Check if we have test fixtures
 * If not, output instructions for creating test files
 */
function checkFixtures() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(TEST_CLASS_PATH)) {
    console.error('Test class file not found at:', TEST_CLASS_PATH);
    console.error('\nTo run tests, you need a Java class file for testing:');
    console.error('1. Create a simple Java class:');
    console.error('   echo "public class SampleClass { public static void main(String[] args) { System.out.println(\\"Hello World\\"); } }" > test/fixtures/SampleClass.java');
    console.error('2. Compile it:');
    console.error('   javac -d test/fixtures test/fixtures/SampleClass.java');
    console.error('3. Then run the test again\n');
    process.exit(1);
  }
}

/**
 * Run the decompiler tests
 */
async function runTests() {
  // Check fixtures before starting tests
  checkFixtures();
  
  try {
    const decompiler = new DecompilerService();
    
    console.log('\n--- Testing decompileFromPath ---');
    const decompiled = await decompiler.decompileFromPath(TEST_CLASS_PATH);
    
    // Basic validation of the decompiled source
    console.assert(decompiled.includes('class SampleClass'), 'Decompiled source should contain the class definition');
    console.assert(decompiled.includes('main'), 'Decompiled source should contain the main method');
    
    console.log('✅ Decompiled source contains expected content');
    console.log('Decompiled source snippet:');
    console.log('----------------------------------------');
    // Show just a brief snippet of the decompiled code
    console.log(decompiled.split('\n').slice(0, 10).join('\n') + (decompiled.split('\n').length > 10 ? '\n...' : ''));
    console.log('----------------------------------------');
    
    // If a package name format test is desired, we could also test decompileFromPackage here
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();