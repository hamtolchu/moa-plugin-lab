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
exports.registerResources = registerResources;
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
function registerResources(server) {
    server.resource("mock-ui-components", "mock-ui://components", async (uri) => {
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
    });
    server.resource("mock-ui-design", "mock-ui://design", async (uri) => ({
        contents: [{
                uri: uri.href,
                text: await getDesignMd(),
                mimeType: "text/markdown",
            }],
    }));
}
