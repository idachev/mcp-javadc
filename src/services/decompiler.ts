import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as crypto from 'crypto';
import { decompile } from '@run-slicer/cfr';

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

      // Read the class file
      const classData = await fs.readFile(classFilePath);
      
      // Get class name and internal name
      const className = path.basename(classFilePath, '.class');
      const packagePath = path.dirname(classFilePath);
      // Convert file path to package format (approximate)
      const internalName = this.getInternalNameFromPath(classFilePath);

      // Use CFR to decompile
      const decompiled = await decompile(internalName, {
        source: async (name: string) => {
          if (name === internalName) {
            return classData;
          }
          
          // For basic Java language classes, return an empty Buffer
          // This prevents "Could not load the following classes" warnings
          if (name.startsWith('java/lang/')) {
            return Buffer.from([]);
          }
          
          return null; // No other supporting classes provided
        },
        options: {
          // CFR options can be configured here
          "hidelangimports": "true",
          "showversion": "false"
        }
      });

      return decompiled;
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

      // Get internal package name for CFR (replace dots with slashes)
      const internalName = packageName.replace(/\./g, '/');
      
      // Read the class file
      const classData = await fs.readFile(classFilePath);
      
      // Use CFR to decompile
      const decompiled = await decompile(internalName, {
        source: async (name: string) => {
          if (name === internalName) {
            return classData;
          }
          
          // For basic Java language classes, return an empty Buffer
          // This prevents "Could not load the following classes" warnings
          if (name.startsWith('java/lang/')) {
            return Buffer.from([]);
          }
          
          return null; // No other supporting classes provided
        },
        options: {
          // CFR options can be configured here
          "hidelangimports": "true",
          "showversion": "false"
        }
      });

      return decompiled;
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
  private async findClassFile(
    packageName: string,
    classpath: string[] = []
  ): Promise<string | null> {
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
   * Attempts to convert a file path to a Java internal name format
   * Example: /path/to/com/example/MyClass.class -> com/example/MyClass
   */
  private getInternalNameFromPath(classFilePath: string): string {
    // Get the filename without extension
    const className = path.basename(classFilePath, '.class');
    
    // Attempt to find package structure in path
    const pathParts = classFilePath.split(path.sep);
    const classNameIndex = pathParts.findIndex(part => part === className + '.class');
    
    if (classNameIndex <= 0) {
      // If we can't determine package structure, just return the class name
      return className;
    }
    
    // Look backward to find potential package parts
    // This is a heuristic and may not always be correct
    let packageParts: string[] = [];
    let i = classNameIndex - 1;
    
    // This logic attempts to identify package parts by looking for lowercase directory names
    // This is an imperfect heuristic but better than nothing
    while (i >= 0) {
      const part = pathParts[i];
      // Common Java package naming patterns (lowercase, may contain dots)
      if (/^[a-z][a-z0-9_.]*$/.test(part)) {
        packageParts.unshift(part);
      } else {
        // Once we hit something that doesn't look like a package part, stop
        break;
      }
      i--;
    }
    
    // Combine package parts with the class name
    if (packageParts.length > 0) {
      return packageParts.join('/') + '/' + className;
    }
    
    return className;
  }
}