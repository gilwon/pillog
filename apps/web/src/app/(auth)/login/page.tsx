'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Pill } from 'lucide-react'
import { Suspense, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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
        // 신규 유저 감지: 스킵하지 않았고 health_concerns가 비어있으면 온보딩으로
        const skipped = localStorage.getItem('onboarding_skipped')
        if (!skipped) {
          const profileRes = await fetch('/api/recommend/profile')
          if (profileRes.ok) {
            const { health_concerns } = await profileRes.json()
            if (health_concerns.length === 0) {
              router.push('/onboarding')
              return
            }
          }
        }
        router.push(redirect)
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/onboarding`,
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

  // 소셜 로그인 (비활성화)
  // const handleSocialLogin = async (provider: 'kakao' | 'google') => {
  //   await supabase.auth.signInWithOAuth({
  //     provider,
  //     options: {
  //       redirectTo: `${window.location.origin}/callback?redirect=${encodeURIComponent(redirect)}`,
  //     },
  //   })
  // }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 flex items-center gap-2">
        <Pill className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">Pillog</span>
      </div>

      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>{mode === 'login' ? '로그인' : '회원가입'}</CardTitle>
          <CardDescription>
            로그인하면 내 영양제 등록, 섭취량 대시보드 등<br />
            개인화 기능을 이용할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {message && (
              <p className="text-sm text-primary">{message}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
              className="font-medium text-primary hover:underline"
            >
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>

          {/* 소셜 로그인 (비활성화)
          <div className="mt-6">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-border" />
              <span className="mx-3 text-xs text-muted-foreground">또는</span>
              <div className="flex-grow border-t border-border" />
            </div>
            <div className="mt-4 space-y-2">
              <Button variant="outline" className="w-full bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90 border-0"
                onClick={() => handleSocialLogin('kakao')}>
                카카오 로그인
              </Button>
              <Button variant="outline" className="w-full"
                onClick={() => handleSocialLogin('google')}>
                Google 로그인
              </Button>
            </div>
          </div>
          */}
        </CardContent>
      </Card>
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
