'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Pill } from 'lucide-react'
import { Suspense, useState } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirect = searchParams.get('redirect') || '/'
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : error.message)
      } else {
        router.push(redirect)
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('확인 이메일을 발송했습니다. 이메일을 확인해 주세요.')
      }
    }

    setLoading(false)
  }

  // const handleSocialLogin = async (provider: 'kakao' | 'google') => {
  //   await supabase.auth.signInWithOAuth({
  //     provider,
  //     options: {
  //       redirectTo: `${window.location.origin}/callback?redirect=${encodeURIComponent(redirect)}`,
  //     },
  //   })
  // }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-4">
      <Pill className="mb-4 h-12 w-12 text-primary" />
      <h1 className="mb-2 text-2xl font-bold">Pillog {mode === 'login' ? '로그인' : '회원가입'}</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        로그인하면 내 영양제 등록, 섭취량 대시보드 등<br />
        개인화 기능을 이용할 수 있습니다.
      </p>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
          className="font-medium text-primary hover:underline"
        >
          {mode === 'login' ? '회원가입' : '로그인'}
        </button>
      </p>

      {/* 소셜 로그인 (비활성화) */}
      {/* <div className="mt-6 w-full space-y-3">
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-border" />
          <span className="mx-3 text-xs text-muted-foreground">또는</span>
          <div className="flex-grow border-t border-border" />
        </div>
        <button
          onClick={() => handleSocialLogin('kakao')}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-4 py-3 font-medium text-[#191919] hover:bg-[#FEE500]/90"
        >
          카카오 로그인
        </button>
        <button
          onClick={() => handleSocialLogin('google')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 font-medium text-foreground hover:bg-muted"
        >
          Google 로그인
        </button>
      </div> */}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
