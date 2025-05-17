declare module '@modelcontextprotocol/sdk' {
  export interface McpToolParams {
    [key: string]: unknown;
  }

  export interface McpResponse {
    content: Array<{ type: string; text: string }>;
  }

  export class McpServer {
    constructor(options: { name: string; version: string; description?: string });

    tool(
      name: string,
      parameters: Record<string, unknown>,
      options: {
        description: string;
        execute: (params: McpToolParams) => Promise<McpResponse>;
      }
    ): void;

    connect(transport: Transport): Promise<void>;
  }

  export interface Transport {
    handleRequest?: (req: unknown, res: unknown) => Promise<void>;
  }

  export class StreamableHTTPServerTransport implements Transport {
    constructor();
    handleRequest(req: unknown, res: unknown): Promise<void>;
  }

  export class StdioServerTransport implements Transport {
    constructor();
  }
}
