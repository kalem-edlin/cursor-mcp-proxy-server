# MCP Proxy Server - Cursor specific fork

A Model Context Protocol (MCP) proxy server that solves three key limitations in Cursor's MCP implementation:
1. The 40-tool limit per server
2. Suboptimal environment variable management
3. Lack of mcp workspace configuration (when different projects require different sets of tools)

This is done with a solution that can:

- Connect to and manage multiple MCP resource servers
- Expose their combined capabilities through a unified interface
- Handle routing of requests to appropriate backend servers
- Aggregate responses from multiple sources
- Filter tools based on allowedTools
- Degrade with visibility into required environment variables

## Features

### Resource Management
- Discover and connect to multiple MCP resource servers
- Aggregate resources from all connected servers
- Maintain consistent URI schemes across servers
- Handle resource routing and resolution

### Tool Aggregation
- Expose tools from all connected servers
- Route tool calls to appropriate backend servers
- Maintain tool state and handle responses

### Prompt Handling
- Aggregate prompts from all connected servers
- Route prompt requests to appropriate backends
- Handle multi-server prompt responses

## Configuration

The server requires a JSON configuration file that specifies the MCP servers to connect to. Copy the example config and modify it for your needs:

```bash
cp config.example.json config.json
```

Example config structure:
```json
{
  "servers": [
    {
      "name": "Server 1",
      "transport": {
        "command": "/path/to/server1/build/index.js"
      },
      "allowedTools": ["tool1", "tool2"]
    },
    {
      "name": "Server 2",
      "transport": {
        "command": "server2-command",
        "args": ["--option1", "value1"],
        "env": ["SECRET_API_KEY"]
      }
    },
    {
      "name": "Example Server 3",
      "transport": {
        "type": "sse",
        "url": "http://localhost:8080/sse"
      },
    }
  ]
}
```

The config file must be provided when running the server:
```bash
MCP_CONFIG_PATH=./config.json mcp-proxy-server
```

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

For development with continuous run:
```bash
# Stdio
npm run dev
# SSE
npm run dev:sse
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-proxy": {
      "command": "npx cursor-mcp-proxy-server",
      "env": {
        "CLIENT_CONFIG_DIRECTORY": "/absolute/path/to/your/project/.cursor",
        "MCP_CONFIG_PATH": "./config.json",
        "CLIENT_CONNECT_RETRIES": "3",
        "KEEP_SERVER_OPEN": "1"
      }
    }
  }
}
```

- `KEEP_SERVER_OPEN` will keep the SSE running even if a client disconnects. Useful when multiple clients connects to the MCP proxy.

### Environment Variables

The following environment variables can be configured:

- `KEEP_SERVER_OPEN`: When set to "1", keeps the SSE server running even if a client disconnects
- `CLIENT_CONNECT_RETRIES`: Controls the number of retry attempts when connecting to MCP servers (default: 1)
- `CLIENT_CONFIG_DIRECTORY`: Specifies the directory containing configuration files and environment variables
- `MCP_CONFIG_PATH`: Specifies the path to the MCP config file relative to the `CLIENT_CONFIG_DIRECTORY` (default: `./config.json`)

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
