import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getSafeRedirect(value: string | null, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = getSafeRedirect(searchParams.get('redirect'), '/onboarding')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
