---
name: mock-ui
description: 자연어 요구사항으로 단일 화면 Mock UI를 로컬에 생성하고 미리보기 URL을 반환합니다. 배포는 사용자 검토 후 /mock-ui-redeploy로 별도 실행합니다.
argument-hint: <화면 요구사항 설명>
---

사용자의 화면 요구사항을 기반으로 Mock UI를 **로컬에 생성하고 미리보기 URL을 반환**합니다.
**Vercel 배포는 절대 하지 않습니다.** 배포는 사용자가 검토 후 `/mock-ui-redeploy`로 직접 실행합니다.

**사용자 요구사항**: $ARGUMENTS

요구사항이 없거나 너무 짧으면 사용자에게 구체적인 화면 설명을 요청하세요.

Agent tool을 사용해 `mock-ui-builder` 서브에이전트를 다음 프롬프트로 디스패치하세요:

```
다음 요구사항에 맞는 Mock UI를 로컬에 생성하고 미리보기 URL을 반환해주세요:

$ARGUMENTS

중요: Vercel 배포는 절대 하지 마세요. 로컬 dev 서버 기동까지만 수행하고,
사용자가 브라우저에서 확인 후 만족하면 /mock-ui-redeploy로 배포하도록 안내하세요.
```

서브에이전트가 완료되면 결과(로컬 미리보기 URL, 로컬 경로, 다음 단계 안내)를 사용자에게 보고합니다.
