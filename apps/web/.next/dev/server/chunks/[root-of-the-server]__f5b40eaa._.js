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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
;
;
// 같은 서버 렌더 요청 내에서 auth 중복 호출 방지
const getAdminUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cache"])(async ()=>{
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return null;
    return {
        user,
        supabase
    };
});
async function requireAdmin() {
    const result = await getAdminUser();
    if (!result) {
        throw __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'UNAUTHORIZED',
                message: '관리자 권한이 필요합니다.',
                status: 401
            }
        }, {
            status: 401
        });
    }
    return result;
}
async function checkIsAdmin() {
    try {
        const result = await getAdminUser();
        return result !== null;
    } catch  {
        return false;
    }
}
}),
"[project]/apps/web/src/app/api/admin/sync/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
const maxDuration = 300 // 5분 (Vercel Pro 필요, 기본 60초)
;
const C003_BASE_URL = 'http://openapi.foodsafetykorea.go.kr/api';
const SERVICE_ID = 'C003';
const BATCH_SIZE = 1000;
function parseFunctionalityTags(functionality) {
    if (!functionality) return [];
    const tags = [];
    const text = functionality.replace(/\[.+?\]/g, '');
    const parts = text.split(/[①②③④⑤⑥⑦⑧⑨⑩;]/);
    for (const part of parts){
        let cleaned = part.trim();
        if (!cleaned) continue;
        cleaned = cleaned.replace(/에\s*도움을?\s*줄?\s*수\s*있[음습]/g, '');
        cleaned = cleaned.replace(/에\s*도움/g, '');
        cleaned = cleaned.trim();
        if (cleaned.length >= 2) tags.push(cleaned);
    }
    return tags.slice(0, 10);
}
function transformProduct(item) {
    const functionality = item.PRIMARY_FNCLTY || '';
    const tags = parseFunctionalityTags(functionality);
    let reportedAt = null;
    const prmsDt = item.PRMS_DT || '';
    if (prmsDt.length >= 8) {
        const y = prmsDt.slice(0, 4);
        const m = prmsDt.slice(4, 6);
        const d = prmsDt.slice(6, 8);
        reportedAt = `${y}-${m}-${d}`;
    }
    return {
        report_no: item.PRDLST_REPORT_NO || '',
        name: (item.PRDLST_NM || '').trim(),
        company: (item.BSSH_NM || '').trim(),
        primary_functionality: functionality,
        functionality_tags: tags,
        how_to_take: item.NTK_MTHD || null,
        caution: item.IFTKN_ATNT_MATR_CN || null,
        shape: item.PRDT_SHAP_CD_NM || item.DISPOS || null,
        standard: item.STDR_STND || null,
        shelf_life: item.POG_DAYCNT || null,
        storage_method: item.CSTDY_MTHD || null,
        raw_materials: item.RAWMTRL_NM || null,
        reported_at: reportedAt,
        synced_at: new Date().toISOString(),
        is_active: true,
        removed_from_api: false
    };
}
async function fetchC003(start, end, changeDate) {
    const apiKey = process.env.FOOD_SAFETY_API_KEY;
    // NOTE: API key is embedded in URL path per MFDS API spec.
    // Ensure no request URL logging is enabled to prevent key exposure (SEC-009).
    let url = `${C003_BASE_URL}/${apiKey}/${SERVICE_ID}/json/${start}/${end}`;
    if (changeDate) url += `/CHNG_DT=${changeDate}`;
    for(let attempt = 0; attempt < 3; attempt++){
        const res = await fetch(url, {
            signal: AbortSignal.timeout(30000)
        });
        if (!res.ok) throw new Error(`C003 API 오류: ${res.status}`) // URL deliberately excluded from error message
        ;
        const text = await res.text();
        // 식약처 API는 오류 시 HTTP 200 + HTML을 반환함
        if (text.trimStart().startsWith('<')) {
            const match = text.match(/alert\('([^']+)'\)/);
            const msg = match ? match[1] : '식약처 API 일시 오류';
            if (attempt < 2) {
                await new Promise((r)=>setTimeout(r, 2000 * (attempt + 1)));
                continue;
            }
            throw new Error(msg);
        }
        return JSON.parse(text);
    }
    throw new Error('식약처 API 응답 실패 (3회 재시도 초과)');
}
async function POST(req) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAdmin"])();
    } catch (err) {
        return err;
    }
    const apiKey = process.env.FOOD_SAFETY_API_KEY;
    if (!apiKey) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'CONFIG_ERROR',
                message: 'FOOD_SAFETY_API_KEY가 설정되지 않았습니다.',
                status: 500
            }
        }, {
            status: 500
        });
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
    const full = body.full === true;
    const since = body.since;
    let changeDate = '';
    if (since) {
        changeDate = since.replace(/-/g, '');
    } else if (!full) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        changeDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
    }
    // 총 건수 조회 (실패 시 스트림 시작 전에 에러 반환)
    let total = 0;
    try {
        const initial = await fetchC003(1, 1, changeDate);
        const serviceData = initial[SERVICE_ID] || {};
        total = parseInt(serviceData.total_count || '0', 10);
    } catch (err) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: `식약처 API 연결 실패: ${err instanceof Error ? err.message : String(err)}`
        }, {
            status: 502
        });
    }
    const totalBatches = Math.ceil(total / BATCH_SIZE);
    const encoder = new TextEncoder();
    const send = (obj)=>encoder.encode(JSON.stringify(obj) + '\n');
    const stream = new ReadableStream({
        async start (controller) {
            if (total === 0) {
                controller.enqueue(send({
                    type: 'done',
                    count: 0,
                    total: 0,
                    failedBatches: 0,
                    message: '업데이트할 제품이 없습니다.'
                }));
                controller.close();
                return;
            }
            controller.enqueue(send({
                type: 'start',
                total,
                totalBatches
            }));
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, serviceRoleKey);
            let totalUpserted = 0;
            let failedBatches = 0;
            const syncStart = new Date().toISOString();
            // sync_log 생성 (service role supabase 사용)
            const { data: logRow } = await supabase.from('sync_logs').insert({
                sync_type: full ? 'full' : 'incremental',
                change_date: changeDate || null,
                started_at: syncStart
            }).select('id').single();
            const syncLogId = logRow?.id ?? null;
            for(let batchNum = 1; batchNum <= totalBatches; batchNum++){
                const start = (batchNum - 1) * BATCH_SIZE + 1;
                const end = Math.min(batchNum * BATCH_SIZE, total);
                try {
                    const data = await fetchC003(start, end, changeDate);
                    const rows = data[SERVICE_ID]?.row || [];
                    const products = rows.filter((row)=>row.PRDLST_REPORT_NO).map(transformProduct);
                    if (products.length > 0) {
                        const { data: upserted, error } = await supabase.from('products').upsert(products, {
                            onConflict: 'report_no'
                        }).select('id');
                        if (error) {
                            failedBatches++;
                        } else {
                            totalUpserted += upserted?.length ?? 0;
                        }
                    }
                } catch  {
                    failedBatches++;
                }
                controller.enqueue(send({
                    type: 'progress',
                    batch: batchNum,
                    totalBatches,
                    upserted: totalUpserted,
                    total
                }));
                if (batchNum < totalBatches) {
                    await new Promise((r)=>setTimeout(r, 300));
                }
            }
            let deactivatedCount = 0;
            if (full && failedBatches === 0) {
                // 전체 동기화 후 API에 없는 제품 → soft delete (사용자 데이터 CASCADE 보호)
                const { data: deactivatedRows } = await supabase.from('products').update({
                    is_active: false,
                    removed_from_api: true
                }).lt('synced_at', syncStart).eq('removed_from_api', false) // 이미 처리된 항목 재처리 방지
                .select('id');
                deactivatedCount = deactivatedRows?.length ?? 0;
                if (deactivatedCount > 0) {
                    controller.enqueue(send({
                        type: 'deactivate',
                        deactivated: deactivatedCount
                    }));
                }
                // deactivated 제품 로그 기록
                if (syncLogId && deactivatedRows && deactivatedRows.length > 0) {
                    try {
                        for(let i = 0; i < deactivatedRows.length; i += 500){
                            await supabase.from('sync_log_products').insert(deactivatedRows.slice(i, i + 500).map((p)=>({
                                    sync_log_id: syncLogId,
                                    product_id: p.id,
                                    change_type: 'deactivated'
                                })));
                        }
                    } catch  {
                    // 로그 저장 실패는 무시
                    }
                }
            }
            // 동기화된 제품 기록
            if (syncLogId) {
                try {
                    const { data: touched } = await supabase.from('products').select('id, created_at').gte('synced_at', syncStart);
                    const logProducts = (touched ?? []).map((p)=>({
                            sync_log_id: syncLogId,
                            product_id: p.id,
                            change_type: p.created_at >= syncStart ? 'new' : 'updated'
                        }));
                    for(let i = 0; i < logProducts.length; i += 500){
                        await supabase.from('sync_log_products').insert(logProducts.slice(i, i + 500));
                    }
                    await supabase.from('sync_logs').update({
                        status: failedBatches > 0 && totalUpserted === 0 ? 'failed' : 'completed',
                        total_fetched: total,
                        new_count: logProducts.filter((p)=>p.change_type === 'new').length,
                        updated_count: logProducts.filter((p)=>p.change_type === 'updated').length,
                        deactivated_count: deactivatedCount,
                        failed_batches: failedBatches,
                        completed_at: new Date().toISOString()
                    }).eq('id', syncLogId);
                } catch  {
                // 로그 저장 실패는 동기화 결과에 영향 없음
                }
            }
            controller.enqueue(send({
                type: 'done',
                count: totalUpserted,
                total,
                failedBatches,
                deactivated: deactivatedCount,
                message: failedBatches > 0 ? `${totalUpserted.toLocaleString()}개 업데이트 (${failedBatches}개 배치 실패)` : deactivatedCount > 0 ? `${totalUpserted.toLocaleString()}개 업데이트, ${deactivatedCount.toLocaleString()}개 API 제거 처리되었습니다.` : `${totalUpserted.toLocaleString()}개 제품이 업데이트되었습니다.`
            }));
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

//# sourceMappingURL=%5Broot-of-the-server%5D__f5b40eaa._.js.map