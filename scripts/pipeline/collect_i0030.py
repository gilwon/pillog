#!/usr/bin/env python3
"""
Pillog Data Pipeline - I-0040 API Collector

식약처 건강기능식품 기능성 원료 인정 현황(I-0040) API에서
기능성 원료 목록을 수집하여 ingredients 테이블에 upsert.

Usage:
    python collect_i0030.py [--dry-run]

Environment variables required:
    FOOD_SAFETY_API_KEY: API key for foodsafetykorea.go.kr
    NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
    SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
"""

import os
import sys
import json
import time
import logging
import argparse
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

API_KEY = os.environ.get("FOOD_SAFETY_API_KEY", "")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
BASE_URL = "http://openapi.foodsafetykorea.go.kr/api"
SERVICE_ID = "I-0040"
BATCH_SIZE = 1000


# ─── API ─────────────────────────────────────────────────────────────────────

def fetch_i0030(start: int, end: int) -> dict:
    """I0030 API 호출. C003와 동일한 패턴."""
    url = f"{BASE_URL}/{API_KEY}/{SERVICE_ID}/json/{start}/{end}"
    for attempt in range(3):
        try:
            req = Request(url)
            with urlopen(req, timeout=30) as response:
                text = response.read().decode("utf-8")
            if text.lstrip().startswith("<"):
                import re as _re
                match = _re.search(r"alert\('([^']+)'\)", text)
                msg = match.group(1) if match else "식약처 API 일시 오류"
                logger.warning(f"Attempt {attempt + 1}/3 — HTML response: {msg}")
                if attempt < 2:
                    time.sleep(2 * (attempt + 1))
                    continue
                raise ValueError(msg)
            return json.loads(text)
        except (URLError, HTTPError) as e:
            logger.warning(f"Attempt {attempt + 1}/3 failed: {e}")
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
            else:
                raise


def get_field(row: dict, *keys: str, default: str = "") -> str:
    """여러 후보 키 중 첫 번째로 값이 있는 것을 반환 (실제 필드명 불확실 대응)."""
    for key in keys:
        val = row.get(key, "")
        if val and str(val).strip():
            return str(val).strip()
    return default


def transform_ingredient(row: dict) -> dict | None:
    """
    I-0040 응답 행 → ingredients 레코드.

    확정 필드명 (2026-03-13 API 응답 확인):
      APLC_RAWMTRL_NM  : 신청원료명
      FNCLTY_CN        : 기능성 내용
      DAY_INTK_CN      : 1일 섭취량
      IFTKN_ATNT_MATR_CN : 섭취시 주의사항
    """
    name = (row.get("APLC_RAWMTRL_NM") or "").strip()
    if not name or len(name) < 2:
        return None

    functionality = (row.get("FNCLTY_CN") or "").strip()
    daily_intake = (row.get("DAY_INTK_CN") or "").strip()

    # description: 1일 섭취량 정보 (있을 때만)
    description = daily_intake[:300] if daily_intake else None

    return {
        "canonical_name": name,
        "category": "기능성 원료",
        "is_functional": True,
        "source_info": "식약처 I-0040 고시",
        "primary_effect": functionality[:500] if functionality else None,
        "description": description,
        "updated_at": datetime.utcnow().isoformat(),
    }


# ─── Supabase ─────────────────────────────────────────────────────────────────

def _headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def upsert_ingredients(rows: list[dict]) -> int:
    if not rows:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/ingredients?on_conflict=canonical_name"
    headers = {**_headers(), "Prefer": "resolution=merge-duplicates"}
    body = json.dumps(rows).encode()
    req = Request(url, data=body, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=60) as r:
            raw = r.read().decode().strip()
            if not raw:
                return len(rows)
            data = json.loads(raw)
            return len(data) if isinstance(data, list) else len(rows)
    except HTTPError as e:
        logger.error(f"Upsert failed: {e.code} {e.read().decode()[:200]}")
        return 0


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Collect I0030 functional ingredient data")
    parser.add_argument("--dry-run", action="store_true", help="Print results without writing to DB")
    args = parser.parse_args()

    if not API_KEY:
        logger.error("FOOD_SAFETY_API_KEY not set")
        sys.exit(1)
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Supabase credentials not set")
        sys.exit(1)

    # 1. 첫 호출: total_count + 응답 키 구조 확인
    logger.info("Fetching I0030 (page 1, field discovery)...")
    try:
        initial = fetch_i0030(1, 1)
        logger.info(f"Top-level response keys: {list(initial.keys())}")

        service_data = initial.get(SERVICE_ID, {})
        if not service_data:
            for key in initial:
                if isinstance(initial[key], dict) and "total_count" in initial[key]:
                    service_data = initial[key]
                    logger.info(f"Found service data under key: '{key}'")
                    break

        total = int(service_data.get("total_count", "0") or "0")
        logger.info(f"Total I0030 records: {total}")

        sample_rows = service_data.get("row", [])
        if sample_rows:
            logger.info(f"Sample row keys: {list(sample_rows[0].keys())}")
            logger.info(f"Sample row[0]: {json.dumps(sample_rows[0], ensure_ascii=False)}")

    except Exception as e:
        logger.error(f"Failed to get I0030 data: {e}")
        sys.exit(1)

    if total == 0:
        logger.warning("No I0030 records found. Check API key or service availability.")
        return

    # 2. 배치 수집
    total_collected = 0
    total_upserted = 0
    skipped = 0

    for start in range(1, total + 1, BATCH_SIZE):
        end = min(start + BATCH_SIZE - 1, total)
        logger.info(f"Fetching records {start}–{end} / {total}")

        try:
            data = fetch_i0030(start, end)
            svc = data.get(SERVICE_ID, {})
            rows = svc.get("row", [])

            # 배치 내 canonical_name 중복 제거 (같은 원료 여러 인정 건 존재)
            seen_names: dict[str, dict] = {}
            for row in rows:
                total_collected += 1
                ing = transform_ingredient(row)
                if not ing:
                    skipped += 1
                    continue
                name = ing["canonical_name"]
                if name not in seen_names:
                    seen_names[name] = ing
                # 이미 있으면 스킵 (첫 번째 인정 건 우선)
            ingredients = list(seen_names.values())

            if args.dry_run:
                for ing in ingredients[:5]:
                    logger.info(
                        f"  [DRY RUN] {ing['canonical_name']}"
                        f" — {(ing.get('primary_effect') or '')[:60]}"
                    )
                total_upserted += len(ingredients)
            else:
                count = upsert_ingredients(ingredients)
                total_upserted += count
                logger.info(f"Upserted {count} ingredients")

            time.sleep(0.3)

        except Exception as e:
            logger.error(f"Error processing batch {start}–{end}: {e}")
            continue

    # 3. 결과 요약
    logger.info("=" * 60)
    logger.info("I0030 Collection complete")
    logger.info(f"  Total API records : {total_collected}")
    logger.info(f"  Skipped (invalid) : {skipped}")
    logger.info(f"  {'Would upsert' if args.dry_run else 'Upserted'}: {total_upserted}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
