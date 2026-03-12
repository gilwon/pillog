'use client'

import Link from 'next/link'
import { Pill } from 'lucide-react'
import { AuthButton } from './AuthButton'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Pill className="h-6 w-6 text-primary" />
          <span>Pillog</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="/products"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            제품 검색
          </Link>
          <Link
            href="/compare"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            비교
          </Link>
          <Link
            href="/dashboard"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            대시보드
          </Link>
          <Link
            href="/my"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            내 영양제
          </Link>
        </nav>

        <AuthButton />
      </div>
    </header>
  )
}
