#!/usr/bin/env bash
# mock-ui MCP 서버 삭제 스크립트
# 사용법: bash ~/.mock-ui/mock-ui/mcp-server/uninstall.sh
#         또는: curl -fsSL <URL>/uninstall.sh | bash

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

INSTALL_DIR="$HOME/.mock-ui"
ARCHIVE_DIR="$HOME/.mock-ui-archive"
CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
BACKUP_PATH="${CONFIG_PATH}.bak"

echo ""
echo "mock-ui MCP 서버 삭제를 시작합니다."
echo "─────────────────────────────────────"

# ── 사전 조건 확인 ─────────────────────────────────────────────────────────────
echo ""
echo "[ 사전 조건 확인 ]"
if ! command -v jq &>/dev/null; then
  error "jq 가 설치되어 있지 않습니다.\n  설치: brew install jq"
fi
info "jq: $(command -v jq)"

# ── Claude Desktop 설정에서 mock-ui 제거 ────────────────────────────────────
echo ""
echo "[ Claude Desktop 설정 ]"

if [ ! -f "$CONFIG_PATH" ]; then
  warn "Claude Desktop 설정 파일이 없습니다. 건너뜁니다."
else
  if jq -e '.mcpServers["mock-ui"]' "$CONFIG_PATH" > /dev/null 2>&1; then
    cp "$CONFIG_PATH" "$BACKUP_PATH"
    info "설정 파일 백업: $BACKUP_PATH"

    jq 'del(.mcpServers["mock-ui"])' "$CONFIG_PATH" \
      > /tmp/_mock_ui_uninstall.json && \
      mv /tmp/_mock_ui_uninstall.json "$CONFIG_PATH"
    info "Claude Desktop 설정에서 mock-ui 항목 제거 완료"
  else
    warn "Claude Desktop 설정에 mock-ui 항목이 없습니다. 건너뜁니다."
  fi
fi

# ── 설치 디렉토리 삭제 ────────────────────────────────────────────────────────
echo ""
echo "[ 설치 디렉토리 삭제 ]"

if [ -d "$INSTALL_DIR" ]; then
  rm -rf "$INSTALL_DIR"
  info "삭제 완료: $INSTALL_DIR"
else
  warn "$INSTALL_DIR 가 없습니다. 건너뜁니다."
fi

# ── 아카이브 삭제 (선택) ──────────────────────────────────────────────────────
echo ""
echo "[ Mock UI 아카이브 ]"

if [ -d "$ARCHIVE_DIR" ]; then
  MOCK_COUNT=$(find "$ARCHIVE_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
  echo "  지금까지 만든 Mock UI: ${MOCK_COUNT}개 ($ARCHIVE_DIR)"
  echo ""
  read -r -p "아카이브도 삭제하시겠습니까? 삭제하면 복구할 수 없습니다. (y/N): " CONFIRM
  echo ""
  if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    rm -rf "$ARCHIVE_DIR"
    info "아카이브 삭제 완료: $ARCHIVE_DIR"
  else
    warn "아카이브는 유지됩니다: $ARCHIVE_DIR"
  fi
else
  warn "$ARCHIVE_DIR 가 없습니다. 건너뜁니다."
fi

# ── 완료 ─────────────────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────"
echo -e "${GREEN}삭제 완료!${NC}"
echo ""
echo "다음 단계:"
echo "  Claude Desktop을 완전히 종료(⌘Q)했다가 다시 시작하면 적용됩니다."
echo ""
