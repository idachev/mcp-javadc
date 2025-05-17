declare module '@modelcontextprotocol/sdk' {
  export class McpServer {
    constructor(options: { name: string; version: string; description?: string });
    
    tool(
      name: string,
      parameters: any,
      options: {
        description: string;
        execute: (params: any) => Promise<{
          content: Array<{ type: string; text: string }>;
        }>;
      }
    ): void;
    
    connect(transport: any): Promise<void>;
  }
  
  export class StreamableHTTPServerTransport {
    constructor();
    handleRequest(req: any, res: any): Promise<void>;
  }
  
  export class StdioServerTransport {
    constructor();
  }
}