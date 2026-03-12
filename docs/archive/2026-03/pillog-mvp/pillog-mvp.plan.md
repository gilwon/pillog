# Pillog MVP Planning Document

> **Summary**: 건강기능식품 성분 분석 & 비교 플랫폼 MVP — 제품 검색, 성분 비교, 쉬운 해석, 1일 섭취량 대시보드
>
> **Project**: Pillog
> **Version**: 0.1.0
> **Author**: gilwon
> **Date**: 2026-03-12
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 건강기능식품 성분 정보가 전문 용어로 되어 있어 일반 소비자가 이해하기 어렵고, 여러 제품 간 성분 비교와 과잉 섭취 여부 확인이 불가능함 |
| **Solution** | 식약처 공공 데이터 기반으로 성분을 쉬운 말로 해석하고, 제품 간 비교 및 1일 섭취량 시각화를 제공하는 중립적 정보 플랫폼 |
| **Function/UX Effect** | 제품 검색 → 성분 해석 → 비교 → 섭취량 확인의 직관적 플로우로 영양제 선택에 자신감을 제공 |
| **Core Value** | 브랜드에 종속되지 않는 중립적 성분 정보 제공으로 소비자의 합리적 영양제 선택 지원 |

---

## 1. Overview

### 1.1 Purpose

건강기능식품 소비자가 전문 지식 없이도 영양제의 성분을 쉽게 이해하고, 제품 간 비교를 통해 합리적인 선택을 할 수 있도록 돕는 웹 플랫폼을 구축한다. MVP는 **웹(Next.js) 우선**으로 개발하며, 핵심 가치인 "성분 검색 → 쉬운 해석 → 비교 → 섭취량 확인" 플로우를 완성한다.

### 1.2 Background

- 한국 건기식 시장 규모 약 6조원, 연평균 10% 성장
- 기존 서비스(필리, 모노랩스)는 자사 제품 판매에 치중하여 중립적 성분 분석 서비스 부재
- 화장품 시장의 "화해" 앱이 성분 분석으로 성공한 선례 존재
- 식약처 공공 데이터(C003 API)로 품목/성분/기능성 데이터 확보 가능 확인 완료

### 1.3 Related Documents

- 기획서: `docs/pillog-project-overview.md`
- API 조사: `docs/pillog-api-research.md`

---

## 2. Scope

### 2.1 In Scope (MVP)

- [ ] 식약처 데이터 파이프라인 (C003 + 영양DB → 정규화 → Supabase)
- [ ] 제품 검색 (이름 검색, 한글 fuzzy matching)
- [ ] 제품 상세 (성분 목록, 기능성, 섭취방법, 주의사항)
- [ ] 성분 쉬운 해석 (전문 용어 → 일반어 번역, 규칙 기반)
- [ ] 성분 비교 (최대 4개 제품, 함량/권장량 대비 비율)
- [ ] 1일 영양소 섭취량 대시보드 (등록 영양제 기준 총 섭취량 vs RDI 시각화)
- [ ] 사용자 인증 (카카오/구글 소셜 로그인)
- [ ] 복용 기록 관리 (내 영양제 등록/삭제)
- [ ] 상호작용 체크 (등록 영양제 간 과잉 섭취 경고, UL 기반)
- [ ] 반응형 웹 디자인 (모바일 웹 포함)

### 2.2 Out of Scope

- 모바일 앱 (Expo/React Native) — 웹 검증 후 확장
- AI 성분 해석 (Claude/OpenAI API 연동) — Post-MVP
- 바코드 스캔 — 모바일 앱 출시 시
- 맞춤 추천 (건강 설문 기반) — P2 기능
- 커뮤니티 리뷰, 가격 비교, 복용 리마인더
- 프리미엄 구독 결제 시스템

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 식약처 C003 API에서 건강기능식품 데이터를 수집하여 DB에 저장 | High | Pending |
| FR-02 | 성분명 정규화 테이블 구축 (동일 성분 다른 표기 통합) | High | Pending |
| FR-03 | 제품명/성분명 검색 (pg_trgm 기반 fuzzy matching) | High | Pending |
| FR-04 | 제품 상세 페이지 (성분, 기능성, 섭취방법, 주의사항) | High | Pending |
| FR-05 | 성분 쉬운 해석 (전문 용어 → 일반어 매핑 테이블 기반 번역) | High | Pending |
| FR-06 | 제품 비교 (최대 4개, 성분 함량/RDI 대비 비율 테이블) | High | Pending |
| FR-07 | 사용자 인증 (Supabase Auth — 카카오/구글 소셜 로그인) | High | Pending |
| FR-08 | 내 영양제 등록/삭제 (복용 기록 관리) | Medium | Pending |
| FR-09 | 1일 영양소 섭취량 대시보드 (총 섭취량 vs RDI 시각화) | High | Pending |
| FR-10 | 등록 영양제 간 과잉 섭취 경고 (UL 초과 시 알림) | Medium | Pending |
| FR-11 | 제품 즐겨찾기 (관심 제품 저장/삭제) | Low | Pending |
| FR-12 | 비교 결과/영양제 목록 공유 (URL 링크 기반) | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 검색 응답 < 500ms | Vercel Analytics 모니터링 |
| Performance | 초기 로딩 < 3초 (LCP) | Lighthouse |
| Performance | Lighthouse 성능 점수 > 80 | Lighthouse CI |
| Security | Supabase RLS 기반 사용자 데이터 격리 | RLS 정책 테스트 |
| Security | 개인 건강 정보 최소 수집, 개인정보보호법 준수 | 정책 검토 |
| Accessibility | WCAG 2.1 AA, 최소 폰트 14px, 색대비 4.5:1 | axe DevTools |
| SEO | 주요 페이지 SSR/SSG, 메타 태그 최적화 | Google Search Console |
| Reliability | 데이터 파이프라인 실패 시 자동 재시도 (최대 3회) | GitHub Actions 로그 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 FR-01 ~ FR-10 (High/Medium) 기능 구현 완료
- [ ] 식약처 데이터 1,000개 이상 제품 DB 적재
- [ ] 성분명 정규화 테이블 주요 100개 이상 성분 매핑
- [ ] 주요 사용자 플로우 E2E 테스트 통과 (Playwright)
- [ ] 반응형 디자인 (desktop/mobile) 검증
- [ ] 면책 문구 및 출처 표시 적용

### 4.2 Quality Criteria

- [ ] 핵심 비즈니스 로직 유닛 테스트 (Vitest)
- [ ] 주요 페이지 E2E 테스트 (Playwright)
- [ ] Zero lint errors (ESLint + Prettier)
- [ ] TypeScript strict mode, no any
- [ ] Build 성공 (Vercel 배포 가능)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 식약처 API 호출 제한 (1일 1,000건) | High | High | CHNG_DT 증분 동기화, 초기 수집은 여러 날 분산 |
| 원재료명 표기 불일치 | High | High | 정규화 매핑 테이블 + 수동 큐레이션 프로세스 구축 |
| 성분 상호작용 데이터 부족 | Medium | High | MVP는 UL 기반 과잉 섭취 경고만, 상호작용은 Post-MVP |
| Supabase 무료 티어 한계 (500MB) | Medium | Medium | 데이터 선별 저장, 불필요 필드 제외, 인덱스 최적화 |
| 의료 행위 오해 리스크 | High | Low | 면책 문구 전 페이지 명시, "정보 제공" 포지셔닝 |
| 한글 검색 품질 (초성, 오타) | Medium | Medium | pg_trgm 확장 + similarity threshold 조정 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend, SaaS MVPs | ✅ |
| **Enterprise** | Strict layer separation, microservices | High-traffic systems | |

> **Dynamic** 선택 이유: Supabase BaaS 기반 풀스택 SaaS MVP, 인증/DB/스토리지 통합

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / React / Vue | **Next.js (App Router)** | SSR/SSG, SEO, Vercel 배포 최적화 |
| State Management | Context / Zustand / Redux | **Zustand** | 경량, 간단한 API, 복용 기록/비교 목록 관리 |
| API Client | fetch / axios / react-query | **TanStack Query + fetch** | 서버 상태 캐싱, 데이터 파이프라인 결과 관리 |
| Form Handling | react-hook-form / formik | **react-hook-form** | 경량, 성능 우수, 검색/설문 폼 처리 |
| Styling | Tailwind / CSS Modules | **Tailwind CSS** | 빠른 프로토타이핑, 반응형 유틸리티 |
| UI Components | shadcn/ui / Radix | **shadcn/ui** | 접근성 내장, Tailwind 통합, 커스터마이징 용이 |
| Testing | Jest / Vitest / Playwright | **Vitest + Playwright** | Vitest(유닛), Playwright(E2E) |
| Backend | Supabase / Custom Server | **Supabase** | Auth + PostgreSQL + Storage + RLS 통합 |
| Data Pipeline | GitHub Actions + Python | **GitHub Actions + Python** | 크론잡 기반 식약처 데이터 수집/정제 |
| Search | pg_trgm / Meilisearch | **pg_trgm (Supabase 내장)** | 추가 인프라 없이 fuzzy matching |
| Charts | Chart.js / Recharts / D3 | **Recharts** | React 친화, 섭취량 대시보드 시각화 |
| Monorepo | Turborepo / Nx | **단일 Next.js (MVP)** | MVP에서는 모노레포 불필요, 모바일 확장 시 Turborepo 도입 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

Folder Structure Preview:
┌─────────────────────────────────────────────────────┐
│ pillog/                                             │
│ ├── src/                                            │
│ │   ├── app/                  # Next.js App Router  │
│ │   │   ├── (auth)/           # 인증 관련 라우트     │
│ │   │   ├── products/         # 제품 검색/상세       │
│ │   │   ├── compare/          # 성분 비교            │
│ │   │   ├── dashboard/        # 섭취량 대시보드      │
│ │   │   └── my/               # 내 영양제 관리       │
│ │   ├── components/           # 공용 UI 컴포넌트     │
│ │   │   ├── ui/               # shadcn/ui 기본      │
│ │   │   └── common/           # 앱 공용 컴포넌트     │
│ │   ├── features/             # 기능별 모듈          │
│ │   │   ├── products/         # 제품 검색/상세 로직  │
│ │   │   ├── compare/          # 비교 로직            │
│ │   │   ├── ingredients/      # 성분 해석 로직       │
│ │   │   ├── dashboard/        # 대시보드 로직        │
│ │   │   └── my-supplements/   # 복용 기록 로직       │
│ │   ├── lib/                  # 유틸리티/설정        │
│ │   │   ├── supabase/         # Supabase 클라이언트  │
│ │   │   └── utils/            # 공용 유틸리티        │
│ │   └── types/                # TypeScript 타입 정의 │
│ ├── scripts/                  # 데이터 파이프라인     │
│ │   └── pipeline/             # Python 수집 스크립트 │
│ ├── supabase/                 # Supabase 설정       │
│ │   └── migrations/           # DB 마이그레이션      │
│ └── docs/                     # 프로젝트 문서        │
└─────────────────────────────────────────────────────┘
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [ ] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists (Phase 2 output)
- [ ] ESLint configuration (`.eslintrc.*`)
- [ ] Prettier configuration (`.prettierrc`)
- [ ] TypeScript configuration (`tsconfig.json`)

> 현재 프로젝트 초기 단계로 컨벤션 미정의 상태. Design 단계 전에 정의 필요.

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | missing | 컴포넌트: PascalCase, 함수: camelCase, 파일: kebab-case | High |
| **Folder structure** | missing | Dynamic 레벨 feature-based 구조 | High |
| **Import order** | missing | React → 외부 → 내부 → 타입 → 스타일 | Medium |
| **Environment variables** | missing | NEXT_PUBLIC_ 접두사 규칙 | High |
| **Error handling** | missing | try-catch + 사용자 친화 에러 메시지 | Medium |
| **DB naming** | missing | snake_case (PostgreSQL 관례) | High |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Client | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 | Client | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 관리자 키 | Server | ✅ |
| `FOOD_SAFETY_API_KEY` | 식품안전나라 인증키 | Server/Pipeline | ✅ |
| `DATA_GO_KR_API_KEY` | 공공데이터포털 인증키 | Server/Pipeline | ✅ |
| `SENTRY_DSN` | Sentry 에러 트래킹 | Client | ✅ |

### 7.4 Pipeline Integration

| Phase | Status | Document Location | Command |
|-------|:------:|-------------------|---------|
| Phase 1 (Schema) | ⬜ | `docs/01-plan/schema.md` | `/phase-1-schema` |
| Phase 2 (Convention) | ⬜ | `docs/01-plan/conventions.md` | `/phase-2-convention` |

---

## 8. Implementation Milestones

### Milestone 1: Data Foundation (Week 1-2)

- [ ] Supabase 프로젝트 생성 및 DB 스키마 설계
- [ ] 성분명 정규화 매핑 테이블 구축 (초기 100개 성분)
- [ ] Python 데이터 파이프라인 (C003 + 영양DB → 파싱 → 정규화 → DB)
- [ ] GitHub Actions 크론잡 설정

### Milestone 2: Core Features (Week 3-4)

- [ ] Next.js 프로젝트 초기 세팅 (App Router, Tailwind, shadcn/ui)
- [ ] 제품 검색 페이지 (pg_trgm fuzzy matching)
- [ ] 제품 상세 페이지 (성분, 기능성, 주의사항)
- [ ] 성분 쉬운 해석 (매핑 테이블 기반)

### Milestone 3: Comparison & Dashboard (Week 5-6)

- [ ] 성분 비교 기능 (최대 4개, RDI 대비 비율)
- [ ] 사용자 인증 (카카오/구글 소셜 로그인)
- [ ] 내 영양제 등록/관리
- [ ] 1일 섭취량 대시보드 (Recharts 시각화)

### Milestone 4: Safety & Polish (Week 7-8)

- [ ] 과잉 섭취 경고 (UL 초과)
- [ ] 반응형 디자인 최적화
- [ ] 면책 문구, 출처 표시, SEO 메타 태그
- [ ] E2E 테스트, 성능 최적화, Vercel 배포

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`pillog-mvp.design.md`) — DB 스키마, API 설계, 컴포넌트 구조
2. [ ] Phase 1 Schema 정의 (`/phase-1-schema`)
3. [ ] Phase 2 Convention 정의 (`/phase-2-convention`)
4. [ ] Supabase 프로젝트 생성 및 인증키 발급

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-12 | Initial draft — MVP scope, architecture, milestones | gilwon |
