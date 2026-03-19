-- 관리자 제품 목록 정렬 성능 개선 인덱스
CREATE INDEX IF NOT EXISTS idx_products_reported_at ON products (reported_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);
