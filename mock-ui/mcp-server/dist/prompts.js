"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPrompts = registerPrompts;
const zod_1 = require("zod");
function registerPrompts(server) {
    server.registerPrompt("mock-ui", {
        title: "Mock UI 생성",
        description: "자연어 요구사항으로 단일 화면 Mock UI를 로컬에 생성하고 미리보기 URL을 반환합니다. " +
            "Vercel 배포는 사용자가 검토 후 별도로 요청해야 실행됩니다.",
        argsSchema: {
            description: zod_1.z.string().describe("화면 요구사항을 자연어로 설명"),
        },
    }, async ({ description }) => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: [
                        "다음 요구사항으로 mock-ui MCP 서버를 사용해 단일 화면 Mock UI를 만들어주세요.",
                        "",
                        `요구사항: ${description}`,
                        "",
                        "절차 (순서 필수):",
                        "1. mock-ui://components 와 mock-ui://design 리소스를 읽어 컴포넌트·디자인 토큰 파악",
                        "2. mock_ui_scaffold(description)로 보일러플레이트 초기화 → {slug, archivePath} 수령",
                        "3. 리소스 규칙에 맞춰 app/page.tsx 작성 (기존 컴포넌트 우선, 토큰만 사용, 현실적 콘텐츠, placeholder 금지)",
                        "4. mock_ui_write_and_build(slug, pageTsx)로 빌드+dev 서버 기동 → devUrl 수령",
                        "5. devUrl을 사용자에게 안내하고 검토 대기. 사용자가 명시적으로 '배포'를 요청하기 전까지 mock_ui_deploy/redeploy 호출 금지.",
                    ].join("\n"),
                },
            },
        ],
    }));
}
