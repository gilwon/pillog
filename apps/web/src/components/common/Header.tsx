'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Pill, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthButton } from './AuthButton'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/products', label: '제품 검색' },
  { href: '/compare', label: '제품 비교' },
  { href: '/dashboard', label: '대시보드' },
  { href: '/my', label: '내 영양제' },
]

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg transition-opacity hover:opacity-80">
          <Pill className="h-6 w-6 text-primary" />
          <span>Pillog</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative rounded-md px-3 py-1.5 text-sm transition-colors',
                isActive(href)
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {label}
              {isActive(href) && (
                <span className="absolute inset-x-1 -bottom-[calc(0.5rem+1px)] h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
          {isLoggedIn && (
            <Link
              href="/chat"
              className={cn(
                'relative rounded-md px-3 py-1.5 text-sm transition-colors',
                isActive('/chat')
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              AI 상담
              {isActive('/chat') && (
                <span className="absolute inset-x-1 -bottom-[calc(0.5rem+1px)] h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AuthButton />
          {/* Hamburger button – mobile only */}
          <button
            type="button"
            className="ml-1 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="메뉴 열기"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="animate-fade-in border-t border-border/60 bg-background px-4 pb-4 pt-2 md:hidden">
          <ul className="flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm transition-colors',
                    isActive(href)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
            {isLoggedIn && (
              <li>
                <Link
                  href="/chat"
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm transition-colors',
                    isActive('/chat')
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  AI 상담
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}
