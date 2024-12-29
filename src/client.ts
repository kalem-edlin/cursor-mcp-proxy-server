import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { ServerConfig } from './config.js';

const sleep = (time: number) => new Promise<void>(resolve => setTimeout(() => resolve(), time))
export interface ConnectedClient {
  client: Client;
  cleanup: () => Promise<void>;
  name: string;
}

export const createClients = async (servers: ServerConfig[]): Promise<ConnectedClient[]> => {
  const clients: ConnectedClient[] = [];

  for (const server of servers) {
    console.log(`Connecting to server: ${server.name}`);

    let transport: Transport|null = null
    try {
      if (server.transport.type === 'sse') {
          transport = new SSEClientTransport(new URL(server.transport.url));  
      } else {
          transport = new StdioClientTransport({
            command: server.transport.command,
            args: server.transport.args
          });
      }
    } catch (error) {
      console.error(`Failed to create transport ${server.transport.type || 'stdio'} to ${server.name}:`, error);
    }

    if (!transport) {
      console.warn(`Transport ${server.name} not available.`)
      continue
    }

    const client = new Client({
      name: 'mcp-proxy-client',
      version: '1.0.0',
    }, {
      capabilities: {
        prompts: {},
        resources: { subscribe: true },
        tools: {}
      }
    });

    const waitFor = 2500
    const retries = 3
    let count = 0
    let retry = true

    while(retry) {

      try {
        await client.connect(transport);
        console.log(`Connected to server: ${server.name}`);

        clients.push({
          client,
          name: server.name,
          cleanup: async () => {
            await transport.close();
          }
        });

        break

      } catch (error) {
        console.error(`Failed to connect to ${server.name}:`, error);
        count++
        retry = (count < retries)
        if (retry) {
          try {
            await client.close()
          } catch {}
          console.log(`Retry connection to ${server.name} in ${waitFor}ms`);
          await sleep(waitFor)
        }
      }

    }

  }

  return clients;
};
