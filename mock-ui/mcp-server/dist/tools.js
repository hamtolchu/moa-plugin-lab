"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTools = registerTools;
const zod_1 = require("zod");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const RESOURCES_DIR = process.env.MOCK_UI_RESOURCES_DIR
    || path.join(__dirname, "..", "..", "resources");
const DESIGN_CACHE = path.join(os.homedir(), ".mock-ui", "DESIGN.md");
async function getDesignMd() {
    if (fs.existsSync(DESIGN_CACHE)) {
        return fs.readFileSync(DESIGN_CACHE, "utf8");
    }
    const res = await fetch("https://raw.githubusercontent.com/hamtolchu/mao-startkit/main/DESIGN.md");
    if (!res.ok)
        throw new Error(`DESIGN.md fetch 실패: HTTP ${res.status}`);
    const content = await res.text();
    fs.mkdirSync(path.dirname(DESIGN_CACHE), { recursive: true });
    fs.writeFileSync(DESIGN_CACHE, content, "utf8");
    return content;
}
/* eslint-disable @typescript-eslint/no-require-imports */
const { scaffoldMock, writeAndBuildMock } = require("../../scripts/core");
const { deployMock } = require("../../scripts/deploy");
const { stopDevServer, getDevServerStatus } = require("../../scripts/dev-server");
const { listMocks, getMockMetadata } = require("../../scripts/archive");
const ARCHIVE_DIR = path.join(os.homedir(), ".mock-ui-archive");
function archivePath(slug) {
    return path.join(ARCHIVE_DIR, slug);
}
const scaffoldSchema = { description: zod_1.z.string().min(1).describe("화면 요구사항을 자연어로 설명") };
const slugSchema = { slug: zod_1.z.string().min(1).describe("mock_ui_scaffold가 반환한 slug") };
const writeAndBuildSchema = {
    slug: zod_1.z.string().min(1).describe("mock_ui_scaffold가 반환한 slug"),
    pageTsx: zod_1.z.string().min(1).describe("app/page.tsx 전체 내용 (TypeScript + React)"),
};
function registerTools(server) {
    // ── Catalog tools (fallback for code mode where ReadMcpResourceTool can't reach Desktop-configured servers) ──
    server.tool("mock_ui_get_components", "컴포넌트 카탈로그(COMPONENTS.md)를 반환합니다. " +
        "mock_ui_scaffold 호출 전에 이 도구 또는 mock-ui://components 리소스로 컴포넌트 목록을 파악하세요.", {}, async () => {
        const componentsPath = path.join(RESOURCES_DIR, "COMPONENTS.md");
        if (!fs.existsSync(componentsPath)) {
            return {
                content: [{ type: "text", text: `COMPONENTS.md를 찾을 수 없습니다: ${componentsPath}` }],
                isError: true,
            };
        }
        return { content: [{ type: "text", text: fs.readFileSync(componentsPath, "utf8") }] };
    });
    server.tool("mock_ui_get_design", "디자인 토큰 및 규칙(DESIGN.md)을 반환합니다. " +
        "mock_ui_scaffold 호출 전에 이 도구 또는 mock-ui://design 리소스로 디자인 시스템 규칙을 파악하세요.", {}, async () => {
        try {
            return { content: [{ type: "text", text: await getDesignMd() }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { content: [{ type: "text", text: msg }], isError: true };
        }
    });
    // ── Step 1: scaffold ─────────────────────────────────────────────────────
    server.tool("mock_ui_scaffold", "사용자가 'mock-ui', '목업', '화면 만들어줘', '시안' 키워드로 새 화면 생성을 요청하면 이 도구부터 호출합니다. " +
        "보일러플레이트를 클론하고 디자인 리소스를 복사해 mock 디렉토리를 초기화합니다. " +
        "이 도구를 호출하기 전에 mock_ui_get_components 와 mock_ui_get_design 을 먼저 호출해 " +
        "컴포넌트 카탈로그와 디자인 토큰을 파악하세요. {slug, archivePath}를 반환합니다.", scaffoldSchema, async (args) => {
        const { description } = args;
        try {
            const resourcesDir = process.env.MOCK_UI_RESOURCES_DIR
                || path.join(__dirname, "..", "..", "resources");
            const result = await scaffoldMock(description, resourcesDir);
            return { content: [{ type: "text", text: JSON.stringify(result) }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { content: [{ type: "text", text: `오류: ${msg}` }], isError: true };
        }
    });
    // ── Step 2: write page.tsx, build, start dev server ──────────────────────
    server.tool("mock_ui_write_and_build", "LLM이 생성한 page.tsx를 저장하고, Next.js 빌드 검증 후 로컬 dev 서버를 기동합니다. " +
        "빌드 실패 시 buildLog가 포함된 오류를 반환하므로 page.tsx를 수정해 재호출하세요. " +
        "{slug, archivePath, devUrl}를 반환합니다. " +
        "중요: 이 도구 호출 후 반드시 사용자에게 devUrl을 안내하고 검토를 요청해야 합니다. " +
        "사용자가 명시적으로 배포를 요청하기 전까지 mock_ui_deploy 또는 mock_ui_redeploy를 호출하지 마세요.", writeAndBuildSchema, async (args) => {
        const { slug, pageTsx } = args;
        try {
            const result = await writeAndBuildMock(slug, pageTsx);
            return { content: [{ type: "text", text: JSON.stringify(result) }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { content: [{ type: "text", text: msg }], isError: true };
        }
    });
    // ── Deploy (fresh) ───────────────────────────────────────────────────────
    server.tool("mock_ui_deploy", "사용자가 명시적으로 '배포', 'deploy', 'Vercel에 올려줘'를 요청한 경우에만 호출. dev 미리보기 단계에서는 절대 호출 금지. " +
        "로컬 mock을 Vercel에 프로덕션 배포하고 공개 URL을 반환합니다. VERCEL_TOKEN이 필요합니다. " +
        "{slug, prodUrl}를 반환합니다.", slugSchema, async (args) => {
        const { slug } = args;
        try {
            const url = await deployMock(archivePath(slug));
            return { content: [{ type: "text", text: JSON.stringify({ slug, prodUrl: url }) }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { content: [{ type: "text", text: `배포 실패: ${msg}` }], isError: true };
        }
    });
    // ── Redeploy (stop dev + deploy) ─────────────────────────────────────────
    server.tool("mock_ui_redeploy", "사용자가 명시적으로 '재배포', 'redeploy', '다시 배포'를 요청한 경우에만 호출. dev 미리보기 단계에서는 절대 호출 금지. " +
        "dev 서버를 정지하고 현재 상태를 Vercel에 재배포합니다. {slug, prodUrl}를 반환합니다.", slugSchema, async (args) => {
        const { slug } = args;
        try {
            stopDevServer(archivePath(slug));
            const url = await deployMock(archivePath(slug));
            return { content: [{ type: "text", text: JSON.stringify({ slug, prodUrl: url }) }] };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { content: [{ type: "text", text: `재배포 실패: ${msg}` }], isError: true };
        }
    });
    // ── Stop dev server ──────────────────────────────────────────────────────
    server.tool("mock_ui_stop", "'dev 서버 꺼줘', '정지', 'stop'을 요청하면 호출합니다. " +
        "로컬 dev 서버를 정지합니다. 이미 꺼져 있어도 오류 없이 완료됩니다. {slug, stopped: true}를 반환합니다.", slugSchema, async (args) => {
        const { slug } = args;
        stopDevServer(archivePath(slug));
        return { content: [{ type: "text", text: JSON.stringify({ slug, stopped: true }) }] };
    });
    // ── List all mocks ───────────────────────────────────────────────────────
    server.tool("mock_ui_list", "'mock 목록', '지금까지 만든 화면', '내 mock-ui'를 물으면 호출합니다. " +
        "로컬에 저장된 모든 mock 목록을 최신순으로 반환합니다.", {}, async () => {
        const mocks = listMocks();
        return { content: [{ type: "text", text: JSON.stringify(mocks, null, 2) }] };
    });
    // ── Status of one mock ───────────────────────────────────────────────────
    server.tool("mock_ui_status", "'상태', '실행 중이야?', 'dev 서버 살아있어?' 등을 물으면 호출합니다. " +
        "특정 mock의 dev 서버 실행 상태, 로컬 URL, 배포 URL을 반환합니다.", slugSchema, async (args) => {
        const { slug } = args;
        try {
            const devStatus = getDevServerStatus(archivePath(slug));
            const meta = getMockMetadata(slug);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            slug,
                            running: devStatus.running,
                            ...(devStatus.url && { devUrl: devStatus.url }),
                            ...(meta.url && { prodUrl: meta.url }),
                            ...(meta.deployedAt && { deployedAt: meta.deployedAt }),
                        }),
                    }],
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { content: [{ type: "text", text: `상태 조회 실패: ${msg}` }], isError: true };
        }
    });
}
