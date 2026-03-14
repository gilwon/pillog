#!/usr/bin/env python3
"""
Pillog Ingredient Sync Pipeline

두 가지 모드:
  1. extract  : products.raw_materials에서 미매칭 성분명을 찾아 ingredients 테이블에 추가
  2. match    : 알려진 성분으로 product_ingredients 연결 테이블 채우기

Usage:
    python collect_ingredients.py extract [--batch-size 500] [--dry-run]
    python collect_ingredients.py match   [--batch-size 500] [--dry-run]

Environment variables required:
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

AMOUNT_PATTERN = re.compile(
    r"(\d[\d,]*(?:\.\d+)?)\s*(mg|μg|ug|mcg|IU|g|CFU|억\s*CFU|만\s*CFU|천\s*CFU)",
    re.IGNORECASE,
)
UNIT_NORMALIZE = {
    "ug": "μg", "mcg": "μg", "cfu": "CFU",
    "억 cfu": "CFU", "억cfu": "CFU",
    "만 cfu": "CFU", "만cfu": "CFU",
    "천 cfu": "CFU", "천cfu": "CFU",
}


# ─── Supabase REST helpers ───────────────────────────────────────────────────

def _headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def supabase_get(path: str, params: dict = None) -> list | None:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())
    req = Request(url, headers=_headers())
    try:
        with urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except HTTPError as e:
        logger.error(f"GET {path} failed: {e.code} {e.read().decode()[:200]}")
        return None
    except URLError as e:
        logger.error(f"GET {path} network error: {e}")
        return None


def supabase_get_count(path: str, params: dict = None) -> int:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())
    headers = {**_headers(), "Prefer": "count=exact", "Range-Unit": "items", "Range": "0-0"}
    req = Request(url, headers=headers)
    try:
        with urlopen(req, timeout=30) as r:
            cr = r.headers.get("Content-Range", "")
            if "/" in cr:
                return int(cr.split("/")[1])
    except Exception:
        pass
    return 0


def supabase_upsert(path: str, rows: list, on_conflict: str = "", ignore_duplicates: bool = False) -> int:
    if not rows:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    prefer = "resolution=ignore-duplicates" if ignore_duplicates else "resolution=merge-duplicates"
    headers = {**_headers(), "Prefer": prefer}
    if on_conflict:
        url += f"?on_conflict={on_conflict}"
    body = json.dumps(rows).encode()
    req = Request(url, data=body, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=60) as r:
            raw = r.read().decode().strip()
            if not raw:
                return len(rows)  # 빈 응답 = 모두 처리됨으로 간주
            data = json.loads(raw)
            return len(data) if isinstance(data, list) else len(rows)
    except HTTPError as e:
        logger.error(f"UPSERT {path} failed: {e.code} {e.read().decode()[:200]}")
        return 0
    except URLError as e:
        logger.error(f"UPSERT {path} network error: {e}")
        return 0


# ─── Parsing logic ───────────────────────────────────────────────────────────

def parse_raw_materials(raw: str) -> list[str]:
    if not raw:
        return []
    text = re.sub(r"\([^)]*%[^)]*\)", "", raw)
    text = re.sub(r"\s*(이상|이하|함유)\s*", "", text)
    results = []
    for part in text.split(","):
        name = re.sub(r"\([^)]*\)", "", part).strip()
        name = re.sub(r"\s+", " ", name).strip()
        if name and len(name) >= 2 and not re.match(r"^[\d.]+$", name):
            results.append(name)
    return results


def parse_amount(standard: str, canonical_name: str) -> tuple[float | None, str | None]:
    if not standard or not canonical_name:
        return None, None
    std_lower = standard.lower()
    idx = std_lower.find(canonical_name.lower())
    if idx == -1:
        return None, None
    window = standard[idx: idx + len(canonical_name) + 50]
    m = AMOUNT_PATTERN.search(window)
    if m:
        amount = float(m.group(1).replace(",", ""))
        unit = UNIT_NORMALIZE.get(m.group(2).lower(), m.group(2))
        return amount, unit
    return None, None


def match_ingredient(name: str, alias_map: dict) -> dict | None:
    key = name.lower().strip()
    if key in alias_map:
        return alias_map[key]
    for alias, ing in alias_map.items():
        if len(alias) >= 3 and (alias in key or (len(key) >= 3 and key in alias)):
            return ing
    return None


# ─── Mode: extract ───────────────────────────────────────────────────────────

def load_i0030_names() -> set[str]:
    """DB에서 is_functional=true 성분 이름 SET 로드 (노이즈 구분용)."""
    rows = supabase_get(
        "ingredients",
        {"select": "canonical_name", "is_functional": "eq.true", "limit": "10000"},
    ) or []
    return {r["canonical_name"].lower().strip() for r in rows}


def run_extract(batch_size: int, dry_run: bool) -> None:
    logger.info("=== Mode: extract (미매칭 성분 추출) ===")

    # 1. 기존 알려진 이름 로드
    known: set[str] = set()
    ingredients = supabase_get("ingredients", {"select": "canonical_name", "limit": "10000"})
    aliases = supabase_get("ingredient_aliases", {"select": "alias_name", "limit": "100000"})
    for i in ingredients:
        known.add(i["canonical_name"].lower().strip())
    for a in aliases:
        known.add(a["alias_name"].lower().strip())
    logger.info(f"Known names: {len(known)}")

    # I0030 기능성 원료 이름 SET (매칭 시 is_functional=true)
    i0030_names = load_i0030_names()
    logger.info(f"I0030 functional names: {len(i0030_names)}")

    # 2. 제품 배치 스캔
    total = supabase_get_count("products", {"raw_materials": "not.is.null"}) or \
            len(supabase_get("products", {"select": "id", "raw_materials": "not.is.null", "limit": "1"}))
    logger.info(f"Total products with raw_materials: {total}")

    candidates: dict[str, int] = {}
    offset = 0
    while True:
        products = supabase_get(
            "products",
            {"select": "raw_materials", "raw_materials": "not.is.null",
             "limit": str(batch_size), "offset": str(offset), "order": "created_at.asc"},
        )
        if not products:
            break
        for p in products:
            for name in parse_raw_materials(p.get("raw_materials") or ""):
                if name.lower() not in known:
                    candidates[name] = candidates.get(name, 0) + 1
        offset += batch_size
        logger.info(f"Scanned {offset}/{total} products — candidates: {len(candidates)}")
        if len(products) < batch_size:
            break
        time.sleep(0.05)

    logger.info(f"Found {len(candidates)} unmatched ingredient candidates")

    if dry_run:
        logger.info("[DRY RUN] Top 20 candidates:")
        for name, cnt in sorted(candidates.items(), key=lambda x: -x[1])[:20]:
            name_lower = name.lower().strip()
            is_func = any(
                i0 in name_lower or name_lower in i0
                for i0 in i0030_names if len(i0) >= 3
            )
            flag = "[functional]" if is_func else "[noise?]"
            logger.info(f"  {cnt:>4}x  {flag}  {name}")
        return

    # 3. DB 삽입 (등장 횟수 내림차순, is_functional 구분)
    new_ingredients = []
    for name, _ in sorted(candidates.items(), key=lambda x: -x[1]):
        name_lower = name.lower().strip()
        is_func = any(
            i0 in name_lower or name_lower in i0
            for i0 in i0030_names if len(i0) >= 3
        )
        new_ingredients.append({
            "canonical_name": name,
            "category": "기능성 원료" if is_func else "미분류",
            "is_functional": is_func,
            "source_info": "제품 원재료 자동 추출",
        })

    func_count = sum(1 for i in new_ingredients if i["is_functional"])
    logger.info(f"  is_functional=true  : {func_count}")
    logger.info(f"  is_functional=false : {len(new_ingredients) - func_count} (노이즈/부형제 포함)")

    inserted = 0
    for i in range(0, len(new_ingredients), 100):
        chunk = new_ingredients[i: i + 100]
        inserted += supabase_upsert("ingredients", chunk, on_conflict="canonical_name", ignore_duplicates=True)

    logger.info(f"Inserted {inserted} new ingredients (from {len(candidates)} candidates)")


# ─── Mode: match ─────────────────────────────────────────────────────────────

def run_match(batch_size: int, dry_run: bool) -> None:
    logger.info("=== Mode: match (제품-성분 연결) ===")

    # 1. 별칭 맵 구축
    alias_map: dict[str, dict] = {}
    ingredients = supabase_get("ingredients", {"select": "id,canonical_name", "limit": "10000"})
    aliases = supabase_get(
        "ingredient_aliases",
        {"select": "alias_name,ingredient_id", "limit": "100000"},
    )
    id_to_name = {i["id"]: i["canonical_name"] for i in ingredients}
    for i in ingredients:
        alias_map[i["canonical_name"].lower().strip()] = {
            "id": i["id"], "canonical_name": i["canonical_name"]
        }
    for a in aliases:
        canonical = id_to_name.get(a["ingredient_id"], "")
        alias_map[a["alias_name"].lower().strip()] = {
            "id": a["ingredient_id"], "canonical_name": canonical
        }
    logger.info(f"Alias map: {len(alias_map)} entries ({len(ingredients)} canonical)")

    # 2. 제품 배치 처리
    offset = 0
    total_products = 0
    matched_products = 0
    total_pi = 0

    while True:
        # 타임아웃 시 최대 3회 재시도
        products = None
        for attempt in range(3):
            products = supabase_get(
                "products",
                {"select": "id,raw_materials,standard",
                 "limit": str(batch_size), "offset": str(offset), "order": "created_at.asc"},
            )
            if products is not None:
                break
            logger.warning(f"Offset {offset}: 재시도 {attempt+1}/3")
            time.sleep(2 * (attempt + 1))
        if not products:
            break

        pi_batch: list[dict] = []
        for p in products:
            names = parse_raw_materials(p.get("raw_materials") or "")
            seen: set[str] = set()
            for name in names:
                ing = match_ingredient(name, alias_map)
                if not ing or ing["id"] in seen:
                    continue
                seen.add(ing["id"])
                amount, unit = parse_amount(p.get("standard") or "", ing["canonical_name"])
                pi_batch.append({
                    "product_id": p["id"],
                    "ingredient_id": ing["id"],
                    "amount": amount,
                    "amount_unit": unit,
                    "is_functional": False,
                })
            if seen:
                matched_products += 1

        total_products += len(products)
        total_pi += len(pi_batch)

        if pi_batch and not dry_run:
            inserted = supabase_upsert("product_ingredients", pi_batch,
                                       on_conflict="product_id,ingredient_id")
            status = f"inserted={inserted}"
        else:
            status = "DRY RUN"

        logger.info(
            f"Offset {offset:>6}: {len(products)} products "
            f"→ {len(pi_batch)} links [{status}] (total: {total_pi})"
        )
        offset += batch_size
        if len(products) < batch_size:
            break
        time.sleep(0.05)

    coverage = matched_products / total_products * 100 if total_products else 0
    logger.info("=" * 60)
    logger.info(f"Total products : {total_products:,}")
    logger.info(f"Matched        : {matched_products:,} ({coverage:.1f}%)")
    logger.info(f"PI rows        : {total_pi:,}")
    if dry_run:
        logger.info("[DRY RUN] No data written.")
    logger.info("=" * 60)


# ─── Entry point ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Pillog ingredient sync pipeline")
    subparsers = parser.add_subparsers(dest="mode", required=True)

    for cmd in ("extract", "match"):
        sp = subparsers.add_parser(
            cmd,
            help="미매칭 성분 추출" if cmd == "extract" else "제품-성분 연결",
        )
        sp.add_argument("--batch-size", type=int, default=500)
        sp.add_argument("--dry-run", action="store_true")

    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정")
        sys.exit(1)

    if args.mode == "extract":
        run_extract(args.batch_size, args.dry_run)
    else:
        run_match(args.batch_size, args.dry_run)


if __name__ == "__main__":
    main()
