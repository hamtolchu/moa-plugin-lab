"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const tools_1 = require("./tools");
const resources_1 = require("./resources");
const server = new mcp_js_1.McpServer({
    name: "mock-ui",
    version: "1.0.0",
});
(0, tools_1.registerTools)(server);
(0, resources_1.registerResources)(server);
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("mock-ui MCP 서버 시작 (stdio)\n");
}
main().catch(err => {
    process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
});
