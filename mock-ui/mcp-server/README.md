# mock-ui for Claude Desktop

Claude Code 없이 **Claude Desktop** 에서 동일한 Mock UI 생성·배포 기능을 사용하는 방법입니다.

---

## 설치 (1회만)

터미널을 열고 아래 명령어를 실행하세요.

```bash
curl -fsSL https://raw.githubusercontent.com/hamtolchu/design-base/main/mock-ui/mcp-server/install.sh | bash
```

설치 스크립트가 자동으로:
- 필수 도구(node, git, pnpm, vercel, jq)를 확인합니다
- `~/.mock-ui/` 에 코드를 설치합니다
- Vercel 토큰을 입력 받아 Claude Desktop 설정에 등록합니다

설치 후 **Claude Desktop을 완전히 종료했다가 다시 시작**하세요.

### 사전 필요 사항

| 도구 | 설치 명령 |
|---|---|
| Node.js 18+ | `brew install node` |
| git | `brew install git` |
| pnpm | `npm install -g pnpm` |
| Vercel CLI | `npm install -g vercel && vercel login` |
| jq | `brew install jq` |
| Vercel 토큰 | [vercel.com/account/tokens](https://vercel.com/account/tokens) 에서 발급 |

---

## 사용 방법

Claude Desktop 에서 새 대화를 열고 자연어로 화면을 요청하세요.

### Mock UI 만들기

```
회원가입 화면을 만들어줘.
이메일/비밀번호/이름 입력 필드, 소셜 로그인(구글), 이용약관 동의 체크박스가 있어야 해.
```

Claude 가 자동으로:
1. 컴포넌트 카탈로그와 디자인 가이드를 읽습니다
2. `app/page.tsx` 를 작성합니다
3. 로컬에서 빌드·미리보기 URL을 제공합니다

### Vercel 배포

```
만족스러워. 배포해줘.
```

### 목록 확인

```
지금까지 만든 mock 화면 목록을 보여줘.
```

### 수정 요청

로컬 미리보기를 보고 수정이 필요하면 대화 속에서 직접 요청합니다:

```
버튼을 좀 더 크게 하고, 헤더에 로고 자리를 만들어줘.
```

---

## 아키텍처

```
Claude Desktop ←→ mock-ui MCP 서버 (stdio) ←→ scripts/ (Node.js)
                                               ↕
                              ~/.mock-ui-archive/<slug>/  (Next.js 프로젝트)
```

- MCP 서버는 `node ~/.mock-ui/mock-ui/mcp-server/dist/index.js` 로 실행됩니다
- CC Plugin 과 동일한 아카이브 디렉토리(`~/.mock-ui-archive/`)를 공유합니다
  (CC Plugin 으로 만든 mock 도 Desktop 에서 list/redeploy/stop 할 수 있습니다)

---

## 문제 해결

**"mock-ui 도구가 대화에 나타나지 않아요"**
→ Claude Desktop 을 완전히 종료(⌘Q)한 뒤 다시 시작하세요.

**"VERCEL_TOKEN 오류가 나요"**
→ `~/Library/Application Support/Claude/claude_desktop_config.json` 파일을 열어
  `mcpServers.mock-ui.env.VERCEL_TOKEN` 값을 새 토큰으로 교체하고 Desktop 을 재시작하세요.

**"빌드가 실패했어요"**
→ page.tsx 에 오류가 있는 경우입니다. 빌드 로그를 Claude 에게 보여주고 수정을 요청하세요.

**재설치**
→ `curl -fsSL .../install.sh | bash` 를 다시 실행하면 업데이트됩니다.
