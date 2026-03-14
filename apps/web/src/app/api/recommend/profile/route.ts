import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { HealthConcernKey } from '@/features/recommendation/types'
import { HEALTH_CONCERNS } from '@/features/recommendation/constants/health-concerns'

const VALID_KEYS = new Set<string>(HEALTH_CONCERNS.map((c) => c.key))

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', status: 401 } },
      { status: 401 }
    )
  }

  const { data } = await supabase
    .from('user_profiles')
    .select('health_concerns')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ health_concerns: data?.health_concerns ?? [] })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.', status: 401 } },
      { status: 401 }
    )
  }

  const body = await req.json().catch(() => null)
  const health_concerns: HealthConcernKey[] = (body?.health_concerns ?? []).filter(
    (c: string) => VALID_KEYS.has(c)
  )

  const { error } = await supabase
    .from('user_profiles')
    .upsert({ id: user.id, health_concerns, updated_at: new Date().toISOString() })

  if (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '저장 실패', status: 500 } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
