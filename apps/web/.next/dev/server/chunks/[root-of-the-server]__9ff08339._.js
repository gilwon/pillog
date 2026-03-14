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
"[project]/apps/web/src/lib/meilisearch/client.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PRODUCTS_INDEX",
    ()=>PRODUCTS_INDEX,
    "meiliClient",
    ()=>meiliClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$meilisearch$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/meilisearch/dist/esm/index.js [app-route] (ecmascript)");
;
const host = process.env.MEILISEARCH_HOST;
const apiKey = process.env.MEILISEARCH_API_KEY;
if (!host || !apiKey) {
    console.warn('[Meilisearch] MEILISEARCH_HOST or MEILISEARCH_API_KEY not set — fallback to pg_trgm');
}
const meiliClient = host && apiKey ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$meilisearch$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MeiliSearch"]({
    host,
    apiKey
}) : null;
const PRODUCTS_INDEX = 'products';
}),
"[project]/apps/web/src/lib/meilisearch/search.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "searchWithMeilisearch",
    ()=>searchWithMeilisearch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$meilisearch$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/meilisearch/client.ts [app-route] (ecmascript)");
;
async function searchWithMeilisearch({ query, limit, offset, category }) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$meilisearch$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["meiliClient"]) throw new Error('Meilisearch not configured');
    const index = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$meilisearch$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["meiliClient"].index(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$meilisearch$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PRODUCTS_INDEX"]);
    const filterParts = [
        'is_active = true'
    ];
    if (category && category.trim().length > 0) {
        filterParts.push(`functionality_tags = "${category.trim()}"`);
    }
    const result = await index.search(query, {
        limit,
        offset,
        filter: filterParts.join(' AND '),
        attributesToRetrieve: [
            'id',
            'name',
            'company',
            'functionality_tags',
            'shape'
        ]
    });
    return {
        data: result.hits.map((hit)=>({
                id: hit.id,
                name: hit.name,
                company: hit.company,
                functionality_tags: hit.functionality_tags || [],
                shape: hit.shape ?? null,
                similarity_score: 1.0
            })),
        total: result.estimatedTotalHits ?? result.hits.length
    };
}
}),
"[project]/apps/web/src/lib/utils/escape-like.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Postgres LIKE/ILIKE 와일드카드(%, _, \)를 이스케이프합니다. */ __turbopack_context__.s([
    "escapeLike",
    ()=>escapeLike
]);
function escapeLike(s) {
    return s.replace(/[%_\\]/g, '\\$&');
}
}),
"[project]/apps/web/src/app/api/products/search/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$meilisearch$2f$search$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/meilisearch/search.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$utils$2f$escape$2d$like$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/utils/escape-like.ts [app-route] (ecmascript)");
;
;
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const category = searchParams.get('category');
        const match = searchParams.get('match') === 'any' ? 'any' : 'all';
        const page = Math.max(1, Number(searchParams.get('page')) || 1);
        const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));
        const offset = (page - 1) * limit;
        if (!query || query.trim().length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: '검색어를 입력해주세요.',
                    status: 400
                }
            }, {
                status: 400
            });
        }
        const q = query.trim();
        let data = [];
        let total = 0;
        // 1차: Meilisearch (한글 형태소 분석 + 동의어 + 오타 허용)
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$meilisearch$2f$search$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["searchWithMeilisearch"])({
                query: q,
                limit,
                offset,
                category: category ?? undefined
            });
            data = result.data;
            total = result.total;
        } catch  {
            // 2차: pg_trgm fallback
            console.warn('[Search] Meilisearch unavailable, using pg_trgm fallback');
            const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
            const [{ data: rpcData, error }, { data: countData }] = await Promise.all([
                supabase.rpc('search_products', {
                    query: q,
                    lim: limit,
                    off_set: offset,
                    match_mode: match
                }),
                supabase.rpc('count_search_products', {
                    query: q,
                    match_mode: match
                })
            ]);
            if (error) {
                console.error('Search error:', error);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: '검색 중 오류가 발생했습니다.',
                        status: 500
                    }
                }, {
                    status: 500
                });
            }
            let results = rpcData || [];
            total = Number(countData) || 0;
            if (category && category.trim().length > 0) {
                results = results.filter((item)=>{
                    const tags = item.functionality_tags || [];
                    return tags.includes(category.trim());
                });
            }
            // Fallback: pg_trgm 결과 없으면 functionality_tags 부분 일치 검색
            if (results.length === 0) {
                const [{ data: tagData }, { count: tagCount }] = await Promise.all([
                    supabase.from('products').select('id, name, company, functionality_tags, shape').eq('is_active', true).filter('functionality_tags::text', 'ilike', `%${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$utils$2f$escape$2d$like$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeLike"])(q)}%`).range(offset, offset + limit - 1),
                    supabase.from('products').select('*', {
                        count: 'exact',
                        head: true
                    }).eq('is_active', true).filter('functionality_tags::text', 'ilike', `%${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$utils$2f$escape$2d$like$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeLike"])(q)}%`)
                ]);
                if (tagData && tagData.length > 0) {
                    results = tagData;
                    total = tagCount ?? tagData.length;
                }
            }
            data = results.map((item)=>({
                    id: item.id,
                    name: item.name,
                    company: item.company,
                    functionality_tags: item.functionality_tags || [],
                    shape: item.shape,
                    similarity_score: Number(item.similarity_score) || 0
                }));
        }
        const response = {
            data,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit)
            }
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(response);
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'INTERNAL_ERROR',
                message: '서버 오류가 발생했습니다.',
                status: 500
            }
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9ff08339._.js.map