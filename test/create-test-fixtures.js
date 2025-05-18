import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const FIXTURES_DIR = path.join(process.cwd(), 'test', 'fixtures');
const SAMPLE_JAVA_PATH = path.join(FIXTURES_DIR, 'SampleClass.java');
const TEST_CLASS_PATH = path.join(FIXTURES_DIR, 'SampleClass.class');
const TEST_JAR_PATH = path.join(FIXTURES_DIR, 'SampleClass.jar');
const MANIFEST_PATH = path.join(FIXTURES_DIR, 'MANIFEST.MF');

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

const MANIFEST_CONTENT = `Manifest-Version: 1.0
Main-Class: SampleClass
`;

function createFixtures() {
  console.log('Creating test fixtures...');

  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    console.log(`Created directory: ${FIXTURES_DIR}`);
  }

  fs.writeFileSync(SAMPLE_JAVA_PATH, SAMPLE_JAVA_CODE);
  console.log(`Created sample Java file: ${SAMPLE_JAVA_PATH}`);

  try {
    console.log('Attempting to compile Java file...');
    execSync(`javac -d ${FIXTURES_DIR} ${SAMPLE_JAVA_PATH}`);
    console.log(`Successfully compiled to: ${TEST_CLASS_PATH}`);

    fs.writeFileSync(MANIFEST_PATH, MANIFEST_CONTENT);
    console.log(`Created manifest file: ${MANIFEST_PATH}`);

    try {
      console.log('Creating JAR file...');

      execSync(`jar cfm ${TEST_JAR_PATH} ${MANIFEST_PATH} -C ${FIXTURES_DIR} SampleClass.class`);

      console.log(`Successfully created JAR file: ${TEST_JAR_PATH}`);

    } catch (jarError) {

      console.error('Could not create JAR file. You may need to install JDK or create it manually.');
      console.error(`Error: ${jarError.message}`);

      if (!fs.existsSync(TEST_JAR_PATH)) {

        fs.writeFileSync(TEST_JAR_PATH, 'PLACEHOLDER_JAR_FILE');
        console.log(`Created placeholder JAR file: ${TEST_JAR_PATH}`);

        console.log(
          'NOTE: This is not a valid JAR file. Tests will run but will likely fail.'
        );
      }
    }

  } catch (error) {

    console.error(
      'Could not compile Java file. You may need to install JDK or compile it manually.'
    );

    console.error(`Error: ${error.message}`);

    if (!fs.existsSync(TEST_CLASS_PATH)) {
      fs.writeFileSync(TEST_CLASS_PATH, 'PLACEHOLDER_CLASS_FILE');
      console.log(`Created placeholder class file: ${TEST_CLASS_PATH}`);

      console.log(
        'NOTE: This is not a valid Java class file. Tests will run but will likely fail.'
      );
    }

    if (!fs.existsSync(TEST_JAR_PATH)) {
      fs.writeFileSync(TEST_JAR_PATH, 'PLACEHOLDER_JAR_FILE');
      console.log(`Created placeholder JAR file: ${TEST_JAR_PATH}`);
    }
  }

  console.log('Fixture creation completed.');
}

export { createFixtures };

if (import.meta.url === `file://${process.argv[1]}`) {
  createFixtures();
}
