import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createClient()

    const { data: snapshot, error } = await supabase
      .from('share_snapshots')
      .select('type, data, created_at, expires_at')
      .eq('id', token)
      .single()

    if (error || !snapshot) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '공유 링크를 찾을 수 없습니다.', status: 404 } },
        { status: 404 }
      )
    }

    // Check expiration
    if (new Date(snapshot.expires_at) < new Date()) {
      return NextResponse.json(
        { error: { code: 'EXPIRED', message: '공유 링크가 만료되었습니다.', status: 410 } },
        { status: 410 }
      )
    }

    return NextResponse.json({
      type: snapshot.type,
      data: snapshot.data,
      created_at: snapshot.created_at,
      expires_at: snapshot.expires_at,
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.', status: 500 } },
      { status: 500 }
    )
  }
}
