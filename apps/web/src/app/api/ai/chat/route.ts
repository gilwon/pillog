import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `당신은 친근하고 전문적인 영양 상담사입니다.
- 사용자의 영양제 목록을 바탕으로 맞춤 조언을 제공합니다
- 전문 용어를 피하고 쉬운 한국어로 설명합니다
- 과학적 근거에 기반하되 단정적인 표현은 피합니다
- 필요시 전문의나 약사와 상담을 권유합니다
- 응답은 200~400자 정도로 핵심만 간결하게 작성합니다
- 마지막에 "이 정보는 교육 목적이며 의학적 조언이 아닙니다." 문구를 포함하지 마세요. 대신 필요시 "전문가 상담을 권장합니다"라고 간단히 언급하세요`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', status: 401 } },
        { status: 401 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'AI 상담 서비스를 사용할 수 없습니다.',
            status: 503,
          },
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { messages } = body as {
      messages: { role: string; content: string }[]
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '메시지가 필요합니다.', status: 400 } },
        { status: 400 }
      )
    }

    // Filter only allowed roles to prevent system prompt injection (SEC-010)
    const filteredMessages = messages.filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )

    // Limit message count and length to prevent abuse (SEC-005)
    const MAX_MESSAGES = 20
    const MAX_MESSAGE_LENGTH = 2000
    if (filteredMessages.length === 0 || filteredMessages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: `메시지는 1~${MAX_MESSAGES}개까지 가능합니다.`, status: 400 } },
        { status: 400 }
      )
    }
    if (filteredMessages.some((m) => m.content.length > MAX_MESSAGE_LENGTH)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: `메시지는 ${MAX_MESSAGE_LENGTH}자 이하여야 합니다.`, status: 400 } },
        { status: 400 }
      )
    }

    // Inject user supplement context
    let contextPrefix = ''
    try {
      const { data: supplements } = await supabase
        .from('user_supplements')
        .select('product:products(name)')
        .eq('user_id', user.id)
        .limit(20)

      if (supplements && supplements.length > 0) {
        const names = supplements
          .map((s) => (s.product as unknown as { name: string } | null)?.name)
          .filter(Boolean)
          .join(', ')
        contextPrefix = `[사용자 현재 복용 영양제: ${names}]\n\n`
      }
    } catch {
      // no-op — context injection is optional
    }

    const groq = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const lastUserMessage = filteredMessages[filteredMessages.length - 1]
    const messagesWithContext =
      contextPrefix && lastUserMessage.role === 'user'
        ? [
            ...filteredMessages.slice(0, -1),
            {
              ...lastUserMessage,
              content: contextPrefix + lastUserMessage.content,
            },
          ]
        : filteredMessages

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      temperature: 0.5,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messagesWithContext,
      ],
    })

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(encoder.encode(text))
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
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다.',
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}
