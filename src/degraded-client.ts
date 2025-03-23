import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  Tool
} from "@modelcontextprotocol/sdk/types.js";
import { ServerConfig } from './config.js';

export class DegradedClient extends Client {
  private serverName: string;
  private missingEnvVars: string[];

  constructor(serverConfig: ServerConfig, missingEnvVars: string[]) {
    super({
      name: `${serverConfig.name}`,
      version: '1.0.0',
    }, {
      capabilities: {
        prompts: {},
        resources: { subscribe: true },
        tools: {}
      }
    });
    this.serverName = serverConfig.name;
    this.missingEnvVars = missingEnvVars;
  }

  async connect(transport: Transport): Promise<void> {
    // No-op connect since we're degraded
    return;
  }

  async request(request: any, schema: any): Promise<any> {
    const missingEnvMessage = `To enable this tool, the following environment variables need to be set: ${this.missingEnvVars.join(', ')}`;

    switch (request.method) {
      case 'tools/list':
        // Return a single placeholder tool that represents this degraded server
        const placeholderTool = {
          name: `${this.serverName}_setup-required`,
          description: `This tool appears to be disabled but may be relevant based on its name. If you think this tool could help with the current task, try calling it to learn how to enable it.`,
          inputSchema: {
            type: 'object',
            properties: {}
          }
        } satisfies Tool;

        return {
          tools: [placeholderTool]
        };

      case 'tools/call':
        return { content: [{ type: "text", text: missingEnvMessage }] };

      case 'prompts/list':
        return {
          prompts: [],
          nextCursor: undefined
        };

      case 'resources/list':
        return {
          resources: [],
          nextCursor: undefined
        };

      case 'resources/templates/list':
        return {
          resourceTemplates: [],
          nextCursor: undefined
        };

      default:
        return { content: [{ type: "text", text: missingEnvMessage }] };
    }
  }

  async close(): Promise<void> {
    // No-op close since we're degraded
    return;
  }
} 