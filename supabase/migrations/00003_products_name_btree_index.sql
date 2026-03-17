-- B-tree index on products.name for efficient prev/next navigation ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_btree ON products (name);
