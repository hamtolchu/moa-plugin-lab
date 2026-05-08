import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const RESOURCES_DIR = process.env.MOCK_UI_RESOURCES_DIR
  || path.join(__dirname, "..", "..", "resources");

const DESIGN_CACHE = path.join(os.homedir(), ".mock-ui", "DESIGN.md");

async function getDesignMd(): Promise<string> {
  if (fs.existsSync(DESIGN_CACHE)) {
    return fs.readFileSync(DESIGN_CACHE, "utf8");
  }
  const res = await fetch(
    "https://raw.githubusercontent.com/hamtolchu/mao-startkit/main/DESIGN.md"
  );
  if (!res.ok) throw new Error(`DESIGN.md fetch 실패: HTTP ${res.status}`);
  const content = await res.text();
  fs.mkdirSync(path.dirname(DESIGN_CACHE), { recursive: true });
  fs.writeFileSync(DESIGN_CACHE, content, "utf8");
  return content;
}

export function registerResources(server: McpServer): void {
  server.resource(
    "mock-ui-components",
    "mock-ui://components",
    async (uri) => {
      const componentsPath = path.join(RESOURCES_DIR, "COMPONENTS.md");
      if (!fs.existsSync(componentsPath)) {
        throw new Error(`COMPONENTS.md를 찾을 수 없습니다: ${componentsPath}\nMOCK_UI_RESOURCES_DIR 환경변수를 확인하세요.`);
      }
      return {
        contents: [{
          uri: uri.href,
          text: fs.readFileSync(componentsPath, "utf8"),
          mimeType: "text/markdown",
        }],
      };
    }
  );

  server.resource(
    "mock-ui-design",
    "mock-ui://design",
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: await getDesignMd(),
        mimeType: "text/markdown",
      }],
    })
  );
}
