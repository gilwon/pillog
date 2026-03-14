import { createClient } from '@/lib/supabase/server'
import { SharedSupplements } from '@/features/share/components/SharedSupplements'
import { SharedCompare } from '@/features/share/components/SharedCompare'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Metadata } from 'next'
import type { SupplementShareData, CompareShareData } from '@/types/database'

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const supabase = await createClient()
  const { data: snapshot } = await supabase
    .from('share_snapshots')
    .select('type')
    .eq('id', token)
    .single()

  const title =
    snapshot?.type === 'supplements'
      ? '공유된 영양제 목록 | Pillog'
      : snapshot?.type === 'compare'
        ? '공유된 제품 비교 | Pillog'
        : '공유 페이지 | Pillog'

  return {
    title,
    description: '건강기능식품 성분 분석 결과를 확인해보세요.',
    openGraph: {
      title,
      description: '건강기능식품 성분 분석 결과를 확인해보세요.',
      type: 'website',
    },
  }
}

export default async function SharePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: snapshot, error } = await supabase
    .from('share_snapshots')
    .select('type, data, created_at, expires_at')
    .eq('id', token)
    .single()

  if (error || !snapshot) {
    notFound()
  }

  // Check expiration
  if (new Date(snapshot.expires_at) < new Date()) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold">링크가 만료되었습니다</h1>
        <p className="mb-6 text-muted-foreground">
          이 공유 링크는 유효 기간이 지나 더 이상 사용할 수 없습니다.
        </p>
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Pillog 홈으로 이동
        </Link>
      </div>
    )
  }

  const createdDate = format(new Date(snapshot.created_at), 'yyyy년 M월 d일', {
    locale: ko,
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          공유일: {createdDate}
        </p>
      </div>

      {/* Content */}
      {snapshot.type === 'supplements' && (
        <SharedSupplements
          data={snapshot.data as unknown as SupplementShareData}
        />
      )}

      {snapshot.type === 'compare' && (
        <SharedCompare
          data={snapshot.data as unknown as CompareShareData}
        />
      )}

      {/* CTA */}
      <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-5 text-center">
        <p className="mb-3 text-sm font-medium">
          나도 내 영양제 성분을 분석해보고 싶다면?
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Pillog에서 분석하기
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        이 데이터는 공유 시점({createdDate}) 기준이며, 현재와 다를 수 있습니다.
      </p>
    </div>
  )
}
