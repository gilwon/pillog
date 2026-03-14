'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/lib/button-variants'
import { cn } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function AuthButton() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (loading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
  }

  if (user) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/my"
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'rounded-full')}
        >
          <User className="h-4 w-4" />
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/')
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">로그아웃</span>
        </Button>
      </div>
    )
  }

  return (
    <Link href="/login" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
      <LogIn className="h-4 w-4" />
      로그인
    </Link>
  )
}
