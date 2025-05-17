#!/usr/bin/env node

/**
 * Direct test of decompilation functionality
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { promisify } = require('util');

const fernflower = require('fernflower');

// Path to test class from our setup script
const classFilePath = '/tmp/mcp-javadc-test-1747502338041/TestClass.class';

// Create a temp directory for output
async function createTempDir() {
  const tempDir = path.join(os.tmpdir(), `javadc-test-${crypto.randomBytes(8).toString('hex')}`);
  await fs.promises.mkdir(tempDir, { recursive: true });
  return tempDir;
}

// Main test function
async function test() {
  console.log('Testing direct decompilation of Java class file\n');
  
  // Make sure the test class file exists
  if (!fs.existsSync(classFilePath)) {
    console.error(`Test class file not found: ${classFilePath}`);
    console.error('Run npm run test:setup first to create the test class');
    process.exit(1);
  }
  
  // Create temp directory
  const tempDir = await createTempDir();
  console.log(`Created temp directory: ${tempDir}`);
  
  try {
    // Run decompiler - which expects a callback
    console.log(`Decompiling: ${classFilePath}`);
    
    fernflower(classFilePath, tempDir, (err, result) => {
      if (err) {
        console.error(`❌ ERROR: Failed to decompile: ${err.message}`);
        process.exit(1);
      }
      
      // Get the decompiled file (should be .java file with same name as class)
      const className = path.basename(classFilePath, '.class');
      const javaFilePath = path.join(tempDir, `${className}.java`);
      
      // Check if the file exists
      if (!fs.existsSync(javaFilePath)) {
        console.error(`❌ ERROR: Decompiled file not found: ${javaFilePath}`);
        console.log('Files in output directory:');
        console.log(fs.readdirSync(tempDir));
        process.exit(1);
      }
      
      // Read decompiled source
      const sourceCode = fs.readFileSync(javaFilePath, 'utf-8');
      console.log('\nDecompiled Source:');
      console.log('----------------------------------------');
      console.log(sourceCode);
      console.log('----------------------------------------');
      
      // Success!
      console.log('\n✅ TEST PASSED: Successfully decompiled Java class\n');
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
test();