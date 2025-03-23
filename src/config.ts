import { readFile } from 'fs/promises';
import { resolve } from 'path';


export type TransportConfigStdio = {
  type?: 'stdio'
  command: string;
  args?: string[];
  env?: string[]
}

export type TransportConfigSSE = {
  type: 'sse'
  url: string
}

export type TransportConfig = TransportConfigSSE | TransportConfigStdio
export interface ServerConfig {
  name: string;
  transport: TransportConfig;
}

export interface Config {
  servers: ServerConfig[];
}

export const loadConfig = async (): Promise<Config> => {
  try {
    const configPath = resolve(process.cwd(), 'config.json');
    const fileContents = await readFile(configPath, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error loading config.json:', error);
    // Return empty config if file doesn't exist
    return { servers: [] };
  }
}; 