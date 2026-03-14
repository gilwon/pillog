module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/web/src/lib/supabase/server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
async function createClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])(("TURBOPACK compile-time value", "https://aonkskmeixxlldeoyyvr.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbmtza21laXh4bGxkZW95eXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNTc3MzIsImV4cCI6MjA4ODgzMzczMn0.BxCQv8idk4lVWj4IRvpTPoRmIHmZTvhVBv1-JjL9bKE"), {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing user sessions.
                }
            }
        }
    });
}
}),
"[project]/apps/web/src/lib/admin.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkIsAdmin",
    ()=>checkIsAdmin,
    "requireAdmin",
    ()=>requireAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
;
async function requireAdmin() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'UNAUTHORIZED',
                message: '로그인이 필요합니다.',
                status: 401
            }
        }, {
            status: 401
        });
    }
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
        throw __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'FORBIDDEN',
                message: '관리자 권한이 필요합니다.',
                status: 403
            }
        }, {
            status: 403
        });
    }
    return {
        user,
        supabase
    };
}
async function checkIsAdmin() {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
        return profile?.role === 'admin';
    } catch  {
        return false;
    }
}
}),
"[project]/apps/web/src/app/api/admin/ingredients/sync/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "maxDuration",
    ()=>maxDuration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/admin.ts [app-route] (ecmascript)");
;
;
;
const maxDuration = 300;
const BATCH_SIZE = 500;
// products.raw_materials 문자열 → 성분명 배열 (parse_ingredients.py 동일 로직)
function parseRawMaterials(raw) {
    if (!raw) return [];
    let text = raw.replace(/\([^)]*%[^)]*\)/g, '');
    text = text.replace(/\s*(이상|이하|함유)\s*/g, '');
    return text.split(',').map((part)=>part.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()).filter((name)=>name.length >= 2 && !/^[\d.]+$/.test(name));
}
// products.standard 문자열에서 성분 함량 추출
function parseAmount(standard, canonicalName) {
    if (!standard || !canonicalName) return [
        null,
        null
    ];
    const AMOUNT_RE = /(\d[\d,]*(?:\.\d+)?)\s*(mg|μg|ug|mcg|IU|g|CFU|억\s*CFU|만\s*CFU|천\s*CFU)/gi;
    const UNIT_MAP = {
        ug: 'μg',
        mcg: 'μg',
        cfu: 'CFU',
        '억 cfu': 'CFU',
        '억cfu': 'CFU',
        '만 cfu': 'CFU',
        '만cfu': 'CFU',
        '천 cfu': 'CFU',
        '천cfu': 'CFU'
    };
    const idx = standard.toLowerCase().indexOf(canonicalName.toLowerCase());
    if (idx === -1) return [
        null,
        null
    ];
    const window = standard.slice(idx, idx + canonicalName.length + 50);
    AMOUNT_RE.lastIndex = 0;
    const m = AMOUNT_RE.exec(window);
    if (m) {
        const amount = parseFloat(m[1].replace(/,/g, ''));
        const unit = UNIT_MAP[m[2].toLowerCase()] ?? m[2];
        return [
            amount,
            unit
        ];
    }
    return [
        null,
        null
    ];
}
async function POST(req) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAdmin"])();
    } catch (err) {
        return err;
    }
    const supabaseUrl = ("TURBOPACK compile-time value", "https://aonkskmeixxlldeoyyvr.supabase.co");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'CONFIG_ERROR',
                message: 'Supabase 서비스 키가 설정되지 않았습니다.',
                status: 500
            }
        }, {
            status: 500
        });
    }
    const body = await req.json().catch(()=>({}));
    const mode = body.mode === 'match' ? 'match' : 'extract';
    const encoder = new TextEncoder();
    const send = (obj)=>encoder.encode(JSON.stringify(obj) + '\n');
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, serviceRoleKey);
    const stream = new ReadableStream({
        async start (controller) {
            try {
                if (mode === 'extract') {
                    // ─── 미매칭 성분 추출 ───────────────────────────────────────────
                    // 1. 기존 알려진 성분명 + 별칭 로드
                    const knownNames = new Set();
                    const { data: ingredients } = await supabase.from('ingredients').select('canonical_name').limit(10000);
                    const { data: aliases } = await supabase.from('ingredient_aliases').select('alias_name').limit(100000);
                    for (const i of ingredients ?? [])knownNames.add(i.canonical_name.toLowerCase().trim());
                    for (const a of aliases ?? [])knownNames.add(a.alias_name.toLowerCase().trim());
                    // 2. 전체 제품 수 조회
                    const { count: totalCount } = await supabase.from('products').select('*', {
                        count: 'exact',
                        head: true
                    }).not('raw_materials', 'is', null);
                    const total = totalCount ?? 0;
                    const totalBatches = Math.ceil(total / BATCH_SIZE) || 1;
                    controller.enqueue(send({
                        type: 'start',
                        total,
                        totalBatches,
                        mode
                    }));
                    // 3. 배치로 스캔 → 미매칭 후보 수집
                    const candidates = new Map() // name → 등장 횟수
                    ;
                    for(let batch = 1; batch <= totalBatches; batch++){
                        const offset = (batch - 1) * BATCH_SIZE;
                        const { data: products } = await supabase.from('products').select('raw_materials').not('raw_materials', 'is', null).range(offset, offset + BATCH_SIZE - 1);
                        for (const p of products ?? []){
                            for (const name of parseRawMaterials(p.raw_materials ?? '')){
                                const lower = name.toLowerCase();
                                if (!knownNames.has(lower)) {
                                    candidates.set(name, (candidates.get(name) ?? 0) + 1);
                                }
                            }
                        }
                        controller.enqueue(send({
                            type: 'progress',
                            batch,
                            totalBatches,
                            found: candidates.size,
                            total
                        }));
                    }
                    // 4. 등장 횟수 순 정렬 후 DB 삽입
                    const newIngredients = Array.from(candidates.entries()).sort((a, b)=>b[1] - a[1]).map(([name])=>({
                            canonical_name: name,
                            category: '미분류',
                            source_info: '제품 원재료 자동 추출'
                        }));
                    let inserted = 0;
                    const INSERT_BATCH = 100;
                    for(let i = 0; i < newIngredients.length; i += INSERT_BATCH){
                        const chunk = newIngredients.slice(i, i + INSERT_BATCH);
                        const { data } = await supabase.from('ingredients').upsert(chunk, {
                            onConflict: 'canonical_name',
                            ignoreDuplicates: true
                        }).select('id');
                        inserted += data?.length ?? 0;
                    }
                    controller.enqueue(send({
                        type: 'done',
                        mode,
                        count: inserted,
                        candidates: candidates.size,
                        message: `${inserted.toLocaleString()}개 신규 성분 추가 (후보 ${candidates.size.toLocaleString()}개 발견)`
                    }));
                } else {
                    // ─── 제품-성분 연결 ─────────────────────────────────────────────
                    // 1. 별칭 맵 구축
                    const aliasMap = new Map();
                    const { data: ingredients } = await supabase.from('ingredients').select('id, canonical_name').limit(10000);
                    const { data: aliases } = await supabase.from('ingredient_aliases').select('alias_name, ingredient_id').limit(100000);
                    const idToName = new Map();
                    for (const i of ingredients ?? []){
                        idToName.set(i.id, i.canonical_name);
                        aliasMap.set(i.canonical_name.toLowerCase().trim(), {
                            id: i.id,
                            canonical_name: i.canonical_name
                        });
                    }
                    for (const a of aliases ?? []){
                        const canonical_name = idToName.get(a.ingredient_id) ?? '';
                        aliasMap.set(a.alias_name.toLowerCase().trim(), {
                            id: a.ingredient_id,
                            canonical_name
                        });
                    }
                    // 2. 전체 제품 배치 처리
                    const { count: totalCount } = await supabase.from('products').select('*', {
                        count: 'exact',
                        head: true
                    });
                    const total = totalCount ?? 0;
                    const totalBatches = Math.ceil(total / BATCH_SIZE) || 1;
                    controller.enqueue(send({
                        type: 'start',
                        total,
                        totalBatches,
                        mode
                    }));
                    let totalLinked = 0;
                    let matchedProducts = 0;
                    for(let batch = 1; batch <= totalBatches; batch++){
                        const offset = (batch - 1) * BATCH_SIZE;
                        const { data: products } = await supabase.from('products').select('id, raw_materials, standard').range(offset, offset + BATCH_SIZE - 1);
                        const piRows = [];
                        for (const p of products ?? []){
                            const names = parseRawMaterials(p.raw_materials ?? '');
                            const seenIds = new Set();
                            for (const name of names){
                                const lower = name.toLowerCase();
                                let ing = aliasMap.get(lower);
                                // 부분 매칭 fallback
                                if (!ing) {
                                    for (const [alias, candidate] of aliasMap){
                                        if (alias.length >= 3 && (alias.includes(lower) || lower.length >= 3 && lower.includes(alias))) {
                                            ing = candidate;
                                            break;
                                        }
                                    }
                                }
                                if (!ing || seenIds.has(ing.id)) continue;
                                seenIds.add(ing.id);
                                const [amount, amount_unit] = parseAmount(p.standard ?? '', ing.canonical_name);
                                piRows.push({
                                    product_id: p.id,
                                    ingredient_id: ing.id,
                                    amount,
                                    amount_unit,
                                    is_functional: false
                                });
                            }
                            if (seenIds.size > 0) matchedProducts++;
                        }
                        if (piRows.length > 0) {
                            const { data: upserted } = await supabase.from('product_ingredients').upsert(piRows, {
                                onConflict: 'product_id,ingredient_id'
                            }).select('id');
                            totalLinked += upserted?.length ?? 0;
                        }
                        controller.enqueue(send({
                            type: 'progress',
                            batch,
                            totalBatches,
                            linked: totalLinked,
                            total
                        }));
                    }
                    controller.enqueue(send({
                        type: 'done',
                        mode,
                        count: totalLinked,
                        matchedProducts,
                        total,
                        message: `${matchedProducts.toLocaleString()}개 제품 / ${totalLinked.toLocaleString()}개 성분 연결 완료`
                    }));
                }
            } catch (err) {
                controller.enqueue(send({
                    type: 'error',
                    message: err instanceof Error ? err.message : '서버 오류'
                }));
            }
            controller.close();
        }
    });
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8'
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f564c250._.js.map