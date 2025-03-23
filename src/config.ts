import dotenv from 'dotenv';
import * as fs from 'fs';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';


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
    const clientConfigPath = process.env.CLIENT_CONFIG_DIRECTORY;
    
    if (!clientConfigPath) {
      throw new Error(`CLIENT_CONFIG_DIRECTORY is not set`);
    }
    
    const absoluteClientPath = resolve(process.cwd(), clientConfigPath);
    
    if (!fs.existsSync(absoluteClientPath)) {
      throw new Error(`CLIENT_CONFIG_DIRECTORY does not exist: ${absoluteClientPath}`);
    }
    
    const isDirectory = fs.statSync(absoluteClientPath).isDirectory();
    if (!isDirectory) {
      throw new Error(`CLIENT_CONFIG_DIRECTORY is not a directory: ${absoluteClientPath}`);
    }
    
    const envFilePath = join(absoluteClientPath, '.env');
    if (fs.existsSync(envFilePath)) {
      dotenv.config({ path: envFilePath });
    }
    
    const mcpConfigPath = join(absoluteClientPath, 'mcp', 'config.json');
    
    if (!fs.existsSync(mcpConfigPath)) {
      throw new Error(`Required config file not found at ${mcpConfigPath}`);
    }
    
    console.log(`Loading MCP config from ${mcpConfigPath}`);
    const fileContents = await readFile(mcpConfigPath, 'utf-8');
    return JSON.parse(fileContents);
    
  } catch (error) {
    console.error('Error loading config:', error);
    throw error;
  }
};