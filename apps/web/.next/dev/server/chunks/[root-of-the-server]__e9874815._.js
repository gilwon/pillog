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
"[project]/apps/web/src/features/recommendation/constants/health-concerns.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HEALTH_CONCERNS",
    ()=>HEALTH_CONCERNS,
    "HEALTH_CONCERN_MAP",
    ()=>HEALTH_CONCERN_MAP,
    "MAX_CONCERNS",
    ()=>MAX_CONCERNS
]);
const HEALTH_CONCERNS = [
    {
        key: '면역력',
        label: '면역력',
        emoji: '🛡️',
        description: '면역 기능 강화',
        keywords: [
            '면역력 증진',
            '정상적인 면역기능',
            '면역기능에 필요',
            '면역력'
        ]
    },
    {
        key: '피로회복',
        label: '피로·활력',
        emoji: '⚡',
        description: '피로 해소 및 에너지',
        keywords: [
            '피로회복',
            '에너지 생성',
            '체력',
            '활력'
        ]
    },
    {
        key: '피부건강',
        label: '피부',
        emoji: '✨',
        description: '피부 건강 및 탄력',
        keywords: [
            '피부건강',
            '피부 보습',
            '콜라겐',
            '피부탄력',
            '피부 노화'
        ]
    },
    {
        key: '눈건강',
        label: '눈·시력',
        emoji: '👁️',
        description: '눈 건강 유지',
        keywords: [
            '눈건강',
            '시력',
            '안구',
            '야맹증',
            '눈의 피로'
        ]
    },
    {
        key: '뼈/관절',
        label: '뼈·관절',
        emoji: '🦴',
        description: '뼈 밀도와 관절 건강',
        keywords: [
            '뼈건강',
            '관절건강',
            '칼슘 흡수',
            '골밀도',
            '뼈 형성'
        ]
    },
    {
        key: '혈행개선',
        label: '혈행',
        emoji: '❤️',
        description: '혈액순환 개선',
        keywords: [
            '혈행개선',
            '혈액순환',
            '혈압 감소',
            '혈소판'
        ]
    },
    {
        key: '장건강',
        label: '장·소화',
        emoji: '🌿',
        description: '장내 환경 개선',
        keywords: [
            '장건강',
            '유익균',
            '장내 환경',
            '배변활동',
            '소화'
        ]
    },
    {
        key: '항산화',
        label: '항산화',
        emoji: '🔬',
        description: '세포 산화 방지',
        keywords: [
            '항산화',
            '활성산소',
            '세포를 보호',
            '산화 스트레스'
        ]
    },
    {
        key: '체중관리',
        label: '체중관리',
        emoji: '⚖️',
        description: '체지방 감소',
        keywords: [
            '체지방 감소',
            '체중조절',
            '지방분해',
            '다이어트'
        ]
    },
    {
        key: '스트레스',
        label: '스트레스',
        emoji: '🧘',
        description: '스트레스·긴장 완화',
        keywords: [
            '스트레스 완화',
            '긴장 완화',
            '신경안정',
            '정서안정'
        ]
    },
    {
        key: '수면',
        label: '수면',
        emoji: '😴',
        description: '수면의 질 개선',
        keywords: [
            '수면의 질',
            '숙면',
            '멜라토닌',
            '수면 유지'
        ]
    },
    {
        key: '간건강',
        label: '간건강',
        emoji: '🫁',
        description: '간 기능 보호',
        keywords: [
            '간건강',
            '간 기능',
            '해독',
            '간 보호'
        ]
    },
    {
        key: '남성건강',
        label: '남성건강',
        emoji: '💪',
        description: '남성 활력 지원',
        keywords: [
            '남성 건강',
            '전립선',
            '테스토스테론',
            '남성 활력'
        ]
    },
    {
        key: '여성건강',
        label: '여성건강',
        emoji: '🌸',
        description: '여성 건강 지원',
        keywords: [
            '여성 건강',
            '갱년기',
            '생리',
            '여성 활력'
        ]
    },
    {
        key: '어린이',
        label: '어린이',
        emoji: '🌟',
        description: '성장 및 두뇌 발달',
        keywords: [
            '성장',
            '두뇌발달',
            '집중력',
            '어린이'
        ]
    }
];
const HEALTH_CONCERN_MAP = Object.fromEntries(HEALTH_CONCERNS.map((c)=>[
        c.key,
        c.keywords
    ]));
const MAX_CONCERNS = 3;
}),
"[project]/apps/web/src/app/api/recommend/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$utils$2f$escape$2d$like$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/utils/escape-like.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$features$2f$recommendation$2f$constants$2f$health$2d$concerns$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/features/recommendation/constants/health-concerns.ts [app-route] (ecmascript)");
;
;
;
;
const VALID_KEYS = new Set(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$features$2f$recommendation$2f$constants$2f$health$2d$concerns$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HEALTH_CONCERNS"].map((c)=>c.key));
async function POST(req) {
    const body = await req.json().catch(()=>null);
    const concerns = body?.concerns;
    if (!concerns || !Array.isArray(concerns) || concerns.length === 0) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'concerns 배열이 필요합니다.',
                status: 400
            }
        }, {
            status: 400
        });
    }
    const validConcerns = concerns.filter((c)=>VALID_KEYS.has(c));
    if (validConcerns.length === 0) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'VALIDATION_ERROR',
                message: '유효한 건강 고민 카테고리가 없습니다.',
                status: 400
            }
        }, {
            status: 400
        });
    }
    if (validConcerns.length > 3) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'concerns는 최대 3개까지 선택 가능합니다.',
                status: 400
            }
        }, {
            status: 400
        });
    }
    const keywords = validConcerns.flatMap((c)=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$features$2f$recommendation$2f$constants$2f$health$2d$concerns$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HEALTH_CONCERN_MAP"][c]);
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
    // primary_functionality는 plain text 컬럼 → .or() ilike 안정적으로 지원
    const orFilter = keywords.map((k)=>`primary_functionality.ilike.%${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$utils$2f$escape$2d$like$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeLike"])(k)}%`).join(',');
    const { data, error } = await supabase.from('products').select('id, name, company, functionality_tags, shape, primary_functionality, reported_at').eq('is_active', true).or(orFilter);
    if (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'INTERNAL_ERROR',
                message: '추천 쿼리 실패',
                status: 500
            }
        }, {
            status: 500
        });
    }
    const scored = (data || []).map((p)=>{
        const tags = p.functionality_tags ?? [];
        const primaryFunc = p.primary_functionality ?? '';
        // 1차: functionality_tags 부분 일치
        const matchedTags = tags.filter((tag)=>keywords.some((k)=>tag.includes(k) || k.includes(tag)));
        // 2차: tags 미매칭 시 primary_functionality 기반 점수로 fallback
        const matchScore = matchedTags.length > 0 ? matchedTags.length : keywords.filter((k)=>primaryFunc.includes(k)).length;
        return {
            id: p.id,
            name: p.name,
            company: p.company,
            functionality_tags: tags,
            shape: p.shape ?? null,
            reported_at: p.reported_at ?? null,
            matchedTags,
            matchScore
        };
    }).filter((p)=>p.matchScore > 0)// 최근 신고일 기준 정렬 (reported_at DESC), 동일한 경우 matchScore DESC
    .sort((a, b)=>{
        const dateA = a.reported_at ? new Date(a.reported_at).getTime() : 0;
        const dateB = b.reported_at ? new Date(b.reported_at).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return b.matchScore - a.matchScore;
    });
    const total = scored.length;
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        products: scored,
        total
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e9874815._.js.map