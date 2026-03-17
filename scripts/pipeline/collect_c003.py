#!/usr/bin/env python3
"""
Pillog Data Pipeline - C003 API Collector

Collects health functional food data from the Korea Food Safety (MFDS)
C003 API and inserts/updates products into Supabase.

Usage:
    python collect_c003.py [--full] [--since YYYY-MM-DD]

Environment variables required:
    FOOD_SAFETY_API_KEY: API key for foodsafetykorea.go.kr
    NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
    SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
"""

import os
import sys
import json
import time
import re
import argparse
import logging
from datetime import datetime, timedelta, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# Config
API_KEY = os.environ.get("FOOD_SAFETY_API_KEY", "")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
BASE_URL = "http://openapi.foodsafetykorea.go.kr/api"
SERVICE_ID = "C003"
BATCH_SIZE = 1000  # Items per API request (max 1000)
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


def fetch_c003(start: int, end: int, change_date: str = "") -> dict:
    """Fetch data from C003 API."""
    url = f"{BASE_URL}/{API_KEY}/{SERVICE_ID}/json/{start}/{end}"
    if change_date:
        url += f"/CHNG_DT={change_date}"

    for attempt in range(MAX_RETRIES):
        try:
            req = Request(url)
            with urlopen(req, timeout=30) as response:
                text = response.read().decode("utf-8")

            # 식약처 API는 오류 시 HTTP 200 + HTML을 반환함
            if text.lstrip().startswith("<"):
                import re as _re
                match = _re.search(r"alert\('([^']+)'\)", text)
                msg = match.group(1) if match else "식약처 API 일시 오류"
                logger.warning(f"Attempt {attempt + 1}/{MAX_RETRIES} — HTML response: {msg}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                raise ValueError(msg)

            return json.loads(text)

        except (URLError, HTTPError) as e:
            logger.warning(f"Attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
            else:
                raise


def parse_functionality_tags(functionality: str) -> list[str]:
    """Parse PRIMARY_FNCLTY field into individual functionality tags."""
    if not functionality:
        return []

    tags = []
    # Remove category markers like [비타민C]
    text = re.sub(r"\[.+?\]", "", functionality)

    # Split by circled numbers or semicolons
    parts = re.split(r"[①②③④⑤⑥⑦⑧⑨⑩;]", text)

    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Clean up common suffixes
        part = re.sub(r"에\s*도움을?\s*줄?\s*수\s*있[음습]", "", part)
        part = re.sub(r"에\s*도움", "", part)
        part = part.strip()
        if len(part) >= 2:
            tags.append(part)

    return tags[:10]  # Limit to 10 tags


def transform_product(item: dict) -> dict:
    """Transform C003 API response item to product record."""
    functionality = item.get("PRIMARY_FNCLTY", "") or ""
    tags = parse_functionality_tags(functionality)

    reported_at = None
    prms_dt = item.get("PRMS_DT", "")
    if prms_dt and len(prms_dt) >= 8:
        try:
            reported_at = datetime.strptime(prms_dt[:8], "%Y%m%d").strftime("%Y-%m-%d")
        except ValueError:
            pass

    return {
        "report_no": item.get("PRDLST_REPORT_NO", ""),
        "name": item.get("PRDLST_NM", "").strip(),
        "company": (item.get("BSSH_NM", "") or "").strip(),
        "primary_functionality": functionality,
        "functionality_tags": tags,
        "how_to_take": item.get("NTK_MTHD") or None,
        "caution": item.get("IFTKN_ATNT_MATR_CN") or None,
        "shape": (item.get("PRDT_SHAP_CD_NM") or item.get("DISPOS")) or None,
        "standard": item.get("STDR_STND") or None,
        "shelf_life": item.get("POG_DAYCNT") or None,
        "storage_method": item.get("CSTDY_MTHD") or None,
        "raw_materials": item.get("RAWMTRL_NM") or None,
        "reported_at": reported_at,
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }


def upsert_products(products: list[dict]) -> int:
    """Upsert products to Supabase via REST API."""
    if not products:
        return 0

    url = f"{SUPABASE_URL}/rest/v1/products?on_conflict=report_no"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    # Supabase upsert via POST with on_conflict
    data = json.dumps(products).encode("utf-8")
    req = Request(url, data=data, headers=headers, method="POST")

    try:
        with urlopen(req, timeout=30) as response:
            return len(products)
    except HTTPError as e:
        body = e.read().decode("utf-8")
        logger.error(f"Upsert failed: {e.code} {body}")
        return 0


def main():
    parser = argparse.ArgumentParser(description="Collect C003 API data")
    parser.add_argument("--full", action="store_true", help="Full collection (all records)")
    parser.add_argument("--since", type=str, help="Collect changes since date (YYYY-MM-DD)")
    args = parser.parse_args()

    if not API_KEY:
        logger.error("FOOD_SAFETY_API_KEY not set")
        sys.exit(1)
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Supabase credentials not set")
        sys.exit(1)

    change_date = ""
    if args.since:
        change_date = args.since.replace("-", "")
    elif not args.full:
        # Default: yesterday's changes
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y%m%d")
        change_date = yesterday

    logger.info(f"Starting C003 collection (change_date={change_date or 'FULL'})")

    # First request to get total count
    try:
        initial = fetch_c003(1, 1, change_date)
        service_data = initial.get(SERVICE_ID, {})
        total = int(service_data.get("total_count", "0"))
        logger.info(f"Total records: {total}")
    except Exception as e:
        logger.error(f"Failed to get total count: {e}")
        sys.exit(1)

    if total == 0:
        logger.info("No records to process")
        return

    # Collect in batches
    total_upserted = 0
    for start in range(1, total + 1, BATCH_SIZE):
        end = min(start + BATCH_SIZE - 1, total)
        logger.info(f"Fetching records {start}-{end} of {total}")

        try:
            data = fetch_c003(start, end, change_date)
            rows = data.get(SERVICE_ID, {}).get("row", [])

            products = []
            for row in rows:
                report_no = row.get("PRDLST_REPORT_NO", "")
                if not report_no:
                    continue
                products.append(transform_product(row))

            count = upsert_products(products)
            total_upserted += count
            logger.info(f"Upserted {count} products")

            # Rate limiting
            time.sleep(0.5)

        except Exception as e:
            logger.error(f"Error processing batch {start}-{end}: {e}")
            continue

    logger.info(f"Collection complete. Total upserted: {total_upserted}")


if __name__ == "__main__":
    main()
