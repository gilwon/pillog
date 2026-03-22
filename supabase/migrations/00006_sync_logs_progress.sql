-- ============================================================
-- Sync Logs Progress Columns
-- 동기화 진행 중 배치 진행률 추적
-- ============================================================

ALTER TABLE sync_logs
  ADD COLUMN progress_batch        INT NOT NULL DEFAULT 0,
  ADD COLUMN progress_total_batches INT NOT NULL DEFAULT 0;
