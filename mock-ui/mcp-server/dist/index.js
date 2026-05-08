"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const tools_1 = require("./tools");
const resources_1 = require("./resources");
const prompts_1 = require("./prompts");
const server = new mcp_js_1.McpServer({ name: "mock-ui", version: "1.0.0" }, {
    instructions: [
        "이 서버는 사내 디자인 시스템(SEG Admin) 기반 단일 화면 Mock UI를 생성/배포하는 도구를 제공합니다.",
        "",
        "트리거: 사용자가 'mock-ui', '목업', '화면 만들어줘', '시안', 'use mock-ui' 등의 표현으로 화면 생성을 요청하면 이 서버의 도구를 사용하세요.",
        "",
        "표준 워크플로 (반드시 순서 지킬 것):",
        "1. mock-ui://components 와 mock-ui://design 리소스를 먼저 읽어 컴포넌트 카탈로그/디자인 토큰을 파악한다.",
        "2. mock_ui_scaffold(description) 호출 → {slug, archivePath} 수령",
        "3. 리소스 규칙에 맞춰 app/page.tsx 전체 내용을 작성한다 (기존 컴포넌트 우선, 토큰만 사용, placeholder 금지).",
        "4. mock_ui_write_and_build(slug, pageTsx) 호출 → devUrl 수령",
        "5. 사용자에게 devUrl을 안내하고 검토를 기다린다. 사용자가 명시적으로 배포를 요청하기 전까지 mock_ui_deploy/redeploy 호출 금지.",
        "",
        "수정 요청은 같은 slug에 대해 page.tsx를 다시 작성하고 mock_ui_write_and_build를 재호출한다 (HMR로 즉시 반영).",
        "조회/관리: 'mock 목록'은 mock_ui_list, '상태'는 mock_ui_status, 'dev 서버 끄기'는 mock_ui_stop.",
    ].join("\n"),
});
(0, tools_1.registerTools)(server);
(0, resources_1.registerResources)(server);
(0, prompts_1.registerPrompts)(server);
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("mock-ui MCP 서버 시작 (stdio)\n");
}
main().catch(err => {
    process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
});
