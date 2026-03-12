-- ============================================
-- Pillog MVP - Initial Schema Migration
-- ============================================

-- 확장 모듈 활성화
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 건강기능식품 제품
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  primary_functionality TEXT DEFAULT '',
  functionality_tags TEXT[] DEFAULT '{}',
  how_to_take TEXT,
  caution TEXT,
  shape TEXT,
  standard TEXT,
  shelf_life TEXT,
  storage_method TEXT,
  raw_materials TEXT,
  image_url TEXT,
  reported_at DATE,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_company_trgm ON products USING GIN (company gin_trgm_ops);
CREATE INDEX idx_products_functionality_tags ON products USING GIN (functionality_tags);
CREATE INDEX idx_products_report_no ON products (report_no);

-- ============================================
-- 성분 (정규화)
-- ============================================
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT '기타',
  subcategory TEXT,
  description TEXT,
  primary_effect TEXT,
  daily_rdi NUMERIC,
  daily_ul NUMERIC,
  rdi_unit TEXT,
  source_info TEXT,
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
  amount NUMERIC,
  amount_unit TEXT,
  percentage_of_rdi NUMERIC,
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

-- products: 모든 사용자 읽기 허용
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_read" ON products FOR SELECT USING (true);

-- ingredients: 모든 사용자 읽기 허용
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingredients_read" ON ingredients FOR SELECT USING (true);

-- ingredient_aliases: 모든 사용자 읽기 허용
ALTER TABLE ingredient_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aliases_read" ON ingredient_aliases FOR SELECT USING (true);

-- product_ingredients: 모든 사용자 읽기 허용
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
CREATE OR REPLACE FUNCTION search_products(query TEXT, lim INTEGER DEFAULT 20, off_set INTEGER DEFAULT 0)
RETURNS TABLE(
  id UUID,
  name TEXT,
  company TEXT,
  functionality_tags TEXT[],
  shape TEXT,
  similarity_score REAL
) AS $$
  SELECT
    p.id,
    p.name,
    p.company,
    p.functionality_tags,
    p.shape,
    GREATEST(similarity(p.name, query), similarity(p.company, query)) AS similarity_score
  FROM products p
  WHERE p.name % query OR p.company % query
  ORDER BY similarity_score DESC
  LIMIT lim
  OFFSET off_set;
$$ LANGUAGE sql STABLE;

-- 검색 결과 총 건수 함수
CREATE OR REPLACE FUNCTION count_search_products(query TEXT)
RETURNS BIGINT AS $$
  SELECT COUNT(*)
  FROM products p
  WHERE p.name % query OR p.company % query;
$$ LANGUAGE sql STABLE;
