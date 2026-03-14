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
"[project]/apps/web/src/features/dashboard/utils/calculate-nutrient-status.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateNutrientStatus",
    ()=>calculateNutrientStatus
]);
function calculateNutrientStatus(rdiPercentage, ulPercentage) {
    // UL exceeded = warning
    if (ulPercentage != null && ulPercentage > 100) {
        return 'warning';
    }
    // UL approaching (70-100%) = caution
    if (ulPercentage != null && ulPercentage >= 70) {
        return 'caution';
    }
    // High RDI (150-300%) without UL concern = caution
    if (rdiPercentage != null && rdiPercentage > 150) {
        return 'caution';
    }
    return 'safe';
}
}),
"[project]/apps/web/src/features/dashboard/data/interaction-rules.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "INTERACTION_RULES",
    ()=>INTERACTION_RULES
]);
const INTERACTION_RULES = [
    // --- Competition (흡수 경쟁) ---
    {
        nutrients: [
            '칼슘',
            '마그네슘'
        ],
        type: 'competition',
        severity: 'caution',
        message: '칼슘과 마그네슘은 장에서 같은 수송체를 통해 흡수되어 경쟁합니다. 동시에 고용량을 섭취하면 흡수율이 떨어질 수 있습니다.',
        recommendation: '2시간 이상 간격을 두고 섭취하거나, 칼슘:마그네슘 비율을 2:1로 맞추는 것을 권장합니다.'
    },
    {
        nutrients: [
            '칼슘',
            '철분'
        ],
        type: 'competition',
        severity: 'caution',
        message: '칼슘은 철분의 흡수를 최대 50%까지 저해할 수 있습니다. 특히 비헴철(식물성 철분)에 영향이 큽니다.',
        recommendation: '칼슘과 철분 보충제는 최소 2시간 간격을 두고 섭취하세요.'
    },
    {
        nutrients: [
            '칼슘',
            '아연'
        ],
        type: 'competition',
        severity: 'caution',
        message: '고용량 칼슘(600mg 이상)은 아연의 흡수를 방해할 수 있습니다.',
        recommendation: '칼슘과 아연 보충제는 시간 간격을 두고 따로 섭취하세요.'
    },
    {
        nutrients: [
            '철분',
            '아연'
        ],
        type: 'competition',
        severity: 'caution',
        message: '철분과 아연은 동일한 흡수 경로(DMT-1)를 공유하여 고용량 동시 섭취 시 서로의 흡수를 저해합니다.',
        recommendation: '두 성분은 다른 시간대에 나누어 섭취하는 것이 좋습니다.'
    },
    {
        nutrients: [
            '비타민 A',
            '비타민 D'
        ],
        type: 'competition',
        severity: 'caution',
        message: '비타민 A와 비타민 D는 같은 핵 수용체(RXR)를 공유합니다. 비타민 A 과잉 섭취는 비타민 D의 작용을 방해할 수 있습니다.',
        recommendation: '비타민 A를 상한 섭취량 이내로 유지하세요.'
    },
    // --- Interference (작용 간섭) ---
    {
        nutrients: [
            '비타민 E',
            '비타민 K'
        ],
        type: 'interference',
        severity: 'caution',
        message: '고용량 비타민 E는 비타민 K의 혈액 응고 기능을 억제할 수 있습니다. 항응고제를 복용 중이라면 특히 주의가 필요합니다.',
        recommendation: '비타민 E는 권장량 이내로 섭취하고, 항응고제 복용 시 의사와 상담하세요.'
    },
    // --- Synergy (시너지) ---
    {
        nutrients: [
            '철분',
            '비타민 C'
        ],
        type: 'synergy',
        severity: 'info',
        message: '비타민 C는 비헴철의 흡수를 최대 6배까지 촉진합니다. 함께 섭취하면 효과적입니다.'
    },
    {
        nutrients: [
            '칼슘',
            '비타민 D'
        ],
        type: 'synergy',
        severity: 'info',
        message: '비타민 D는 장에서 칼슘 흡수를 촉진하는 핵심 역할을 합니다. 함께 섭취하면 칼슘 이용률이 높아집니다.'
    },
    {
        nutrients: [
            '비타민 D',
            '마그네슘'
        ],
        type: 'synergy',
        severity: 'info',
        message: '마그네슘은 비타민 D를 활성형으로 전환하는 데 필수적입니다. 마그네슘이 부족하면 비타민 D 효과가 감소합니다.'
    },
    {
        nutrients: [
            '아연',
            '비타민 B6'
        ],
        type: 'synergy',
        severity: 'info',
        message: '비타민 B6는 아연의 장 흡수를 촉진합니다. 함께 섭취하면 아연 이용률이 향상됩니다.'
    },
    {
        nutrients: [
            '오메가-3',
            '비타민 E'
        ],
        type: 'synergy',
        severity: 'info',
        message: '비타민 E는 항산화제로서 오메가-3 지방산의 산화를 방지합니다. 함께 섭취하면 오메가-3의 안정성이 높아집니다.'
    }
];
}),
"[project]/apps/web/src/features/dashboard/utils/evaluate-interactions.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "evaluateInteractions",
    ()=>evaluateInteractions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$features$2f$dashboard$2f$data$2f$interaction$2d$rules$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/features/dashboard/data/interaction-rules.ts [app-route] (ecmascript)");
;
function evaluateInteractions(nutrientNames) {
    const nameSet = new Set(nutrientNames);
    const matched = [];
    for (const rule of __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$features$2f$dashboard$2f$data$2f$interaction$2d$rules$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["INTERACTION_RULES"]){
        const [a, b] = rule.nutrients;
        if (nameSet.has(a) && nameSet.has(b)) {
            matched.push({
                nutrients: [
                    a,
                    b
                ],
                type: rule.type,
                severity: rule.severity,
                message: rule.message,
                ...rule.recommendation ? {
                    recommendation: rule.recommendation
                } : {}
            });
        }
    }
    // Sort: warning > caution > info
    const severityOrder = {
        warning: 0,
        caution: 1,
        info: 2
    };
    matched.sort((x, y)=>severityOrder[x.severity] - severityOrder[y.severity]);
    return matched;
}
}),
"[project]/apps/web/src/app/api/my/dashboard/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$features$2f$dashboard$2f$utils$2f$calculate$2d$nutrient$2d$status$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/features/dashboard/utils/calculate-nutrient-status.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$features$2f$dashboard$2f$utils$2f$evaluate$2d$interactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/features/dashboard/utils/evaluate-interactions.ts [app-route] (ecmascript)");
;
;
;
;
async function GET() {
    try {
        const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createClient"])();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: '로그인이 필요합니다.',
                    status: 401
                }
            }, {
                status: 401
            });
        }
        // Fetch user supplements with product and ingredient details
        const { data: supplements, error } = await supabase.from('user_supplements').select(`
        daily_dose,
        product:products(
          name,
          product_ingredients(
            amount,
            amount_unit,
            ingredient:ingredients(
              canonical_name,
              category,
              primary_effect,
              daily_rdi,
              daily_ul,
              rdi_unit
            )
          )
        )
      `).eq('user_id', user.id);
        if (error) throw error;
        // Calculate total nutrients
        const nutrientTotals = new Map();
        const supplementList = [];
        for (const supp of supplements || []){
            const product = supp.product;
            if (!product) continue;
            supplementList.push({
                product_name: product.name,
                daily_dose: supp.daily_dose
            });
            const productIngredients = product.product_ingredients || [];
            for (const pi of productIngredients){
                const ing = pi.ingredient;
                if (!ing || !pi.amount) continue;
                const name = ing.canonical_name;
                const amount = Number(pi.amount) * supp.daily_dose;
                if (nutrientTotals.has(name)) {
                    const existing = nutrientTotals.get(name);
                    existing.total_amount += amount;
                } else {
                    nutrientTotals.set(name, {
                        category: ing.category || '기타',
                        total_amount: amount,
                        unit: pi.amount_unit || ing.rdi_unit || 'mg',
                        rdi: ing.daily_rdi ?? null,
                        ul: ing.daily_ul ?? null,
                        primary_effect: ing.primary_effect ?? null
                    });
                }
            }
        }
        // Build response
        const totalNutrients = [];
        const warnings = [];
        for (const [name, data] of nutrientTotals){
            const rdiPercentage = data.rdi != null ? data.total_amount / data.rdi * 100 : null;
            const ulPercentage = data.ul != null ? data.total_amount / data.ul * 100 : null;
            const status = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$features$2f$dashboard$2f$utils$2f$calculate$2d$nutrient$2d$status$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculateNutrientStatus"])(rdiPercentage, ulPercentage);
            totalNutrients.push({
                ingredient: name,
                category: data.category,
                total_amount: data.total_amount,
                unit: data.unit,
                rdi: data.rdi,
                ul: data.ul,
                rdi_percentage: rdiPercentage != null ? Math.round(rdiPercentage) : null,
                ul_percentage: ulPercentage != null ? Math.round(ulPercentage) : null,
                status,
                primary_effect: data.primary_effect
            });
            if (status === 'warning' && data.ul != null) {
                warnings.push({
                    ingredient: name,
                    message: `1일 상한 섭취량(UL)의 ${Math.round(ulPercentage)}%를 초과합니다. 과잉 섭취에 주의하세요.`,
                    severity: 'warning',
                    rdi: data.rdi,
                    unit: data.unit
                });
            } else if (status === 'caution') {
                warnings.push({
                    ingredient: name,
                    message: ulPercentage != null && ulPercentage >= 70 ? `1일 상한 섭취량(UL)의 ${Math.round(ulPercentage)}%입니다. 주의가 필요합니다.` : `1일 권장 섭취량(RDI)의 ${Math.round(rdiPercentage)}%입니다.`,
                    severity: 'caution',
                    rdi: data.rdi,
                    unit: data.unit
                });
            } else if (status === 'safe' && data.rdi != null && rdiPercentage != null) {
                warnings.push({
                    ingredient: name,
                    message: `1일 권장 섭취량(RDI)의 ${Math.round(rdiPercentage)}%입니다.`,
                    severity: 'info',
                    rdi: data.rdi,
                    unit: data.unit
                });
            }
        }
        // Sort nutrients and warnings: warning → caution → safe/info
        const statusOrder = {
            warning: 0,
            caution: 1,
            safe: 2
        };
        totalNutrients.sort((a, b)=>statusOrder[a.status] - statusOrder[b.status]);
        const severityOrder = {
            warning: 0,
            caution: 1,
            info: 2
        };
        warnings.sort((a, b)=>severityOrder[a.severity] - severityOrder[b.severity]);
        // Evaluate nutrient interactions
        const nutrientNames = Array.from(nutrientTotals.keys());
        const interactions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$features$2f$dashboard$2f$utils$2f$evaluate$2d$interactions$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateInteractions"])(nutrientNames);
        const response = {
            supplements: supplementList,
            total_nutrients: totalNutrients,
            warnings,
            interactions
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

//# sourceMappingURL=%5Broot-of-the-server%5D__1b9c4d08._.js.map