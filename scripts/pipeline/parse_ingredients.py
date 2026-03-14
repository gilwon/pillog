#!/usr/bin/env python3
"""
Pillog Ingredient Parser Pipeline

Parses raw_materials and standard fields from the products table
and populates the product_ingredients table.

Usage:
    python parse_ingredients.py [--batch-size 500] [--dry-run]

Environment variables required (same as collect_c003.py):
    NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
    SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
"""

import os
import re
import sys
import json
import time
import logging
import argparse
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# 함량 단위 패턴: "500 mg", "10μg", "1,000mg", "10억 CFU" 등
AMOUNT_PATTERN = re.compile(
    r'(\d[\d,]*(?:\.\d+)?)\s*'
    r'(mg|μg|ug|mcg|IU|g|CFU|억\s*CFU|만\s*CFU|천\s*CFU)',
    re.IGNORECASE
)

UNIT_NORMALIZE = {
    'ug': 'μg',
    'mcg': 'μg',
    'cfu': 'CFU',
    '억 cfu': 'CFU',
    '억cfu': 'CFU',
    '만 cfu': 'CFU',
    '만cfu': 'CFU',
    '천 cfu': 'CFU',
    '천cfu': 'CFU',
}


# ============================================
# Supabase REST helpers
# ============================================

def _headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def supabase_get(path: str, params: dict = None) -> list:
    """GET from Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())
    req = Request(url, headers=_headers())
    try:
        with urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except HTTPError as e:
        logger.error(f"GET {path} failed: {e.code} {e.read().decode()}")
        return []
    except URLError as e:
        logger.error(f"GET {path} network error: {e}")
        return []


def supabase_upsert(path: str, rows: list) -> bool:
    """Upsert rows to Supabase (POST with merge-duplicates)."""
    if not rows:
        return True
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {**_headers(), "Prefer": "resolution=merge-duplicates"}
    body = json.dumps(rows).encode()
    req = Request(url, data=body, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=60) as r:
            return r.status < 300
    except HTTPError as e:
        logger.error(f"UPSERT {path} failed: {e.code} {e.read().decode()[:200]}")
        return False
    except URLError as e:
        logger.error(f"UPSERT {path} network error: {e}")
        return False


# ============================================
# Alias map loading
# ============================================

def load_alias_map() -> dict[str, dict]:
    """
    Build alias map: {lowercase_alias: {id, canonical_name}}.
    Includes both canonical names and all aliases.
    """
    alias_map: dict[str, dict] = {}

    # Load canonical names
    ingredients = supabase_get(
        "ingredients",
        {"select": "id,canonical_name", "limit": "1000"},
    )
    for ing in ingredients:
        key = ing["canonical_name"].lower().strip()
        alias_map[key] = {"id": ing["id"], "canonical_name": ing["canonical_name"]}

    # Load aliases (join with ingredients)
    aliases = supabase_get(
        "ingredient_aliases",
        {
            "select": "alias_name,ingredient_id",
            "limit": "10000",
        },
    )
    # Build ingredient id → canonical_name lookup
    id_to_name = {ing["id"]: ing["canonical_name"] for ing in ingredients}

    for row in aliases:
        key = row["alias_name"].lower().strip()
        ing_id = row["ingredient_id"]
        alias_map[key] = {
            "id": ing_id,
            "canonical_name": id_to_name.get(ing_id, ""),
        }

    logger.info(f"Loaded alias map: {len(alias_map)} entries ({len(ingredients)} canonical)")
    return alias_map


# ============================================
# Parsing logic
# ============================================

def parse_raw_materials(raw: str) -> list[str]:
    """
    Split raw_materials string into candidate ingredient names.

    Example input:
      "홍삼농축액(농축물),시클로덱스트린시럽,액상프락토올리고당(고형분기준 55%),정제수"
    Returns:
      ["홍삼농축액", "시클로덱스트린시럽", "액상프락토올리고당", "정제수"]
    """
    if not raw:
        return []

    # Remove percentage-only parenthetical content (not ingredient names)
    text = re.sub(r'\([^)]*%[^)]*\)', '', raw)
    # Remove "이상", "이하" trailing phrases
    text = re.sub(r'\s*(이상|이하|함유)\s*', '', text)

    parts = [p.strip() for p in text.split(',')]
    results = []
    for part in parts:
        # Strip parenthetical notes: "홍삼농축액(농축물)" → "홍삼농축액"
        name = re.sub(r'\([^)]*\)', '', part).strip()
        # Normalize whitespace
        name = re.sub(r'\s+', ' ', name).strip()
        # Skip too short or numeric-only entries
        if name and len(name) >= 2 and not re.match(r'^[\d.]+$', name):
            results.append(name)
    return results


def parse_amount(standard: str, canonical_name: str) -> tuple[float | None, str | None]:
    """
    Try to extract the amount (value + unit) for a given ingredient
    from the standard/specification field.

    Example: standard="비타민C 500mg, 아연 10mg" + canonical_name="비타민C"
    Returns: (500.0, "mg")
    """
    if not standard or not canonical_name:
        return None, None

    # Find the ingredient name in standard text, then grab nearby number+unit
    # Strategy: find the name position, then search ±50 chars for amount
    name_lower = canonical_name.lower()
    std_lower = standard.lower()
    idx = std_lower.find(name_lower)
    if idx == -1:
        return None, None

    window = standard[max(0, idx): idx + len(canonical_name) + 50]
    matches = AMOUNT_PATTERN.findall(window)
    if matches:
        amount_str, unit = matches[0]
        amount = float(amount_str.replace(',', ''))
        unit_normalized = UNIT_NORMALIZE.get(unit.lower(), unit)
        return amount, unit_normalized
    return None, None


def match_ingredient(name: str, alias_map: dict) -> dict | None:
    """
    Find matching ingredient for a given raw material name.
    1. Exact lowercase match
    2. Partial match (alias contained in name, or name contained in alias)
       — only for alias length >= 3 to avoid false positives
    """
    key = name.lower().strip()

    # Exact match
    if key in alias_map:
        return alias_map[key]

    # Partial match
    for alias, ing in alias_map.items():
        if len(alias) >= 3:
            if alias in key or (len(key) >= 3 and key in alias):
                return ing
    return None


# ============================================
# Main pipeline
# ============================================

def process_products(batch_size: int = 500, dry_run: bool = False) -> None:
    alias_map = load_alias_map()
    if not alias_map:
        logger.error("Alias map is empty — run seed SQL first!")
        sys.exit(1)

    offset = 0
    total_pi_rows = 0
    total_products = 0
    matched_products = 0

    logger.info(f"Starting ingredient parsing (batch_size={batch_size}, dry_run={dry_run})")

    while True:
        products = supabase_get(
            "products",
            {
                "select": "id,raw_materials,standard",
                "limit": str(batch_size),
                "offset": str(offset),
                "order": "created_at.asc",
            },
        )

        if not products:
            break

        pi_batch: list[dict] = []
        for product in products:
            pid = product["id"]
            raw = product.get("raw_materials") or ""
            standard = product.get("standard") or ""

            names = parse_raw_materials(raw)
            seen_ingredient_ids: set[str] = set()

            for name in names:
                ing = match_ingredient(name, alias_map)
                if not ing or ing["id"] in seen_ingredient_ids:
                    continue
                seen_ingredient_ids.add(ing["id"])

                amount, unit = parse_amount(standard, ing["canonical_name"])
                pi_batch.append({
                    "product_id": pid,
                    "ingredient_id": ing["id"],
                    "amount": amount,
                    "amount_unit": unit,
                    "is_functional": False,
                })

            if seen_ingredient_ids:
                matched_products += 1

        total_products += len(products)
        total_pi_rows += len(pi_batch)

        if pi_batch and not dry_run:
            ok = supabase_upsert("product_ingredients", pi_batch)
            status = "OK" if ok else "FAILED"
            logger.info(
                f"Offset {offset:>6}: {len(products)} products → "
                f"{len(pi_batch)} ingredient rows [{status}] "
                f"(total: {total_pi_rows})"
            )
        else:
            logger.info(
                f"Offset {offset:>6}: {len(products)} products → "
                f"{len(pi_batch)} ingredient rows [DRY RUN]"
            )

        offset += batch_size
        if len(products) < batch_size:
            break

        time.sleep(0.05)  # Avoid rate limiting

    coverage = (matched_products / total_products * 100) if total_products else 0
    logger.info("=" * 60)
    logger.info(f"Done!")
    logger.info(f"  Total products processed : {total_products:,}")
    logger.info(f"  Products with ≥1 match   : {matched_products:,} ({coverage:.1f}%)")
    logger.info(f"  Total product_ingredients: {total_pi_rows:,}")
    if dry_run:
        logger.info("  [DRY RUN] No data was written.")
    logger.info("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse raw_materials → product_ingredients")
    parser.add_argument(
        "--batch-size", type=int, default=500,
        help="Products per API request (default: 500)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Parse and count without writing to DB"
    )
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    process_products(batch_size=args.batch_size, dry_run=args.dry_run)
