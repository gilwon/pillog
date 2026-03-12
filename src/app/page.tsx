import { SearchBar } from '@/components/common/SearchBar'
import { Pill, ArrowRight, Search, BarChart3, Shield } from 'lucide-react'
import Link from 'next/link'

const POPULAR_TAGS = [
  '항산화',
  '피부건강',
  '면역력',
  '피로회복',
  '눈건강',
  '장건강',
  '뼈건강',
  '혈행개선',
]

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Pill className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Pillog</h1>
          </div>
          <p className="mb-8 text-lg text-muted-foreground">
            영양제 성분을 쉽게 이해하고, 비교하고, 관리하세요.
            <br />
            식약처 공공데이터 기반 중립적 성분 분석 서비스.
          </p>
          <SearchBar size="large" className="mx-auto max-w-xl" />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {POPULAR_TAGS.map((tag) => (
              <Link
                key={tag}
                href={`/products?q=${encodeURIComponent(tag)}`}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold">
          Pillog로 할 수 있는 것
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Search className="h-8 w-8" />}
            title="성분 쉬운 해석"
            description="전문 용어를 쉬운 말로 번역해 드립니다. 어려운 화학 명칭 대신 어떤 효과가 있는지 바로 확인하세요."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="제품 비교"
            description="최대 4개 제품의 성분을 나란히 비교하세요. 함량, 권장량 대비 비율을 한눈에 파악할 수 있습니다."
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="섭취량 관리"
            description="복용 중인 영양제를 등록하면 1일 총 섭취량과 과잉 섭취 여부를 자동으로 확인해 드립니다."
          />
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            제품 검색 시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border p-6 text-center">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
