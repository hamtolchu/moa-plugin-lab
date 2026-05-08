#!/usr/bin/env bash
# mock-ui MCP 서버 설치 스크립트
# 사용법: curl -fsSL <URL>/install.sh | bash
# macOS 전용. Node 18+, git, pnpm, vercel CLI가 필요합니다.

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

INSTALL_DIR="$HOME/.mock-ui"
REPO_URL="https://github.com/hamtolchu/design-base.git"
CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
BACKUP_PATH="${CONFIG_PATH}.bak"

echo ""
echo "mock-ui MCP 서버 설치를 시작합니다."
echo "─────────────────────────────────────"

# ── 사전 조건 확인 ─────────────────────────────────────────────────────────────
check_cmd() {
  local cmd="$1" install_hint="$2"
  if ! command -v "$cmd" &>/dev/null; then
    error "$cmd 가 설치되어 있지 않습니다.\n  설치: $install_hint"
  fi
  info "$cmd: $(command -v "$cmd")"
}

echo ""
echo "[ 사전 조건 확인 ]"
check_cmd node  "brew install node  (또는 https://nodejs.org)"
check_cmd git   "brew install git"
check_cmd pnpm  "npm install -g pnpm"
check_cmd vercel "npm install -g vercel  (이후 vercel login 필요)"
check_cmd jq    "brew install jq"

# Node 버전 확인
NODE_MAJOR=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  error "Node 18 이상이 필요합니다. 현재: $(node --version)"
fi

# ── 코드 설치 ─────────────────────────────────────────────────────────────────
echo ""
echo "[ 코드 설치 → $INSTALL_DIR ]"

if [ -d "$INSTALL_DIR/.git" ]; then
  warn "기존 설치를 업데이트합니다."
  git -C "$INSTALL_DIR" pull --ff-only
else
  if [ -d "$INSTALL_DIR" ]; then
    warn "$INSTALL_DIR 가 이미 존재합니다. 삭제 후 재설치합니다."
    rm -rf "$INSTALL_DIR"
  fi
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi
info "코드 설치 완료"

# ── 의존성 설치 & 빌드 ──────────────────────────────────────────────────────
echo ""
echo "[ MCP 서버 빌드 ]"
cd "$INSTALL_DIR/mock-ui/mcp-server"
pnpm install --silent
pnpm build
info "빌드 완료"

# ── VERCEL_TOKEN 입력 ────────────────────────────────────────────────────────
echo ""
echo "[ Vercel 토큰 설정 ]"
echo "  Vercel 토큰은 https://vercel.com/account/tokens 에서 발급받으세요."
echo "  (입력 내용은 화면에 표시되지 않습니다)"
echo ""

while true; do
  read -r -s -p "Vercel 토큰을 붙여넣으세요: " VERCEL_TOKEN
  echo ""
  if [ -z "$VERCEL_TOKEN" ]; then
    warn "토큰이 비어 있습니다. 다시 입력하세요."
  else
    break
  fi
done

# 토큰은 config에만 저장 (평문 파일 저장 없음)
info "토큰 입력 완료"

# ── Claude Desktop 설정 패치 ─────────────────────────────────────────────────
echo ""
echo "[ Claude Desktop 설정 ]"

DIST_JS="$INSTALL_DIR/mock-ui/mcp-server/dist/index.js"
RESOURCES_DIR="$INSTALL_DIR/mock-ui/resources"

if [ ! -f "$CONFIG_PATH" ]; then
  warn "Claude Desktop 설정 파일이 없습니다. 새로 생성합니다."
  mkdir -p "$(dirname "$CONFIG_PATH")"
  echo '{}' > "$CONFIG_PATH"
fi

# 백업
cp "$CONFIG_PATH" "$BACKUP_PATH"
info "설정 파일 백업: $BACKUP_PATH"

# mcpServers 항목 추가/갱신 (idempotent)
jq \
  --arg dist "$DIST_JS" \
  --arg res "$RESOURCES_DIR" \
  --arg token "$VERCEL_TOKEN" \
  '
    if .mcpServers == null then .mcpServers = {} else . end |
    .mcpServers["mock-ui"] = {
      "command": "node",
      "args": [$dist],
      "env": {
        "MOCK_UI_RESOURCES_DIR": $res,
        "VERCEL_TOKEN": $token
      }
    }
  ' "$CONFIG_PATH" > /tmp/_mock_ui_config.json && mv /tmp/_mock_ui_config.json "$CONFIG_PATH"

info "Claude Desktop 설정 완료"

# ── 완료 ─────────────────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────"
echo -e "${GREEN}설치 완료!${NC}"
echo ""
echo "다음 단계:"
echo "  1. Claude Desktop을 완전히 종료했다가 다시 시작하세요"
echo "  2. 새 대화를 열고 다음과 같이 입력해 보세요:"
echo ""
echo "     '회원가입 화면을 만들어줘'"
echo ""
echo "  3. Claude가 자동으로 mock-ui 도구를 사용해 화면을 만들고"
echo "     로컬 미리보기 URL을 알려드립니다."
echo ""
echo "문의: #기획지원 슬랙 채널"
echo ""
