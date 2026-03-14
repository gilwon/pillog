import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 같은 서버 렌더 요청 내에서 auth 중복 호출 방지
const getAdminUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return { user, supabase }
})

/**
 * 서버 사이드에서 관리자 인증을 확인합니다.
 * API Route에서 사용: const { user, supabase } = await requireAdmin()
 * 관리자가 아닌 경우 NextResponse 에러를 throw합니다.
 */
export async function requireAdmin() {
  const result = await getAdminUser()
  if (!result) {
    throw NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '관리자 권한이 필요합니다.', status: 401 } },
      { status: 401 }
    )
  }
  return result
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const result = await getAdminUser()
    return result !== null
  } catch {
    return false
  }
}
