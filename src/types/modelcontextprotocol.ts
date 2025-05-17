// Type definitions for the MCP SDK

export interface McpToolParams {
  classFilePath?: string;
  packageName?: string;
  classpath?: string[];
  [key: string]: unknown;
}

export interface McpResponse {
  content: Array<{ type: string; text: string }>;
}

export interface Transport {
  handleRequest?: (req: unknown, res: unknown) => Promise<void>;
}