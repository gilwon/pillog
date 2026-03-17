import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/utils'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효한 ID가 필요합니다.', status: 400 } },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.',
            status: 401,
          },
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.daily_dose !== undefined) updates.daily_dose = body.daily_dose
    if (body.note !== undefined) updates.note = body.note
    if (body.started_at !== undefined) updates.started_at = body.started_at

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '수정할 필드가 없습니다.', status: 400 } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_supplements')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효한 ID가 필요합니다.', status: 400 } },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다.',
            status: 401,
          },
        },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('user_supplements')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
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
