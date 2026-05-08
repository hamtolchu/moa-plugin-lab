// @ts-nocheck — McpServer.tool() overloads cause TS2589 (type instantiation too deep) in SDK v1.x
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as path from "path";
import * as os from "os";

/* eslint-disable @typescript-eslint/no-require-imports */
const { scaffoldMock, writeAndBuildMock } = require("../../scripts/core");
const { deployMock } = require("../../scripts/deploy");
const { stopDevServer, getDevServerStatus } = require("../../scripts/dev-server");
const { listMocks, getMockMetadata } = require("../../scripts/archive");

const ARCHIVE_DIR = path.join(os.homedir(), ".mock-ui-archive");

function archivePath(slug: string): string {
  return path.join(ARCHIVE_DIR, slug);
}

const scaffoldSchema = { description: z.string().min(1).describe("화면 요구사항을 자연어로 설명") };
const slugSchema = { slug: z.string().min(1).describe("mock_ui_scaffold가 반환한 slug") };
const writeAndBuildSchema = {
  slug: z.string().min(1).describe("mock_ui_scaffold가 반환한 slug"),
  pageTsx: z.string().min(1).describe("app/page.tsx 전체 내용 (TypeScript + React)"),
};

export function registerTools(server: McpServer): void {
  // ── Step 1: scaffold ─────────────────────────────────────────────────────
  server.tool(
    "mock_ui_scaffold",
    "사용자가 'mock-ui', '목업', '화면 만들어줘', '시안' 키워드로 새 화면 생성을 요청하면 이 도구부터 호출합니다. " +
    "보일러플레이트를 클론하고 디자인 리소스를 복사해 mock 디렉토리를 초기화합니다. " +
    "이 도구를 호출하기 전에 mock-ui://components 와 mock-ui://design 리소스를 읽어 " +
    "컴포넌트 카탈로그와 디자인 토큰을 파악하세요. {slug, archivePath}를 반환합니다.",
    scaffoldSchema,
    async (args) => {
      const { description } = args as { description: string };
      try {
        const resourcesDir = process.env.MOCK_UI_RESOURCES_DIR
          || path.join(__dirname, "..", "..", "resources");
        const result = await scaffoldMock(description, resourcesDir) as unknown;
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `오류: ${msg}` }], isError: true };
      }
    }
  );

  // ── Step 2: write page.tsx, build, start dev server ──────────────────────
  server.tool(
    "mock_ui_write_and_build",
    "LLM이 생성한 page.tsx를 저장하고, Next.js 빌드 검증 후 로컬 dev 서버를 기동합니다. " +
    "빌드 실패 시 buildLog가 포함된 오류를 반환하므로 page.tsx를 수정해 재호출하세요. " +
    "{slug, archivePath, devUrl}를 반환합니다. " +
    "중요: 이 도구 호출 후 반드시 사용자에게 devUrl을 안내하고 검토를 요청해야 합니다. " +
    "사용자가 명시적으로 배포를 요청하기 전까지 mock_ui_deploy 또는 mock_ui_redeploy를 호출하지 마세요.",
    writeAndBuildSchema,
    async (args) => {
      const { slug, pageTsx } = args as { slug: string; pageTsx: string };
      try {
        const result = await writeAndBuildMock(slug, pageTsx) as unknown;
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: msg }], isError: true };
      }
    }
  );

  // ── Deploy (fresh) ───────────────────────────────────────────────────────
  server.tool(
    "mock_ui_deploy",
    "사용자가 명시적으로 '배포', 'deploy', 'Vercel에 올려줘'를 요청한 경우에만 호출. dev 미리보기 단계에서는 절대 호출 금지. " +
    "로컬 mock을 Vercel에 프로덕션 배포하고 공개 URL을 반환합니다. VERCEL_TOKEN이 필요합니다. " +
    "{slug, prodUrl}를 반환합니다.",
    slugSchema,
    async (args) => {
      const { slug } = args as { slug: string };
      try {
        const url = await deployMock(archivePath(slug)) as unknown as string;
        return { content: [{ type: "text" as const, text: JSON.stringify({ slug, prodUrl: url }) }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `배포 실패: ${msg}` }], isError: true };
      }
    }
  );

  // ── Redeploy (stop dev + deploy) ─────────────────────────────────────────
  server.tool(
    "mock_ui_redeploy",
    "사용자가 명시적으로 '재배포', 'redeploy', '다시 배포'를 요청한 경우에만 호출. dev 미리보기 단계에서는 절대 호출 금지. " +
    "dev 서버를 정지하고 현재 상태를 Vercel에 재배포합니다. {slug, prodUrl}를 반환합니다.",
    slugSchema,
    async (args) => {
      const { slug } = args as { slug: string };
      try {
        stopDevServer(archivePath(slug));
        const url = await deployMock(archivePath(slug)) as unknown as string;
        return { content: [{ type: "text" as const, text: JSON.stringify({ slug, prodUrl: url }) }] };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `재배포 실패: ${msg}` }], isError: true };
      }
    }
  );

  // ── Stop dev server ──────────────────────────────────────────────────────
  server.tool(
    "mock_ui_stop",
    "'dev 서버 꺼줘', '정지', 'stop'을 요청하면 호출합니다. " +
    "로컬 dev 서버를 정지합니다. 이미 꺼져 있어도 오류 없이 완료됩니다. {slug, stopped: true}를 반환합니다.",
    slugSchema,
    async (args) => {
      const { slug } = args as { slug: string };
      stopDevServer(archivePath(slug));
      return { content: [{ type: "text" as const, text: JSON.stringify({ slug, stopped: true }) }] };
    }
  );

  // ── List all mocks ───────────────────────────────────────────────────────
  server.tool(
    "mock_ui_list",
    "'mock 목록', '지금까지 만든 화면', '내 mock-ui'를 물으면 호출합니다. " +
    "로컬에 저장된 모든 mock 목록을 최신순으로 반환합니다.",
    {},
    async () => {
      const mocks = listMocks() as unknown;
      return { content: [{ type: "text" as const, text: JSON.stringify(mocks, null, 2) }] };
    }
  );

  // ── Status of one mock ───────────────────────────────────────────────────
  server.tool(
    "mock_ui_status",
    "'상태', '실행 중이야?', 'dev 서버 살아있어?' 등을 물으면 호출합니다. " +
    "특정 mock의 dev 서버 실행 상태, 로컬 URL, 배포 URL을 반환합니다.",
    slugSchema,
    async (args) => {
      const { slug } = args as { slug: string };
      try {
        const devStatus = getDevServerStatus(archivePath(slug)) as { running: boolean; pid?: number; url?: string };
        const meta = getMockMetadata(slug) as { url?: string; deployedAt?: string };
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              slug,
              running: devStatus.running,
              ...(devStatus.url && { devUrl: devStatus.url }),
              ...(meta.url && { prodUrl: meta.url }),
              ...(meta.deployedAt && { deployedAt: meta.deployedAt }),
            }),
          }],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `상태 조회 실패: ${msg}` }], isError: true };
      }
    }
  );
}
