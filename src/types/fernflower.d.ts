declare module 'fernflower' {
  type DecompileCallback = (error: Error | null, result?: string) => void;

  /**
   * Decompiles a Java class file
   *
   * @param inputPath - Path to the class file or jar to decompile
   * @param outputDir - Directory to output the decompiled source
   * @param callback - Callback function when decompilation completes
   */
  function fernflower(inputPath: string, outputDir: string, callback: DecompileCallback): void;

  export default fernflower;
}
