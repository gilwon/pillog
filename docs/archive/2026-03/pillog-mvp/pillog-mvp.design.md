# Pillog MVP Design Document

> **Summary**: 건강기능식품 성분 분석 플랫폼 MVP — DB 스키마, API, 컴포넌트 설계
>
> **Project**: Pillog
> **Version**: 0.1.0
> **Author**: gilwon
> **Date**: 2026-03-12
> **Status**: Draft
> **Planning Doc**: [pillog-mvp.plan.md](../../01-plan/features/pillog-mvp.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A (이 문서에서 정의) |
| Phase 2 | Coding Conventions | N/A (이 문서에서 정의) |
| Phase 3 | Mockup | N/A |
| Phase 4 | API Spec | N/A (이 문서에서 정의) |

---

## 1. Overview

### 1.1 Design Goals

- 식약처 공공 데이터를 효율적으로 수집/정규화/저장하는 데이터 파이프라인 설계
- 제품 검색 → 성분 해석 → 비교 → 섭취량 확인의 일관된 사용자 플로우
- Supabase RLS 기반 안전한 사용자 데이터 관리
- 확장 가능한 feature-based 아키텍처 (모바일 앱 확장 대비)

### 1.2 Design Principles

- **Data First**: 데이터 파이프라인과 정규화가 서비스 품질의 핵심
- **Server Components First**: Next.js App Router SSR/SSG로 SEO + 성능 최적화
- **Progressive Enhancement**: 비로그인 사용자도 검색/비교 가능, 로그인 시 개인화 기능 해제
- **Separation of Concerns**: feature-based 모듈 구조로 기능별 독립성 보장

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Next.js App Router (SSR/SSG)               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │ Products │ │ Compare  │ │Dashboard │ │    My    │ │ │
│  │  │  Search  │ │   View   │ │  Charts  │ │Suppl.Mgr│ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │ │
│  │       └─────────────┴────────────┴────────────┘       │ │
│  │                      │                                  │ │
│  │  ┌──────────────────┴───────────────────────────────┐ │ │
│  │  │  Zustand Store (compare list, UI state)          │ │ │
│  │  │  TanStack Query (server state cache)             │ │ │
│  │  └──────────────────┬───────────────────────────────┘ │ │
│  └─────────────────────┼────────────────────────────────┘ │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│               Next.js API Routes (Edge)                      │
│  ┌─────────────────────┴───────────────────────────────────┐│
│  │  /api/products/search   /api/products/[id]               ││
│  │  /api/products/compare  /api/ingredients/[id]            ││
│  │  /api/my/supplements    /api/my/dashboard                ││
│  └─────────────────────┬───────────────────────────────────┘│
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│                    Supabase                                   │
│  ┌──────────┐  ┌───────┴──────┐  ┌──────────────────────┐  │
│  │   Auth   │  │  PostgreSQL  │  │      Storage         │  │
│  │ (Social) │  │  (+ pg_trgm) │  │  (product images)    │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│            Data Pipeline (GitHub Actions)                     │
│  ┌─────────────────────┴───────────────────────────────────┐│
│  │  Python Script (daily cron)                              ││
│  │  식약처 C003 API → Parse → Normalize → Supabase Insert   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
[제품 검색 플로우]
User Input → Search API → pg_trgm fuzzy match → Product List → Product Detail

[성분 비교 플로우]
Select Products (max 4) → Zustand Store → Compare API → Side-by-side Table

[섭취량 대시보드 플로우]
My Supplements → Calculate Total Nutrients → RDI/UL Comparison → Recharts Visualization

[데이터 파이프라인 플로우]
GitHub Actions (cron) → Python Script → C003 API Call → Parse RAWMTRL_NM
→ Normalize Ingredient Names → Insert/Update Supabase
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Product Search | Supabase pg_trgm | Fuzzy matching 검색 |
| Ingredient Interpretation | ingredient_aliases 테이블 | 성분명 정규화/해석 |
| Compare View | Zustand compare store | 비교 목록 클라이언트 상태 |
| Dashboard | user_supplements + nutrient_rdi | 섭취량 계산/시각화 |
| Auth | Supabase Auth | 카카오/구글 소셜 로그인 |
| Data Pipeline | GitHub Actions + Python | 식약처 데이터 수집/정제 |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// 건강기능식품 제품
interface Product {
  id: string;                    // UUID PK
  report_no: string;             // 품목제조번호 (식약처 PK) UNIQUE
  name: string;                  // 품목명
  company: string;               // 업소명 (제조사)
  primary_functionality: string; // 주된 기능성 (원문)
  functionality_tags: string[];  // 기능성 태그 (파싱됨)
  how_to_take: string | null;   // 섭취방법
  caution: string | null;        // 섭취 시 주의사항
  shape: string | null;          // 제품형태
  standard: string | null;       // 기준규격
  shelf_life: string | null;     // 소비기한
  storage_method: string | null; // 보관방법
  raw_materials: string | null;  // 원재료 (원문)
  image_url: string | null;      // 제품 이미지 URL
  reported_at: string | null;    // 보고일자
  synced_at: string;             // 마지막 동기화 일시
  created_at: string;
  updated_at: string;
}

// 성분 (정규화된 원료)
interface Ingredient {
  id: string;                    // UUID PK
  canonical_name: string;        // 정규화된 성분명 (대표명)
  category: string;              // 대분류 (비타민, 미네랄, 프로바이오틱스 등)
  subcategory: string | null;    // 중분류
  description: string | null;    // 일반인 대상 쉬운 설명
  primary_effect: string | null; // 주요 효과 (쉬운 말)
  daily_rdi: number | null;      // 1일 권장 섭취량 (mg/mcg/IU)
  daily_ul: number | null;       // 1일 상한 섭취량
  rdi_unit: string | null;       // 단위 (mg, mcg, IU 등)
  source_info: string | null;    // 출처 정보
  created_at: string;
  updated_at: string;
}

// 성분명 별칭 (정규화 매핑)
interface IngredientAlias {
  id: string;
  ingredient_id: string;         // FK → ingredients
  alias_name: string;            // 별칭 (예: "L-아스코르빈산")
  alias_type: 'scientific' | 'common' | 'brand' | 'abbreviation';
  created_at: string;
}

// 제품-성분 관계
interface ProductIngredient {
  id: string;
  product_id: string;            // FK → products
  ingredient_id: string;         // FK → ingredients
  amount: number | null;         // 함량 (숫자)
  amount_unit: string | null;    // 단위
  percentage_of_rdi: number | null; // RDI 대비 비율 (%)
  is_functional: boolean;        // 기능성 원료 여부
  created_at: string;
}

// 사용자 복용 영양제
interface UserSupplement {
  id: string;
  user_id: string;               // FK → auth.users
  product_id: string;            // FK → products
  daily_dose: number;            // 1일 복용 횟수 (기본 1)
  started_at: string | null;     // 복용 시작일
  note: string | null;           // 메모
  created_at: string;
  updated_at: string;
}

// 사용자 즐겨찾기
interface UserFavorite {
  id: string;
  user_id: string;               // FK → auth.users
  product_id: string;            // FK → products
  created_at: string;
}
```

### 3.2 Entity Relationships

```
[products] 1 ──── N [product_ingredients] N ──── 1 [ingredients]
                                                        │
                                                   1 ── N [ingredient_aliases]

[auth.users] 1 ──── N [user_supplements] N ──── 1 [products]
     │
     └── 1 ──── N [user_favorites] N ──── 1 [products]
```

### 3.3 Database Schema

```sql
-- 확장 모듈 활성화
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 건강기능식품 제품
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_no TEXT NOT NULL UNIQUE,          -- 품목제조번호 (식약처 PK)
  name TEXT NOT NULL,                      -- 품목명
  company TEXT NOT NULL DEFAULT '',        -- 업소명
  primary_functionality TEXT DEFAULT '',   -- 주된 기능성 (원문)
  functionality_tags TEXT[] DEFAULT '{}',  -- 기능성 태그 배열
  how_to_take TEXT,                        -- 섭취방법
  caution TEXT,                            -- 섭취 시 주의사항
  shape TEXT,                              -- 제품형태
  standard TEXT,                           -- 기준규격
  shelf_life TEXT,                         -- 소비기한
  storage_method TEXT,                     -- 보관방법
  raw_materials TEXT,                      -- 원재료 (원문)
  image_url TEXT,                          -- 제품 이미지
  reported_at DATE,                        -- 보고일자
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 검색 인덱스
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_company_trgm ON products USING GIN (company gin_trgm_ops);
CREATE INDEX idx_products_functionality_tags ON products USING GIN (functionality_tags);
CREATE INDEX idx_products_report_no ON products (report_no);

-- ============================================
-- 성분 (정규화)
-- ============================================
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,     -- 정규화된 대표명
  category TEXT NOT NULL DEFAULT '기타',   -- 대분류
  subcategory TEXT,                        -- 중분류
  description TEXT,                        -- 쉬운 설명
  primary_effect TEXT,                     -- 주요 효과
  daily_rdi NUMERIC,                       -- 1일 권장량
  daily_ul NUMERIC,                        -- 1일 상한량
  rdi_unit TEXT,                           -- 단위
  source_info TEXT,                        -- 출처
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingredients_name_trgm ON ingredients USING GIN (canonical_name gin_trgm_ops);
CREATE INDEX idx_ingredients_category ON ingredients (category);

-- ============================================
-- 성분명 별칭 (정규화 매핑)
-- ============================================
CREATE TABLE ingredient_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  alias_name TEXT NOT NULL,
  alias_type TEXT NOT NULL DEFAULT 'common'
    CHECK (alias_type IN ('scientific', 'common', 'brand', 'abbreviation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(alias_name)
);

CREATE INDEX idx_aliases_name_trgm ON ingredient_aliases USING GIN (alias_name gin_trgm_ops);
CREATE INDEX idx_aliases_ingredient ON ingredient_aliases (ingredient_id);

-- ============================================
-- 제품-성분 관계
-- ============================================
CREATE TABLE product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  amount NUMERIC,                          -- 함량
  amount_unit TEXT,                        -- 단위
  percentage_of_rdi NUMERIC,              -- RDI 대비 %
  is_functional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);

CREATE INDEX idx_pi_product ON product_ingredients (product_id);
CREATE INDEX idx_pi_ingredient ON product_ingredients (ingredient_id);

-- ============================================
-- 사용자 복용 영양제
-- ============================================
CREATE TABLE user_supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  daily_dose INTEGER NOT NULL DEFAULT 1,
  started_at DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_us_user ON user_supplements (user_id);

-- ============================================
-- 사용자 즐겨찾기
-- ============================================
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_uf_user ON user_favorites (user_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- products, ingredients, ingredient_aliases, product_ingredients: 모든 사용자 읽기 허용
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read" ON products FOR SELECT USING (true);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingredients_read" ON ingredients FOR SELECT USING (true);

ALTER TABLE ingredient_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aliases_read" ON ingredient_aliases FOR SELECT USING (true);

ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_read" ON product_ingredients FOR SELECT USING (true);

-- user_supplements: 본인 데이터만 CRUD
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "us_select" ON user_supplements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "us_insert" ON user_supplements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "us_update" ON user_supplements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "us_delete" ON user_supplements FOR DELETE USING (auth.uid() = user_id);

-- user_favorites: 본인 데이터만 CRUD
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uf_select" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "uf_insert" ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uf_update" ON user_favorites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "uf_delete" ON user_favorites FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ingredients_updated_at
  BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_supplements_updated_at
  BEFORE UPDATE ON user_supplements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 검색 함수 (pg_trgm fuzzy matching)
-- ============================================
CREATE OR REPLACE FUNCTION search_products(query TEXT, lim INTEGER DEFAULT 20)
RETURNS SETOF products AS $$
  SELECT *
  FROM products
  WHERE name % query OR company % query
  ORDER BY similarity(name, query) DESC
  LIMIT lim;
$$ LANGUAGE sql STABLE;
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth | FR |
|--------|------|-------------|------|----|
| GET | `/api/products/search` | 제품 검색 (fuzzy) | No | FR-03 |
| GET | `/api/products/[id]` | 제품 상세 (성분 포함) | No | FR-04 |
| GET | `/api/products/compare` | 제품 비교 (최대 4개) | No | FR-06 |
| GET | `/api/ingredients/[id]` | 성분 상세 (해석, RDI/UL) | No | FR-05 |
| GET | `/api/my/supplements` | 내 복용 영양제 목록 | Yes | FR-08 |
| POST | `/api/my/supplements` | 복용 영양제 등록 | Yes | FR-08 |
| DELETE | `/api/my/supplements/[id]` | 복용 영양제 삭제 | Yes | FR-08 |
| PATCH | `/api/my/supplements/[id]` | 복용 영양제 수정 (dose 등) | Yes | FR-08 |
| GET | `/api/my/dashboard` | 섭취량 대시보드 데이터 | Yes | FR-09 |
| GET | `/api/my/favorites` | 즐겨찾기 목록 | Yes | FR-11 |
| POST | `/api/my/favorites` | 즐겨찾기 추가 | Yes | FR-11 |
| DELETE | `/api/my/favorites/[id]` | 즐겨찾기 삭제 | Yes | FR-11 |

### 4.2 Detailed Specification

#### `GET /api/products/search`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | Yes | 검색어 (제품명 또는 성분명) |
| `category` | string | No | 기능성 태그 필터 |
| `page` | number | No | 페이지 (기본 1) |
| `limit` | number | No | 페이지당 수 (기본 20, 최대 50) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "종근당 비타민C 1000",
      "company": "종근당건강",
      "functionality_tags": ["항산화", "피부건강"],
      "shape": "정제",
      "similarity_score": 0.85
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "total_pages": 8
  }
}
```

#### `GET /api/products/[id]`

**Response (200):**
```json
{
  "id": "uuid",
  "name": "종근당 비타민C 1000",
  "company": "종근당건강",
  "report_no": "200400200012345",
  "primary_functionality": "[비타민C] ①항산화 ②피부건강 ③유해산소로부터 세포 보호",
  "functionality_tags": ["항산화", "피부건강"],
  "how_to_take": "1일 1회, 1회 1정을 물과 함께 섭취",
  "caution": "특정질환 등이 있는 경우 전문가와 상담 후 섭취",
  "shape": "정제",
  "shelf_life": "제조일로부터 24개월",
  "ingredients": [
    {
      "id": "uuid",
      "canonical_name": "비타민C",
      "description": "면역력 강화와 피부 건강에 도움을 주는 항산화 비타민",
      "amount": 1000,
      "amount_unit": "mg",
      "percentage_of_rdi": 1000,
      "daily_rdi": 100,
      "daily_ul": 2000,
      "rdi_unit": "mg",
      "is_functional": true
    }
  ],
  "disclaimer": "이 정보는 식약처 공공데이터를 기반으로 하며, 의학적 조언이 아닙니다."
}
```

#### `GET /api/products/compare?ids=uuid1,uuid2,uuid3`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `ids` | string | Yes | 쉼표 구분 제품 UUID (2~4개) |

**Response (200):**
```json
{
  "products": [
    { "id": "uuid1", "name": "제품A", "company": "회사A" },
    { "id": "uuid2", "name": "제품B", "company": "회사B" }
  ],
  "comparison_table": [
    {
      "ingredient": "비타민C",
      "category": "비타민",
      "rdi": 100,
      "ul": 2000,
      "unit": "mg",
      "products": {
        "uuid1": { "amount": 1000, "rdi_pct": 1000 },
        "uuid2": { "amount": 500, "rdi_pct": 500 }
      }
    }
  ]
}
```

#### `GET /api/my/dashboard`

**Response (200):**
```json
{
  "supplements": [
    { "product_name": "비타민C 1000", "daily_dose": 1 }
  ],
  "total_nutrients": [
    {
      "ingredient": "비타민C",
      "category": "비타민",
      "total_amount": 1500,
      "unit": "mg",
      "rdi": 100,
      "ul": 2000,
      "rdi_percentage": 1500,
      "ul_percentage": 75,
      "status": "caution"
    }
  ],
  "warnings": [
    {
      "ingredient": "비타민A",
      "message": "1일 상한 섭취량(UL)의 120%를 초과합니다. 과잉 섭취에 주의하세요.",
      "severity": "warning"
    }
  ]
}
```

**status 값:**
- `safe`: RDI 대비 0~150%, UL 미만
- `caution`: RDI 대비 150~300% 또는 UL의 70~100%
- `warning`: UL 초과

### 4.3 Error Response Format

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "요청한 제품을 찾을 수 없습니다.",
    "status": 404
  }
}
```

| Code | Status | Message |
|------|--------|---------|
| `VALIDATION_ERROR` | 400 | 입력값이 올바르지 않습니다 |
| `UNAUTHORIZED` | 401 | 로그인이 필요합니다 |
| `PRODUCT_NOT_FOUND` | 404 | 요청한 제품을 찾을 수 없습니다 |
| `COMPARE_LIMIT` | 400 | 비교는 2~4개 제품만 가능합니다 |
| `SUPPLEMENT_DUPLICATE` | 409 | 이미 등록된 영양제입니다 |
| `INTERNAL_ERROR` | 500 | 서버 오류가 발생했습니다 |

---

## 5. UI/UX Design

### 5.1 Page Structure

```
┌─────────────────────────────────────────────┐
│  Header (Logo, Search, Auth, Nav)           │
├─────────────────────────────────────────────┤
│                                             │
│  / (Home)                                   │
│    - Hero: 검색 바 (중앙)                    │
│    - 인기 기능성 태그 바로가기               │
│    - 최근 등록 제품                          │
│                                             │
│  /products?q=검색어                          │
│    - 검색 결과 리스트                        │
│    - 필터 (기능성 태그)                      │
│    - 비교 담기 버튼                          │
│                                             │
│  /products/[id]                             │
│    - 제품 기본 정보                          │
│    - 성분 목록 (쉬운 해석 포함)              │
│    - 기능성 태그                             │
│    - 섭취방법 / 주의사항                     │
│    - 액션: 비교 담기, 즐겨찾기, 내 영양제 등록│
│                                             │
│  /compare                                   │
│    - 선택 제품 (최대 4개)                    │
│    - 성분 비교 테이블                        │
│    - RDI 대비 막대 차트                      │
│    - 공유 버튼                               │
│                                             │
│  /dashboard (로그인 필수)                    │
│    - 내 영양제 목록                          │
│    - 1일 총 섭취량 차트 (RDI/UL 기준선)     │
│    - 과잉 섭취 경고 카드                     │
│                                             │
│  /my (로그인 필수)                           │
│    - 내 영양제 관리                          │
│    - 즐겨찾기                                │
│                                             │
├─────────────────────────────────────────────┤
│  Footer (면책문구, 출처, 링크)               │
└─────────────────────────────────────────────┘
```

### 5.2 User Flow

```
비로그인 사용자:
  홈 → 검색 → 제품 상세 → [비교 담기] → 비교 페이지 → [공유]
                         └→ [로그인 유도]

로그인 사용자:
  홈 → 검색 → 제품 상세 → [내 영양제 등록] → 대시보드
                         └→ [즐겨찾기]
                         └→ [비교 담기] → 비교 페이지
```

### 5.3 Component List

| Component | Location | Responsibility | FR |
|-----------|----------|----------------|----|
| `SearchBar` | `src/components/common/` | 제품 검색 입력 (debounce 300ms) | FR-03 |
| `ProductCard` | `src/features/products/components/` | 검색 결과 제품 카드 | FR-03 |
| `ProductDetail` | `src/features/products/components/` | 제품 상세 정보 표시 | FR-04 |
| `IngredientList` | `src/features/ingredients/components/` | 성분 목록 + 쉬운 해석 | FR-05 |
| `IngredientTooltip` | `src/features/ingredients/components/` | 성분 상세 팝오버 | FR-05 |
| `CompareTable` | `src/features/compare/components/` | 제품 비교 테이블 | FR-06 |
| `CompareBar` | `src/features/compare/components/` | 하단 비교 목록 바 (sticky) | FR-06 |
| `NutrientChart` | `src/features/dashboard/components/` | RDI/UL 대비 막대 차트 (Recharts) | FR-09 |
| `WarningCard` | `src/features/dashboard/components/` | 과잉 섭취 경고 카드 | FR-10 |
| `SupplementManager` | `src/features/my-supplements/components/` | 내 영양제 등록/삭제 | FR-08 |
| `AuthButton` | `src/components/common/` | 로그인/로그아웃 버튼 | FR-07 |
| `FunctionalityTag` | `src/components/common/` | 기능성 태그 뱃지 | FR-04 |
| `ShareButton` | `src/components/common/` | 공유 링크 복사 | FR-12 |
| `Disclaimer` | `src/components/common/` | 면책 문구 배너 | - |

---

## 6. Error Handling

### 6.1 Error Strategies by Layer

| Layer | Strategy | Example |
|-------|----------|---------|
| API Route | try-catch + structured error response | `{ error: { code, message, status } }` |
| TanStack Query | `onError` callback + toast notification | 검색 실패 시 "검색 중 오류가 발생했습니다" |
| Supabase Client | RLS 위반 → 401 자동 처리 | 비로그인 사용자의 개인 데이터 접근 차단 |
| Data Pipeline | 재시도 3회 + Slack/Discord 알림 | API 호출 실패 시 자동 재시도 |
| UI | Error Boundary + fallback UI | 컴포넌트 렌더링 오류 시 대체 UI 표시 |

### 6.2 User-Facing Error Messages

| Scenario | Message |
|----------|---------|
| 검색 결과 없음 | "'{검색어}'에 대한 결과를 찾지 못했습니다. 다른 키워드로 검색해보세요." |
| 네트워크 오류 | "네트워크 연결을 확인해주세요." |
| 비교 제한 초과 | "최대 4개 제품까지 비교할 수 있습니다." |
| 로그인 필요 | "이 기능을 사용하려면 로그인이 필요합니다." |
| 중복 등록 | "이미 등록된 영양제입니다." |

---

## 7. Security Considerations

- [x] Supabase RLS로 사용자 데이터 격리 (user_supplements, user_favorites)
- [x] 제품/성분 데이터는 public read, admin write (service_role_key로만 쓰기)
- [ ] API Route에서 입력값 검증 (zod schema validation)
- [ ] XSS 방지: React 자동 이스케이프 + dangerouslySetInnerHTML 미사용
- [ ] 환경변수 분리: NEXT_PUBLIC_ prefix만 클라이언트 노출
- [ ] Rate Limiting: Vercel Edge Middleware (검색 API 분당 60회)
- [ ] HTTPS 강제 (Vercel 기본)
- [ ] 면책 문구 전 페이지 표시

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Unit Test | 성분 파싱/정규화 로직, RDI/UL 계산, 검색 유틸 | Vitest |
| Integration Test | API Route 응답 검증, Supabase 쿼리 | Vitest + Supabase local |
| E2E Test | 검색 → 상세 → 비교 → 대시보드 플로우 | Playwright |

### 8.2 Test Cases (Key)

**Unit Tests:**
- [ ] `parseRawMaterials()`: 원재료 문자열 → 개별 성분 배열 분리
- [ ] `normalizIngredientName()`: 별칭 → 정규화된 이름 매핑
- [ ] `calculateNutrientStatus()`: 총 섭취량 → safe/caution/warning 판정
- [ ] `parseFunctionality()`: 기능성 텍스트 → 태그 배열 파싱

**E2E Tests:**
- [ ] 홈 → 검색 "비타민C" → 결과 리스트 표시
- [ ] 제품 상세 → 성분 목록에 쉬운 해석 표시
- [ ] 2개 제품 비교 담기 → 비교 페이지 → 테이블 표시
- [ ] 로그인 → 영양제 등록 → 대시보드에서 섭취량 차트 확인
- [ ] UL 초과 시 경고 카드 표시

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | Pages, UI 컴포넌트, 레이아웃 | `src/app/`, `src/components/` |
| **Application** | 기능별 hooks, 비즈니스 로직 | `src/features/*/hooks/`, `src/features/*/utils/` |
| **Domain** | 엔티티 타입, 비즈니스 규칙 (순수 함수) | `src/types/`, `src/features/*/types/` |
| **Infrastructure** | Supabase 클라이언트, API 호출 | `src/lib/supabase/`, `src/features/*/api/` |

### 9.2 Dependency Rules

```
Presentation ──→ Application ──→ Domain ←── Infrastructure
                      │
                      └──→ Infrastructure

Rule: Domain은 외부 의존성 없이 순수 TypeScript 타입/함수만
```

### 9.3 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| Product pages | Presentation | `src/app/products/` |
| `SearchBar`, `ProductCard` | Presentation | `src/features/products/components/` |
| `useProductSearch`, `useCompare` | Application | `src/features/products/hooks/` |
| `calculateNutrientStatus` | Domain | `src/features/dashboard/utils/` |
| `Product`, `Ingredient` types | Domain | `src/types/database.ts` |
| Supabase queries | Infrastructure | `src/lib/supabase/` |
| API route handlers | Infrastructure | `src/app/api/` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `ProductCard`, `SearchBar` |
| Hooks | camelCase, use prefix | `useProductSearch`, `useCompare` |
| Utils | camelCase | `parseRawMaterials`, `calculateNutrientStatus` |
| Constants | UPPER_SNAKE_CASE | `MAX_COMPARE_ITEMS`, `SEARCH_DEBOUNCE_MS` |
| Types/Interfaces | PascalCase | `Product`, `Ingredient`, `ApiResponse` |
| Files (component) | PascalCase.tsx | `ProductCard.tsx` |
| Files (utility) | kebab-case.ts | `parse-raw-materials.ts` |
| Folders | kebab-case | `my-supplements/`, `product-detail/` |
| DB columns | snake_case | `created_at`, `product_id`, `daily_rdi` |
| API routes | kebab-case | `/api/my/supplements` |
| Env vars | UPPER_SNAKE_CASE | `NEXT_PUBLIC_SUPABASE_URL` |

### 10.2 Import Order

```typescript
// 1. React / Next.js
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// 3. Internal absolute imports
import { Button } from '@/components/ui/button'
import { useProductSearch } from '@/features/products/hooks'

// 4. Relative imports
import { ProductCard } from './ProductCard'

// 5. Type imports
import type { Product } from '@/types/database'
```

### 10.3 Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase 관리자 키 (데이터 쓰기) |
| `FOOD_SAFETY_API_KEY` | Pipeline | 식품안전나라 인증키 |
| `DATA_GO_KR_API_KEY` | Pipeline | 공공데이터포털 인증키 |
| `SENTRY_DSN` | Client | 에러 트래킹 |

### 10.4 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Component naming | PascalCase, feature 폴더 하위 |
| File organization | Dynamic 레벨 feature-based 구조 |
| State management | Zustand (클라이언트), TanStack Query (서버) |
| Error handling | API Route: zod + structured error, UI: toast + Error Boundary |
| Data fetching | Server Components (기본), Client Components (인터랙티브) |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (Header, Footer, Providers)
│   ├── page.tsx                      # Home (검색 히어로)
│   ├── (auth)/
│   │   ├── login/page.tsx            # 로그인 페이지
│   │   └── callback/route.ts         # OAuth 콜백
│   ├── products/
│   │   ├── page.tsx                  # 검색 결과 페이지
│   │   └── [id]/page.tsx             # 제품 상세 페이지
│   ├── compare/
│   │   └── page.tsx                  # 비교 페이지
│   ├── dashboard/
│   │   └── page.tsx                  # 섭취량 대시보드
│   ├── my/
│   │   └── page.tsx                  # 내 영양제 + 즐겨찾기
│   └── api/
│       ├── products/
│       │   ├── search/route.ts       # GET /api/products/search
│       │   ├── compare/route.ts      # GET /api/products/compare
│       │   └── [id]/route.ts         # GET /api/products/[id]
│       ├── ingredients/
│       │   └── [id]/route.ts         # GET /api/ingredients/[id]
│       └── my/
│           ├── supplements/
│           │   ├── route.ts          # GET, POST
│           │   └── [id]/route.ts     # PATCH, DELETE
│           ├── dashboard/route.ts    # GET
│           └── favorites/
│               ├── route.ts          # GET, POST
│               └── [id]/route.ts     # DELETE
├── components/
│   ├── ui/                           # shadcn/ui components
│   └── common/
│       ├── SearchBar.tsx
│       ├── AuthButton.tsx
│       ├── FunctionalityTag.tsx
│       ├── ShareButton.tsx
│       └── Disclaimer.tsx
├── features/
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProductDetail.tsx
│   │   ├── hooks/
│   │   │   └── useProductSearch.ts
│   │   └── api/
│   │       └── products.ts           # Supabase 쿼리 함수
│   ├── compare/
│   │   ├── components/
│   │   │   ├── CompareTable.tsx
│   │   │   └── CompareBar.tsx
│   │   ├── hooks/
│   │   │   └── useCompare.ts
│   │   └── store/
│   │       └── compare-store.ts      # Zustand store
│   ├── ingredients/
│   │   ├── components/
│   │   │   ├── IngredientList.tsx
│   │   │   └── IngredientTooltip.tsx
│   │   └── utils/
│   │       ├── parse-raw-materials.ts
│   │       └── normalize-ingredient.ts
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── NutrientChart.tsx
│   │   │   └── WarningCard.tsx
│   │   └── utils/
│   │       └── calculate-nutrient-status.ts
│   └── my-supplements/
│       ├── components/
│       │   └── SupplementManager.tsx
│       └── hooks/
│           └── useMySupplements.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── middleware.ts             # Auth middleware
│   └── utils/
│       └── cn.ts                     # clsx + twMerge
├── types/
│   ├── database.ts                   # Supabase generated types
│   └── api.ts                        # API request/response types
└── stores/
    └── compare-store.ts              # Zustand: 비교 목록 상태
```

### 11.2 Implementation Order

1. [ ] **Supabase 프로젝트 초기 설정** — DB 스키마 마이그레이션 실행
2. [ ] **Next.js 프로젝트 초기 세팅** — App Router, Tailwind, shadcn/ui, 환경변수
3. [ ] **Supabase 클라이언트 설정** — `lib/supabase/client.ts`, `server.ts`
4. [ ] **타입 정의** — `types/database.ts` (Supabase CLI로 자동 생성)
5. [ ] **데이터 파이프라인** — Python 스크립트, 성분 파싱/정규화, GitHub Actions
6. [ ] **제품 검색 API + UI** — `search/route.ts`, `SearchBar`, `ProductCard`
7. [ ] **제품 상세 API + UI** — `[id]/route.ts`, `ProductDetail`, `IngredientList`
8. [ ] **성분 해석** — `IngredientTooltip`, 별칭/설명 데이터 표시
9. [ ] **비교 기능** — Zustand store, `CompareBar`, `CompareTable`
10. [ ] **인증** — Supabase Auth (카카오/구글), `AuthButton`, middleware
11. [ ] **복용 기록** — `SupplementManager`, CRUD API
12. [ ] **대시보드** — `NutrientChart`, `WarningCard`, 섭취량 계산 로직
13. [ ] **즐겨찾기/공유** — `favorites` API, `ShareButton`
14. [ ] **SEO/면책/반응형** — 메타 태그, `Disclaimer`, 반응형 최적화
15. [ ] **테스트/배포** — Vitest 유닛, Playwright E2E, Vercel 배포

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-12 | Initial draft — DB schema, API spec, component design, implementation order | gilwon |
