#!/usr/bin/env python3
"""
미분류 성분에서 노이즈를 제거하고 match를 준비하는 스크립트.

Usage:
    python3 cleanup_noise.py --dry-run   # 삭제 대상 확인만
    python3 cleanup_noise.py             # 실제 삭제

Environment variables:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
"""
import os, re, sys, json, argparse, logging
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from urllib.parse import urlencode

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


def _headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def supabase_get(path, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urlencode(params)
    req = Request(url, headers=_headers())
    with urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def supabase_delete_by_ids(path, ids):
    """id IN (...) 로 배치 삭제"""
    if not ids:
        return 0
    id_list = ",".join(f'"{i}"' for i in ids)
    url = f"{SUPABASE_URL}/rest/v1/{path}?id=in.({id_list})"
    req = Request(url, headers=_headers(), method="DELETE")
    try:
        with urlopen(req, timeout=30) as r:
            return len(ids)
    except HTTPError as e:
        logger.error(f"DELETE failed: {e.code} {e.read().decode()[:200]}")
        return 0


# ─── 노이즈 판정 규칙 ────────────────────────────────────────────────────────

NOISE_RULES = [
    # 1. 파싱 잔재 — 괄호/슬래시/특수문자
    (re.compile(r'[)\(\/\\]'),                  "파싱 잔재(괄호·슬래시)"),
    # 2. 숫자로 시작 (함량 수치가 이름으로 들어간 경우)
    (re.compile(r'^\d'),                        "숫자 시작"),
    # 3. 구분자 포함 (파싱이 덜 된 복합 문자열)
    (re.compile(r'[,;]'),                       "구분자 포함"),
    # 4. 완전 일반명 (영양소가 아닌 식품 가공 용어)
    (re.compile(
        r'^(정제수|기타가공품|기타|혼합제제|혼합분말|복합추출물|'
        r'식품첨가물|혼합물|과립|분말|원말|캡슐|정제|연질캡슐|'
        r'액상|시럽|에멀젼|현탁액|필름코팅정|저작정|'
        r'기타성분|기타원료|정제탈지대두분|가공품)$',
        re.IGNORECASE
    ),                                          "비원료 일반 가공 용어"),
    # 5. 이중 이상 공백 (파싱 오류)
    (re.compile(r'\s{2,}'),                     "이중공백"),
    # 6. 단일 문자
    (re.compile(r'^.$'),                        "단일 문자"),
]


def is_noise(name: str) -> tuple[bool, str]:
    for pattern, label in NOISE_RULES:
        if pattern.search(name):
            return True, label
    return False, ""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("환경변수 미설정")
        sys.exit(1)

    # 미분류 성분 전체 로드 (페이지네이션)
    logger.info("미분류 성분 로드 중...")
    rows = []
    offset = 0
    page_size = 1000
    while True:
        page = supabase_get("ingredients", {
            "select": "id,canonical_name",
            "category": "eq.미분류",
            "limit": str(page_size),
            "offset": str(offset),
            "order": "canonical_name.asc",
        })
        rows.extend(page)
        if len(page) < page_size:
            break
        offset += page_size
    logger.info(f"미분류 성분 총 {len(rows)}개")

    # 노이즈 분류
    from collections import defaultdict
    by_label = defaultdict(list)
    noise_ids = []

    for row in rows:
        hit, label = is_noise(row["canonical_name"])
        if hit:
            by_label[label].append(row["canonical_name"])
            noise_ids.append(row["id"])

    valid_count = len(rows) - len(noise_ids)

    print(f"\n{'='*60}")
    print(f"전체 미분류: {len(rows):,}개")
    print(f"노이즈 추정: {len(noise_ids):,}개  →  삭제 예정")
    print(f"유효 유지:   {valid_count:,}개")
    print(f"{'='*60}")
    for label, names in sorted(by_label.items(), key=lambda x: -len(x[1])):
        print(f"\n[{label}] {len(names)}개")
        for n in names[:8]:
            print(f"  {n}")
        if len(names) > 8:
            print(f"  ... 외 {len(names)-8}개")
    print()

    if dry_run := args.dry_run:
        logger.info("[DRY RUN] 실제 삭제하지 않습니다.")
        return

    # 100개씩 배치 삭제
    deleted = 0
    BATCH = 100
    for i in range(0, len(noise_ids), BATCH):
        chunk = noise_ids[i:i + BATCH]
        deleted += supabase_delete_by_ids("ingredients", chunk)
        logger.info(f"삭제 진행: {deleted}/{len(noise_ids)}")

    logger.info(f"\n완료: {deleted}개 노이즈 삭제, {valid_count}개 성분 유지")


if __name__ == "__main__":
    main()
