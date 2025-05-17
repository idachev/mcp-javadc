// Script to create test fixtures
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Path to test fixtures
const FIXTURES_DIR = path.join(process.cwd(), 'test', 'fixtures');
const SAMPLE_JAVA_PATH = path.join(FIXTURES_DIR, 'SampleClass.java');
const TEST_CLASS_PATH = path.join(FIXTURES_DIR, 'SampleClass.class');

// Sample Java class content
const SAMPLE_JAVA_CODE = `
public class SampleClass {
    private String message;
    
    public SampleClass() {
        this("Default Message");
    }
    
    public SampleClass(String message) {
        this.message = message;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public void printMessage() {
        System.out.println(message);
    }
    
    public static void main(String[] args) {
        SampleClass sample = new SampleClass("Hello from Java!");
        sample.printMessage();
    }
}
`;

/**
 * Create test fixtures for decompiler tests
 */
function createFixtures() {
  console.log('Creating test fixtures...');

  // Create fixtures directory if it doesn't exist
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    console.log(`Created directory: ${FIXTURES_DIR}`);
  }

  // Create sample Java file
  fs.writeFileSync(SAMPLE_JAVA_PATH, SAMPLE_JAVA_CODE);
  console.log(`Created sample Java file: ${SAMPLE_JAVA_PATH}`);

  // Try to compile using javac if available
  try {
    console.log('Attempting to compile Java file...');
    execSync(`javac -d ${FIXTURES_DIR} ${SAMPLE_JAVA_PATH}`);
    console.log(`Successfully compiled to: ${TEST_CLASS_PATH}`);
  } catch (error) {
    console.error(
      'Could not compile Java file. You may need to install JDK or compile it manually.'
    );
    console.error(`Error: ${error.message}`);

    // Create a placeholder .class file with some content so tests can at least be run
    if (!fs.existsSync(TEST_CLASS_PATH)) {
      // This is not a valid class file, but it's just a placeholder for testing
      fs.writeFileSync(TEST_CLASS_PATH, 'PLACEHOLDER_CLASS_FILE');
      console.log(`Created placeholder class file: ${TEST_CLASS_PATH}`);
      console.log(
        'NOTE: This is not a valid Java class file. Tests will run but will likely fail.'
      );
    }
  }

  console.log('Fixture creation completed.');
}

// Export the createFixtures function
export { createFixtures };

// Run the fixture creation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createFixtures();
}
