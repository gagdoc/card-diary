# Card Diary — Claude Agent Team Harness Guide

이 프로젝트(`card_diary`)에는 Claude Code에서 에이전트 팀을 구성하여 고품질 개발 및 코드 리뷰를 수행할 수 있도록 **두 가지 핵심 개발 하네스**가 구축되어 있습니다.

---

## 1. 탑재된 하네스 요약

### 🛠️ 풀스택 웹앱 개발 하네스 (`/fullstack-webapp`)
* **목적**: 요구사항 정의 → 시스템 설계 → 프론트엔드 및 백엔드 개발 → QA/테스트 → DevOps/배포 설정까지 일관되게 수행하는 팀 협업 모드.
* **에이전트 구성**:
  * `architect`: 요구사항을 분석하고, 컴포넌트 설계 및 Google Drive API 연동 아키텍처를 설계합니다.
  * `frontend-dev`: React 19, Tailwind CSS 3, Framer Motion 등을 활용하여 카드 레이아웃 및 디테일 UI를 개발합니다.
  * `backend-dev`: Google OAuth 2.0 및 Google Drive API v3 연동(파일 CRUD, 이미지 base64 변환 등), LocalStorage 캐시 동기화 로직을 구현합니다.
  * `qa-engineer`: Google Drive 동기화의 오프라인 상태, 1초 디바운스 세션 등 예외 상황을 테스트하고 정합성을 검증합니다.
  * `devops-engineer`: Vercel 배포 설정(`vercel.json` SPA 라우팅) 및 PWA(PWA manifest, Service Worker) 설정을 관리합니다.

### 🔍 코드 리뷰 자동화 하네스 (`/code-reviewer`)
* **목적**: 작성된 코드의 스타일(네이밍, 가독성), 보안(API Key, OAuth Token 누출 방지), 성능(무거운 데이터 렌더링, 이미지 로딩 최적화), 아키텍처(React Context 구조, 관심사 분리)를 다각도로 정밀 검사합니다.
* **에이전트 구성**:
  * `style-inspector`: ESLint 9 기반 코드 스타일 및 컨벤션 검사.
  * `security-analyst`: Google API Key, OAuth Access Token 노출 및 보안 취약점 점검.
  * `performance-analyst`: base64 인코딩 이미지 및 Google Drive API 호출의 디바운싱 성능, 불필요한 React 렌더링 방지.
  * `architecture-reviewer`: AuthContext, DiaryContext 등 Context API 설계 및 SOLID 원칙 준수 여부 리뷰.
  * `review-synthesizer`: 각 분야의 리뷰를 종합하여 우선순위(🔴 필수 수정/🟡 권장)가 지정된 최종 보고서를 생성합니다.

---

## 2. 디렉토리 구조

```
card_diary/
├── .claude/
│   ├── CLAUDE.md                       # 이 문서 (하네스 가이드)
│   ├── agents/
│   │   # 개발 및 아키텍처 에이전트
│   │   ├── architect.md
│   │   ├── frontend-dev.md
│   │   ├── backend-dev.md
│   │   ├── qa-engineer.md
│   │   ├── devops-engineer.md
│   │   # 코드 리뷰 에이전트
│   │   ├── style-inspector.md
│   │   ├── security-analyst.md
│   │   ├── performance-analyst.md
│   │   ├── architecture-reviewer.md
│   │   └── review-synthesizer.md
│   └── skills/
│       # 개발 관련 스킬
│       ├── fullstack-webapp/
│       │   └── skill.md                # 개발 전체 파이프라인 제어
│       ├── component-patterns/
│       │   └── skill.md                # React 19 / Tailwind / 애니메이션 가이드
│       ├── api-security-checklist/
│       │   └── skill.md                # 구글 API / OAuth 연동 보안 체크리스트
│       # 리뷰 관련 스킬
│       ├── code-reviewer/
│       │   └── skill.md                # 리뷰 전체 파이프라인 제어
│       ├── refactoring-catalog/
│       │   └── skill.md                # 리팩토링 및 코드 스멜 해결 가이드
│       └── vulnerability-patterns/
│           └── skill.md                # 클라이언트 사이드 취약점 패턴 가이드
```

---

## 3. 실전 활용 방법 (Claude Code 터미널에서 실행)

### A. 새로운 기능 개발 또는 아키텍처 개선 시
새로운 기능을 추가하거나(예: "일기 카테고리 태그 필터링 추가해줘", "다이어리 통계 페이지 추가해줘"), 복잡한 동기화 성능을 개선할 때 사용합니다.

```bash
# Claude Code 실행 중 아래와 같이 입력하여 스킬 트리거:
/fullstack-webapp "다이어리에 태그 필터링 및 검색 기능을 추가하고, Drive 동기화 파일(diary_entries.json) 포맷에 태그를 포함하도록 변경해줘."
```
* **결과물**: `_workspace/` 폴더에 설계 문서가 자동 작성되고, 에이전트 팀이 요구사항에 맞춰 코드를 수정 및 테스트한 뒤 최종 결과를 리포트합니다.

### B. 개발한 코드를 배포 전에 검증할 때
직접 혹은 에이전트가 수정한 파일들을 대상으로 보안, 성능, 코드 퀄리티를 종합 리뷰받고 싶을 때 사용합니다.

```bash
# 수정된 파일들을 종합적으로 리뷰 요청:
/code-reviewer "최근에 수정한 src/context/DiaryContext.jsx 파일과 src/lib/drive.js 파일을 리뷰해줘."
```
* **결과물**: `_workspace/` 폴더 내에 스타일, 보안, 성능, 아키텍처 관점의 개별 문서 및 이를 요약한 `05_review_summary.md` 종합 리포트가 생성됩니다.

### C. 특정 도메인 헬프 스킬 개별 호출
* **컴포넌트 패턴 가이드**: `/component-patterns`
  * UI에 Framer Motion 애니메이션을 매끄럽게 넣거나 React 19의 최신 Hook 활용 패턴을 찾을 때 가이드합니다.
* **보안 취약점 및 구글 토큰 관리**: `/api-security-checklist`
  * 구글 OAuth의 `access_token`이 안전하게 LocalStorage에 보관되고 만료 처리가 제대로 되는지 진단할 때 활용합니다.
