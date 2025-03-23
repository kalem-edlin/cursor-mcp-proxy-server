#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./mcp-proxy.js";

async function main() {
  const transport = new StdioServerTransport();
  const { server, cleanup } = await createServer();

  await server.connect(transport);

  const handleExit = async () => {
    await cleanup();
    await transport.close();
    await server.close();
    process.exit(0);
  };

  // Cleanup on exit
  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);

  process.stdin.resume();
  process.stdin.on("end", handleExit);
  process.stdin.on("close", handleExit);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
