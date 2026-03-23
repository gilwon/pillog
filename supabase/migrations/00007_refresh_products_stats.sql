-- 동기화 후 products 테이블 통계 갱신 (planned count 정확도 개선)
CREATE OR REPLACE FUNCTION refresh_products_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ANALYZE products;
END;
$$;
