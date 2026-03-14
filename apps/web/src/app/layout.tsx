import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/common/Header'
import { Footer } from '@/components/common/Footer'
import { CompareBar } from '@/features/compare/components/CompareBar'
import { QueryProvider } from '@/components/common/QueryProvider'
import { ThemeProvider } from '@/components/common/ThemeProvider'

export const metadata: Metadata = {
  title: 'Pillog - 건강기능식품 성분 분석 플랫폼',
  description:
    '영양제 성분을 쉽게 이해하고 비교하세요. 식약처 공공데이터 기반 중립적 성분 분석 서비스.',
  keywords: ['건강기능식품', '영양제', '성분 분석', '비교', '필로그'],
  openGraph: {
    title: 'Pillog - 건강기능식품 성분 분석 플랫폼',
    description:
      '영양제 성분을 쉽게 이해하고 비교하세요. 식약처 공공데이터 기반 중립적 성분 분석 서비스.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="font-sans" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        <ThemeProvider>
          <QueryProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <CompareBar />
            <Footer />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
