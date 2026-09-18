# MindFlow AI — 명상·수면 웰니스 앱

`GRM D7 SPEC Meditation-Sleep-MultiLLM-MultiAgent.md`의 P0 범위를 구현한 실행 가능한 MVP입니다.
체크인 → 상태 이해 → 맞춤 루틴 생성 → 세션 실행 → 전후 기록 → 주간 인사이트 흐름이 동작합니다.

## 변경 이력

### 2026-09-18 — MindFlow AI 전면 재구축

기존에는 자유 텍스트 채팅 UI(`/v1/sessions`)에 ConversationAgent/SleepStoryAgent/SafetyAgent가 순차
호출되는 구조였다. "기능이 단순하고 AI가 같은 말만 반복한다"는 피드백에 따라 두 번째 명세서
(`GRM D7 SPEC ...`) 기준으로 아래와 같이 전면 재구축했다.

**주요 변경 내용**

- 채팅 UI, 관련 에이전트(`conversationAgent`/`sleepStoryAgent`/`orchestrator.ts`), `/v1/*` API,
  기존 Prisma 스키마(`Session`/`Message`)를 모두 제거하고 새 스키마로 재마이그레이션
- 공유 타입 전면 재정의: `wellness.ts`, `routine.ts`, `safety.ts`, `insight.ts`를 새로 추가하고
  `agent.ts`/`db.ts`/`llm.ts`/`api.ts`를 명세서 3~11장 기준으로 다시 작성, Zod 스키마(`schemas.ts`)로
  모든 LLM 출력 검증
- 4개 에이전트(CheckinAgent, RoutineAgent, InsightAgent, SafetyAgent) + Orchestrator(`recommend.ts`) 신규 구현
- 체크인 → 루틴 추천 → 세션 플레이어(실제 카운트다운 타이머) → 전후 기록 → 주간 인사이트(Recharts 차트)
  화면을 신규 제작, Calm 참고 톤(다크 네이비/퍼플 그라디언트)은 유지
- LLM 호출 결과가 매 요청 새로 생성되도록 설계해, 기존의 "템플릿 반복" 문제를 해결
  (사용자가 보는 텍스트 대부분이 LLM 생성 + Zod 검증을 거침)

**세션 중 발견하고 수정한 문제**

| 문제 | 원인 | 조치 |
| --- | --- | --- |
| InsightAgent가 영어로 응답 | 시스템 프롬프트에 언어 지시가 없어 모델이 임의로 영어 선택 | Checkin/Routine/Insight 세 에이전트 프롬프트 모두에 "반드시 한국어로 작성한다" 명시 |
| 세션 플레이어에서 "종료"를 누르면 후 상태 캡처 없이 기본값으로 바로 저장됨 | "종료"와 "기록 저장하기" 버튼이 동일한 `handleComplete` 핸들러를 공유해 조기 종료 시 캡처 화면을 건너뜀 | `handleFinishSteps`(캡처 화면 이동)와 `handleSubmitAfter`(실제 저장)로 핸들러 분리 |
| `next@14.2.5`에 critical 등급 보안 권고 다수 | 설치 당시 최신 패치가 아닌 버전을 고정 | `^14.2.25`로 상향 (14.x 내 최신 패치 유지, 메이저 업그레이드는 보류) |
| 로컬 curl로 한글 메시지 테스트 시 내용이 깨짐 | Git Bash에서 커맨드라인 인자로 넘긴 한글이 인코딩 손상 (앱 자체 버그 아님) | Node `fetch` 스크립트로 재검증해 실제로는 정상 동작함을 확인 |
| Next.js dev 서버 재기동 시 `EADDRINUSE` | 이전 세션이 종료되며 npm이 자식 프로세스에 SIGTERM을 전달하지 못해 포트 점유 프로세스가 남음 | 포트를 점유한 PID를 찾아 종료 후 재기동 |

## 구조 (npm workspaces monorepo)

```
packages/shared-types/   # 3~11장 타입/Zod 스키마 (wellness, routine, safety, insight, llm, db, api)
apps/server/             # Express + Prisma(SQLite) 백엔드, 4개 에이전트 + 오케스트레이터
apps/web/                # Next.js 14 (App Router) + Tailwind + Recharts 프론트엔드
```

## 준비

```bash
npm install
cp apps/server/.env.example apps/server/.env   # OPENAI_API_KEY를 실제 키로 교체
npm run build -w packages/shared-types
npx prisma migrate dev --name init --schema apps/server/prisma/schema.prisma
```

## 실행

```bash
npm run dev:server   # http://localhost:4000
npm run dev:web      # http://localhost:3000
```

## 화면 흐름

1. **홈** — 체크인/수면기록/인사이트 진입점
2. **체크인** (`/checkin`) — 기분·스트레스·에너지·졸림 슬라이더, 목표, 가용 시간, 자유 입력
3. **루틴 추천** — 대표 루틴 1개 + 대안 2개 (매번 새로운 조합/문구로 생성됨). 위기 신호 감지 시 고정 안전 안내로 전환
4. **세션 플레이어** (`/player/[routineId]`) — 전 상태 기록 → 단계별 타이머(호흡/바디스캔/명상/수면스토리 등) → 일시정지/종료 → 후 상태 기록
5. **수면 체크인** (`/sleep-log`) — 취침·기상·수면 만족도 기록
6. **주간 인사이트** (`/insights`) — 7일 추세 차트(Recharts) + 관찰된 패턴 / 확실하지 않은 추정 / 다음 행동 제안

## 멀티 에이전트 (7장)

- **CheckinAgent** — 자유 입력이 있을 때만 LLM 호출, 슬라이더 값과 결합해 `WellnessState` 생성
- **RoutineAgent** — 서로 다른 구성의 루틴 3개(대표+대안 2개)를 매번 새로 생성, 시간 배분을 정확히 맞춤
- **SafetyAgent** — 규칙 기반 위기 키워드 감지(LLM 완전 우회, 고정 템플릿) + 생성된 루틴에 대한 의료적 표현 검증
- **InsightAgent** — 서버가 계산한 7일 요약 통계만 받아 관찰/불확실성/다음 행동을 구분해 생성
- **Orchestrator** — Check-in → (위기 시 즉시 차단) → Routine → Safety 순서, 최대 4단계 제한

## 멀티 LLM (6장)

`LLMProvider` 인터페이스(`packages/shared-types/src/llm.ts`) 위에 OpenAI 구현체만 연결되어 있습니다.
작업 유형별로 1차/폴백 모델을 구분하는 라우팅 표(`apps/server/src/llm/index.ts`)가 이미 구조화되어 있어,
Claude/Gemini 등 다른 벤더의 `LLMProvider` 구현체만 추가하면 진짜 멀티 벤더 폴백/비교로 확장할 수 있습니다.
(현재는 OpenAI 키만 있어 단일 벤더로 동작, F-10 AI Lab 비교 화면은 이번 범위에서 제외)

## 안전·개인정보 (13장)

- 위기 키워드가 감지되면 LLM 호출 자체를 건너뛰고 검토된 고정 문구 + 상담 연락처를 즉시 반환
- 생성된 루틴에 의료적 표현(진단/처방/완치 등)이 감지되면 재생성 후 정적 루틴으로 대체
- 호흡 단계가 포함된 루틴에는 항상 "어지러움 시 중단" 안내를 표시
- `DELETE /api/me/data`로 사용자 데이터 전체 삭제 가능

## 알려진 단순화

- 인증은 브라우저 localStorage의 익명 사용자 ID로 대체 (Supabase Auth 미도입)
- `POST /api/sessions/:id/start`를 세션 생성과 합쳐 `POST /api/sessions`로 단순화
- F-10 AI Lab 비교 모드, 알림(F-11), 웨어러블 연동(F-12)은 이번 범위에서 제외
- `npm audit`에 next.js 관련 보안 권고가 남아있음 — 이 프로젝트가 쓰지 않는 기능(Server Actions,
  Middleware, 이미지 최적화) 관련이라 로컬 개발 단계 영향은 제한적이지만, 배포 전 재검토 필요
