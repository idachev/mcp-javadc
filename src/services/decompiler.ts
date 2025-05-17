import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as crypto from 'crypto';

// Import fernflower module
const fernflower = promisify(require('fernflower'));

/**
 * Service for decompiling Java .class files
 */
export class DecompilerService {
  /**
   * Decompiles a Java class file from a given path
   * 
   * @param classFilePath - Absolute path to the .class file
   * @returns The decompiled Java source code
   */
  async decompileFromPath(classFilePath: string): Promise<string> {
    try {
      // Check if file exists
      await fs.access(classFilePath);
      
      // Create temp output directory
      const tempDir = await this.createTempDir();
      
      try {
        // Run decompiler
        await fernflower(classFilePath, tempDir);
        
        // Get the decompiled file (should be .java file with same name as class)
        const className = path.basename(classFilePath, '.class');
        const javaFilePath = path.join(tempDir, `${className}.java`);
        
        // Read decompiled source
        const sourceCode = await fs.readFile(javaFilePath, 'utf-8');
        return sourceCode;
      } finally {
        // Cleanup temp directory
        await this.cleanupTempDir(tempDir);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decompile class file: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Decompiles a Java class from package name
   * 
   * @param packageName - Fully qualified package and class name (e.g. java.util.ArrayList)
   * @param classpath - Optional array of classpath directories to search
   * @returns The decompiled Java source code
   */
  async decompileFromPackage(packageName: string, classpath: string[] = []): Promise<string> {
    try {
      // Convert package name to file path format
      const classFilePath = await this.findClassFile(packageName, classpath);
      if (!classFilePath) {
        throw new Error(`Could not find class file for package: ${packageName}`);
      }
      
      // Decompile the found class file
      return await this.decompileFromPath(classFilePath);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to decompile package: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Find a class file from a package name in the classpaths
   */
  private async findClassFile(packageName: string, classpath: string[] = []): Promise<string | null> {
    // Convert package name to path format (with .class extension)
    const classPathFormat = packageName.replace(/\./g, path.sep) + '.class';
    
    // Include default classpaths if none specified
    if (classpath.length === 0) {
      // Try to use CLASSPATH environment variable
      const envClasspath = process.env.CLASSPATH;
      if (envClasspath) {
        classpath = envClasspath.split(path.delimiter);
      } else {
        // Use current directory as fallback
        classpath = [process.cwd()];
      }
    }
    
    // Search each classpath for the file
    for (const cp of classpath) {
      const potentialPath = path.join(cp, classPathFormat);
      try {
        await fs.access(potentialPath);
        return potentialPath; // Found it!
      } catch {
        // File not found in this classpath, continue to next
      }
    }
    
    return null; // Not found in any classpath
  }
  
  /**
   * Create a temporary directory for decompiled files
   */
  private async createTempDir(): Promise<string> {
    const tempDir = path.join(
      os.tmpdir(),
      `javadc-${crypto.randomBytes(8).toString('hex')}`
    );
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  }
  
  /**
   * Clean up a temporary directory
   */
  private async cleanupTempDir(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up temporary directory:', error);
    }
  }
}