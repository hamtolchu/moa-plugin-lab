# mock-ui — Claude Code Plugin

사내 디자인 규칙과 컴포넌트 키트를 기반으로 단일 화면 Mock UI를 생성하고 Vercel에 배포합니다.

> **Claude Desktop 사용자 (기획자):** Claude Code 없이도 사용 가능합니다.
> `mcp-server/install.sh` 를 실행하면 Claude Desktop 에서 바로 동일한 기능을 사용할 수 있습니다.
> 자세한 내용은 [`mcp-server/README.md`](mcp-server/README.md) 를 참고하세요.

---

## 요구 사항

- Claude Code CLI 설치됨
- Node.js 18 이상
- [Vercel CLI](https://vercel.com/cli) 전역 설치: `npm install -g vercel`
- 개인 Vercel 계정 및 토큰

---

## 1단계: Vercel 토큰 발급

1. [vercel.com/account/tokens](https://vercel.com/account/tokens) 접속
2. **Create Token** 클릭 → 이름 입력 (예: `mock-ui-plugin`)
3. 발급된 토큰을 복사

---

## 2단계: 환경변수 설정

터미널 프로파일(`.zshenv`, `.zshrc`, `.bashrc` 등)에 추가:

```bash
export VERCEL_TOKEN="your_token_here"
```

변경 반영:

```bash
source ~/.zshenv  # 또는 새 터미널 열기
```

---

## 3단계: 플러그인 설치

Claude Code 안에서 다음을 실행합니다.

```
/plugin marketplace add hamtolchu/mao-plugin
/plugin install mock-ui@mao-plugin
```

설치 후 Claude Code를 재시작하면 `/mock-ui` 커맨드가 활성화됩니다.

---

## 사용법

### 1단계: Mock UI 로컬 생성

```
/mock-ui 회원가입 화면 — 이메일, 비밀번호 입력 + 약관 동의 체크박스 + 가입 버튼
```

```
/mock-ui 상품 목록 페이지 — 상단 필터바, 격자형 카드 리스트, 페이지네이션
```

```
/mock-ui 마이페이지 — 좌측 사이드바 네비게이션 + 우측 프로필 정보 편집 폼
```

성공 시 결과 (배포 전 로컬 미리보기):
```
✓ Mock UI 로컬 생성 완료 (아직 배포되지 않음)

Preview: http://localhost:3000
Local:   ~/.mock-ui-archive/2026-05-07-signup-a3f/
Slug:    2026-05-07-signup-a3f

다음 단계:
- 브라우저에서 Preview URL을 열어 결과를 확인하세요
- 수정이 필요하면 자연어로 알려주세요
- 만족하시면 /mock-ui-redeploy 2026-05-07-signup-a3f 로 Vercel 배포하세요
```

### 2단계: 검토 및 수정 (선택)

브라우저에서 미리보기를 확인한 뒤, 수정이 필요하면 Claude에게 자연어로 요청합니다:

```
헤더에 알림 아이콘 추가해줘
```

```
테이블 행 색상을 번갈아 적용해줘 (zebra stripe)
```

파일을 저장하면 브라우저에 즉시 반영됩니다 (HMR).

### 3단계: Vercel 배포

검토가 완료되면 명시적으로 배포합니다:

```
/mock-ui-redeploy 2026-05-07-signup-a3f
```

성공 시 prod URL이 반환됩니다:
```
URL: https://mock-2026-05-07-signup-a3f.vercel.app
```

### 생성 목록 조회

```
/mock-ui-list
```

### Dev 서버 정지

```
/mock-ui-stop 2026-05-07-signup-a3f
```

---

## 로컬 아카이브

생성된 Mock은 `~/.mock-ui-archive/<slug>/`에 보존됩니다.

- 각 Mock은 독립적인 Next.js 프로젝트입니다
- 개발자가 코드를 직접 열어 실제 프로젝트로 이식할 수 있습니다
- Vercel 프로젝트 정리는 [Vercel 대시보드](https://vercel.com/dashboard)에서 수동으로 합니다

---

## 디자인 시스템

`boilerplate/`에 SEG Admin 디자인 시스템이 내장되어 있습니다:

- **DESIGN.md**: 딥 바이올렛 브랜드, Pretendard 폰트, Radix UI 스타일 원칙
- **COMPONENTS.md**: 실제 컴포넌트 카탈로그 (Button, DataTable, Topbar, Card 등 40+)
- **스택**: Next.js 16 + Tailwind CSS v4 + Radix UI

디자인 시스템 업데이트 시: `boilerplate/` 내용을 교체하고 플러그인을 재설치하세요.

---

## 트러블슈팅

**VERCEL_TOKEN 오류**: `echo $VERCEL_TOKEN`으로 설정 여부 확인. 새 터미널에서 재시도.

**vercel 커맨드 없음**: `npm install -g vercel` 실행.

**빌드 실패**: `~/.mock-ui-archive/<slug>/` 경로를 열어 `npm run build` 직접 실행해 에러 확인.

**Dev 서버 포트 충돌**: 3000-3010 포트가 모두 사용 중이면 에러가 납니다. `lsof -i :3000-3010`으로 사용 현황 확인 후 여유 포트를 확보하세요.

**좀비 dev 서버 정리**: Claude Code 세션이 비정상 종료된 경우 dev 서버가 남아있을 수 있습니다. `/mock-ui-stop <slug>`로 정지하거나, `cat ~/.mock-ui-archive/<slug>/.dev-server.pid`로 PID를 확인해 수동으로 `kill <PID>` 하세요.

**Dev 서버 로그 확인**: `cat ~/.mock-ui-archive/<slug>/.dev-server.log`에서 dev 서버의 전체 로그를 볼 수 있습니다.

**플러그인 위치 탐지 실패**: `find ~/.claude/plugins -name "mock-ui-builder.md"` 로 설치 경로 확인.
