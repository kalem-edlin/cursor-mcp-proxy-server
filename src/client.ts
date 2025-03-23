import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { ServerConfig } from './config.js';
import { DegradedClient } from './degraded-client.js';

const noopTransport: Transport = {
  start() { return Promise.resolve() },
  send() { return Promise.resolve() },
  close() { return Promise.resolve() },
  onmessage() { },
  onclose() { },
  onerror() { }
}

const sleep = (time: number) => new Promise<void>(resolve => setTimeout(() => resolve(), time))

export interface ConnectedClient {
  client: Client;
  cleanup: () => Promise<void>;
  name: string;
  allowedTools?: string[]; // Optional list of allowed tool names for this clien
}

const createClient = (server: ServerConfig): { client: Client | undefined, transport: Transport | undefined } => {
  if (!server.transport) {
    console.error(`Missing transport configuration for server: ${server.name}`);
    return { client: undefined, transport: undefined };
  }

  // Check for missing env variables and create a degraded client if any are missing - to inform the MCP user that the potential server is degraded
  if (server.transport.type !== 'sse' && server.transport.env) {
    const missingEnvVars = server.transport.env.filter(v => !process.env[v]);
    if (missingEnvVars.length > 0) {
      console.warn(`Server ${server.name} is missing required env variables: ${missingEnvVars.join(', ')}`);
      const degradedClient = new DegradedClient(server, missingEnvVars);
      return { client: degradedClient, transport: noopTransport };
    }
  }

  let transport: Transport | null = null;
  try {
    if (server.transport.type === 'sse') {
      transport = new SSEClientTransport(new URL(server.transport.url));
    } else {
      const scopedEnv = server.transport.env ? server.transport.env.reduce((o, v) => ({
        ...o,
        [v]: process.env[v] || ''
      }), {}) : {}
      

      transport = new StdioClientTransport({
        command: server.transport.command,
        args: server.transport.args,
        env: {
          PATH: process.env.PATH || '',
          ...scopedEnv
        }
      });
    }
  } catch (error) {
    console.error(`Failed to create transport ${server.transport.type || 'stdio'} to ${server.name}:`, error);
  }

  if (!transport) {
    console.warn(`Transport ${server.name} not available.`)
    return { transport: undefined, client: undefined }
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

  return { client, transport }
}

export const createClients = async (servers: ServerConfig[]): Promise<ConnectedClient[]> => {
  const clients: ConnectedClient[] = [];

  for (const server of servers) {
    console.log(`Connecting to server: ${server.name}`);

    const waitFor = 2500
    const retries = process.env.CLIENT_CONNECT_RETRIES ? parseInt(process.env.CLIENT_CONNECT_RETRIES) : 1
    let count = 0
    let retry = true

    while (retry) {

      const { client, transport } = createClient(server)
      if (!client || !transport) {
        break
      }

      try {
        await client.connect(transport);
        console.log(`Connected to server: ${server.name}${server.allowedTools ? ` with scoped tools: ${server.allowedTools}` : ''}`);

        clients.push({
          client,
          name: server.name,
          allowedTools: server.allowedTools,
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
          } catch { }
          console.log(`Retry connection to ${server.name} in ${waitFor}ms (${count}/${retries})`);
          await sleep(waitFor)
        }
      }

    }

  }

  return clients;
};
