# mock-ui 기획자 설치 · 사용 가이드

Claude Desktop에서 화면 설명을 입력하면, 사내 디자인 시스템 컴포넌트로 Mock UI를 자동 생성하고 브라우저 미리보기 URL을 돌려주는 도구입니다.

---

## 이 도구로 무엇을 할 수 있나요?

대화창에 화면 요구사항을 자연어로 입력하면 Claude가 자동으로:

1. 사내 디자인 컴포넌트(버튼·테이블·사이드바 등 40여 종)와 브랜드 규칙을 적용해 화면을 생성합니다
2. 로컬 브라우저에서 즉시 확인할 수 있는 미리보기 URL을 제공합니다
3. 만족스러우면 "배포해줘"라고 입력하는 것만으로 Vercel에 공개 URL을 발행합니다

**예시 결과물 — `use mock-ui 회원가입 화면` 입력 시:**

```
로컬 미리보기: http://localhost:3000
Slug: 2026-05-08-signup-a3f

미리보기를 확인하세요. 수정이 필요하면 말씀해 주세요.
만족하시면 '배포해줘'라고 입력하시면 Vercel 공개 URL을 발행합니다.
```

---

## 1. 시작 전 준비물

아래 항목을 미리 확인하세요.

- [ ] macOS 컴퓨터 (Apple Silicon / Intel 모두 지원)
- [ ] [Claude Desktop](https://claude.ai/download) 앱 설치 및 로그인
- [ ] Vercel 계정 및 토큰 (다음 섹션에서 발급)

---

## 2. Vercel 토큰 발급하기

Vercel은 Mock UI를 인터넷에 공개하는 무료 배포 서비스입니다. 개인 계정을 만들고 토큰을 발급해야 합니다.

### 2-1. Vercel 가입

1. 브라우저에서 [vercel.com](https://vercel.com) 을 엽니다
2. **Sign Up** 버튼을 클릭합니다
3. GitHub 또는 Google 계정으로 가입합니다

<!-- TODO: screenshot — vercel.com 메인 Sign Up 버튼 -->

### 2-2. 토큰 발급

1. 로그인 후 우상단 **프로필 아이콘**을 클릭합니다
2. 드롭다운에서 **Account Settings**를 선택합니다

<!-- TODO: screenshot — 프로필 드롭다운 메뉴 -->

3. 왼쪽 메뉴에서 **Tokens**를 클릭합니다

<!-- TODO: screenshot — 설정 페이지 왼쪽 Tokens 메뉴 -->

4. **Create Token** 버튼을 클릭합니다
5. 이름 입력란에 `mock-ui`라고 입력합니다 (다른 이름도 무방합니다)
6. **Create** 버튼을 클릭하면 토큰이 생성됩니다

<!-- TODO: screenshot — Create Token 폼 -->

7. 화면에 표시된 토큰 문자열을 복사합니다

> **중요:** 토큰은 이 화면에서 한 번만 표시됩니다. 지금 바로 복사해 두세요. 설치 과정에서 붙여넣기 합니다.

<!-- TODO: screenshot — 토큰 생성 결과 화면 -->

---

## 3. 설치하기

설치는 단 한 번만 하면 됩니다.

### 3-1. 터미널 열기

키보드에서 `Command + Space`를 눌러 Spotlight를 엽니다.  
`Terminal`을 입력한 뒤 `Return`을 누릅니다.

<!-- TODO: screenshot — Spotlight에서 Terminal 검색 -->

### 3-2. 설치 명령어 실행

터미널 창에 아래 명령어를 그대로 복사해 붙여넣은 뒤 `Return`을 누릅니다.

```bash
curl -fsSL https://raw.githubusercontent.com/hamtolchu/moa-plugin-lab/refs/heads/lab/mock-ui/mcp-server/install.sh | bash
```

설치 스크립트가 자동으로 실행되면서 필요한 도구를 확인합니다.

> 만약 `✗ node 가 설치되어 있지 않습니다.` 같은 오류가 뜨면, 아래 [트러블슈팅 — 사전 도구 누락](#사전-도구가-없다고-설치가-멈췄어요) 항목을 참고하세요.

### 3-3. Vercel 토큰 붙여넣기

설치 중 아래 메시지가 나타나면 앞서 복사한 토큰을 붙여넣고 `Return`을 누릅니다.  
(입력 내용은 보안을 위해 화면에 표시되지 않습니다.)

```
Vercel 토큰을 붙여넣으세요:
```

### 3-4. Claude Desktop 재시작

터미널에 `설치 완료!` 메시지가 표시되면 Claude Desktop을 완전히 종료했다가 다시 시작합니다.

- Mac 상단 메뉴바에서 **Claude → Quit Claude** 클릭 (또는 `Command + Q`)
- 종료 후 Dock에서 Claude Desktop을 다시 실행합니다

---

## 4. 첫 화면 만들기

Claude Desktop에서 새 대화를 시작합니다.

### 사용 방법

대화창에 `use mock-ui` 로 시작한 뒤 화면 요구사항을 입력합니다.

```
use mock-ui <화면 설명>
```

> **슬래시 메뉴도 사용 가능합니다.** 대화창 왼쪽 하단 `/` 버튼 → **Mock UI 생성**을 선택해도 동일하게 동작합니다.

<!-- TODO: screenshot — Claude Desktop 슬래시 메뉴에서 "Mock UI 생성" 항목 -->

### 요청 예시

```
use mock-ui 회원가입 화면 — 이메일·비밀번호·이름 입력 필드, 소셜 로그인(구글), 이용약관 동의 체크박스
```

```
use mock-ui 상품 목록 페이지 — 상단 필터바, 격자형 카드 리스트, 페이지네이션
```

```
use mock-ui 마이페이지 — 좌측 사이드바 네비게이션 + 우측 프로필 정보 편집 폼
```

### 결과 해석

Claude가 작업을 완료하면 아래와 같은 응답이 옵니다:

```
로컬 미리보기: http://localhost:3000
Slug: 2026-05-08-signup-a3f

미리보기를 확인하세요. 수정이 필요하면 말씀해 주세요.
만족하시면 '배포해줘'라고 입력하시면 Vercel 공개 URL을 발행합니다.
```

- **로컬 미리보기 URL**: 브라우저에서 열면 생성된 화면을 즉시 확인할 수 있습니다
- **Slug**: 이 Mock UI를 구분하는 고유 식별자입니다. 나중에 배포·정지·재배포 시 필요합니다

---

## 5. 일상적으로 쓰는 명령들

### 화면 수정 요청

미리보기를 확인한 뒤 수정이 필요하면 대화창에 자연어로 입력합니다.  
파일이 저장되는 즉시 브라우저에 반영됩니다 (새로고침 불필요).

```
헤더에 알림 아이콘 추가해줘
```

```
버튼을 좀 더 크게 하고, 헤더에 로고 자리를 만들어줘
```

```
테이블 행 색상을 번갈아 적용해줘
```

### 배포하기

검토가 완료되면 Vercel에 공개 URL로 배포합니다.

```
배포해줘
```

배포 완료 시 `https://mock-2026-05-08-signup-a3f.vercel.app` 형태의 URL이 반환됩니다.  
이 URL을 팀원에게 공유하면 누구든 브라우저에서 열 수 있습니다.

### 재배포하기

수정 후 다시 배포할 때 사용합니다.

```
다시 배포해줘
```

### 만든 목록 보기

지금까지 생성한 Mock UI 전체 목록을 조회합니다.

```
지금까지 만든 mock 목록 보여줘
```

### 특정 Mock 상태 확인

특정 Mock이 실행 중인지, 배포 URL은 무엇인지 확인합니다.

```
2026-05-08-signup-a3f 상태 알려줘
```

Slug를 모르는 경우 목록 조회 먼저 하세요.

### Dev 서버 정지

로컬 미리보기 서버는 Claude Desktop 세션 동안 계속 실행됩니다.  
더 이상 사용하지 않을 때 정지합니다.

```
2026-05-08-signup-a3f dev 서버 꺼줘
```

---

## 6. 자주 묻는 질문 / 트러블슈팅

### "도구가 대화에 나타나지 않아요"

Claude Desktop을 완전히 종료(`Command + Q`)한 뒤 다시 시작하세요.

### "VERCEL_TOKEN 오류가 나요"

토큰이 만료되었거나 잘못 입력된 경우입니다.

1. [vercel.com/account/tokens](https://vercel.com/account/tokens) 에서 새 토큰을 발급합니다
2. Finder에서 다음 경로의 파일을 텍스트 편집기로 엽니다:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

> Finder에서 `Command + Shift + G`를 누르고 위 경로를 붙여넣으면 바로 이동됩니다.

3. 파일 내 `"VERCEL_TOKEN": "기존값"` 부분의 `"기존값"` 자리에 새 토큰을 붙여넣고 저장합니다
4. Claude Desktop을 재시작합니다

### "사전 도구가 없다고 설치가 멈췄어요"

`install.sh`가 필요한 도구를 검사합니다. 오류 메시지에 표시된 명령어를 터미널에서 실행하면 자동 설치됩니다.

| 오류 메시지 | 설치 명령어 |
|---|---|
| `node 가 설치되어 있지 않습니다` | `brew install node` |
| `git 가 설치되어 있지 않습니다` | `brew install git` |
| `pnpm 가 설치되어 있지 않습니다` | `npm install -g pnpm` |
| `vercel 가 설치되어 있지 않습니다` | `npm install -g vercel` (설치 후 `vercel login` 실행) |
| `jq 가 설치되어 있지 않습니다` | `brew install jq` |

`brew` 명령어가 없는 경우:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

설치 후 터미널을 새로 열고 설치 명령어를 다시 실행하세요.

> 설치가 어렵게 느껴지면 #기획지원 슬랙 채널에 문의해 주세요. 개발팀이 지원해 드립니다.

### "Claude Desktop 앱이 없어요"

[claude.ai/download](https://claude.ai/download) 에서 Mac용 Claude Desktop을 설치하세요.

### "빌드가 실패했어요"

Claude가 응답에 빌드 오류 로그를 포함해 반환합니다. 그 내용을 그대로 Claude에게 보여주며 이렇게 요청하세요:

```
빌드가 실패했어. 위 오류를 보고 고쳐줘.
```

Claude가 자동으로 오류를 분석하고 수정합니다.

### "디자인이 업데이트됐는데 반영이 안돼요"

디자인 가이드는 처음 실행 시 캐시됩니다. 다음 명령으로 캐시를 삭제하면 다음 화면 생성 시 최신 버전을 사용합니다.

터미널에서 실행:

```bash
rm ~/.mock-ui/DESIGN.md
```

### "포트 3000~3010이 모두 사용 중이에요"

다른 개발 서버가 해당 포트를 점유하고 있는 경우입니다. 터미널에서 확인:

```bash
lsof -i :3000-3010
```

불필요하게 실행 중인 서버가 있으면 `mock-ui-stop <slug>` 명령으로 정지하거나, 해당 프로세스를 종료하세요.

---

## 7. 도구 삭제하기

더 이상 사용하지 않을 때 아래 명령어로 삭제합니다. 터미널에서 실행하세요.

```bash
curl -fsSL https://raw.githubusercontent.com/hamtolchu/moa-plugin-lab/refs/heads/lab/mock-ui/mcp-server/uninstall.sh | bash
```

삭제 스크립트는 Claude Desktop 설정과 설치 파일을 제거합니다.  
실행 중 "아카이브도 삭제하시겠습니까?"라는 질문이 나옵니다.

- **`y` 입력**: 지금까지 만든 Mock UI 파일도 함께 삭제 (복구 불가)
- **`N` 입력 (기본값)**: Mock UI 파일은 `~/.mock-ui-archive/` 에 그대로 보존

삭제 후 Claude Desktop을 재시작하세요.

---

## 8. 문의처

설치·사용 중 문제가 발생하면 DM 주세요.
