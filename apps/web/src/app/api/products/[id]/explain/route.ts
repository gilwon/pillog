import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ProductExplanationData } from '@/types/database'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Check cache first
    const { data: cached } = await supabase
      .from('product_explanations')
      .select('explanation')
      .eq('product_id', id)
      .single()

    if (cached) {
      return NextResponse.json({
        explanation: cached.explanation as ProductExplanationData,
        cached: true,
      })
    }

    // 2. Fetch product with ingredients (active products only)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('name, company, raw_materials')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: { code: 'PRODUCT_NOT_FOUND', message: '제품을 찾을 수 없습니다.', status: 404 } },
        { status: 404 }
      )
    }

    // 2b. Fetch functional ingredients for supplementary info
    const { data: ingredients } = await supabase
      .from('product_ingredients')
      .select(
        `
        amount,
        amount_unit,
        percentage_of_rdi,
        is_functional,
        ingredient:ingredients(canonical_name, primary_effect)
      `
      )
      .eq('product_id', id)
      .eq('is_functional', true)

    if (!product.raw_materials && (!ingredients || ingredients.length === 0)) {
      return NextResponse.json(
        { error: { code: 'NO_INGREDIENTS', message: '성분 정보가 없습니다.', status: 404 } },
        { status: 404 }
      )
    }

    // 3. Check API key
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: { code: 'SERVICE_UNAVAILABLE', message: 'AI 설명 서비스를 사용할 수 없습니다.', status: 503 } },
        { status: 503 }
      )
    }

    // 4. Build functional ingredient details (supplementary)
    const functionalLines = (ingredients || [])
      .map((pi) => {
        const ing = pi.ingredient as unknown as Record<string, unknown> | null
        if (!ing) return null
        const name = ing.canonical_name as string
        const effect = ing.primary_effect as string | null
        const amount = pi.amount ? `${pi.amount}${pi.amount_unit || 'mg'}` : '함량 미표시'
        const rdi = pi.percentage_of_rdi ? `(1일 권장량의 ${pi.percentage_of_rdi}%)` : ''
        return `- ${name}: ${amount} ${rdi}${effect ? ` [효과: ${effect}]` : ''}`
      })
      .filter(Boolean)
      .join('\n')

    // 6. Call Llama 3.3 70B via Groq with streaming
    const groq = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2048,
      temperature: 0.2,
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            '당신은 건강기능식품 성분 전문가입니다. 일반 소비자가 쉽게 이해할 수 있도록 친근하고 정확한 한국어로 성분을 설명해주세요. 반드시 유효한 JSON으로만 응답하세요.\n\n중요: 한국어 맞춤법과 띄어쓰기를 정확하게 지켜주세요. 성분명은 원재료에 표기된 그대로 사용하고, 임의로 변형하지 마세요. 조사(은/는, 이/가, 을/를)를 올바르게 사용하세요.',
        },
        {
          role: 'user',
          content: `다음 건강기능식품의 원재료를 분석하고 쉬운 한국어로 설명해주세요.

제품명: ${product.name} (${product.company})

원재료: ${product.raw_materials || '정보 없음'}
${functionalLines ? `\n기능성 원료 상세:\n${functionalLines}` : ''}

원재료 목록을 기반으로 각 성분의 역할과 효과를 설명해주세요.
다음 JSON 형식으로 응답해주세요 (반드시 유효한 JSON만 출력):
{
  "ingredients": [{"name": "원재료명", "summary": "1-2문장 설명"}],
  "overall": "제품 전체 특징 2-3문장 요약"
}`,
        },
      ],
    })

    // 7. Stream response to client while collecting full text
    const encoder = new TextEncoder()
    let fullText = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              fullText += text
              controller.enqueue(encoder.encode(text))
            }
          }

          // 7. Parse and cache the complete response (strip markdown code fences if present)
          try {
            const jsonText = fullText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
            const parsed: ProductExplanationData = JSON.parse(jsonText)
            // Use service role client to bypass RLS (anon client blocked by WITH CHECK false)
            const serviceClient = createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
            await serviceClient.from('product_explanations').upsert(
              {
                product_id: id,
                explanation: parsed,
                model: 'llama-3.3-70b-versatile',
              },
              { onConflict: 'product_id' }
            )
          } catch {
            // JSON parse failed -- still delivered the stream, but won't cache
          }

          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}
