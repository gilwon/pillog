import { SearchBar } from '@/components/common/SearchBar'
import { buttonVariants } from '@/lib/button-variants'
import { Card, CardContent } from '@/components/ui/card'
import {
  Pill, ArrowRight, Search, BarChart3, Shield, Sparkles,
  FlaskConical, GitCompareArrows, Activity,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const POPULAR_TAGS = [
  '항산화', '피부건강', '면역력', '피로회복',
  '눈건강', '장건강', '뼈건강', '혈행개선',
]


export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-x-clip px-4 pb-14 pt-16 sm:pb-20 sm:pt-24">
        {/* Background — warm teal gradient with amber glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-accent/[0.04] to-transparent" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.05] blur-[100px]" />
        <div className="pointer-events-none absolute -top-10 right-1/4 h-[300px] w-[400px] rounded-full bg-accent/[0.08] blur-[80px]" />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Pill className="h-3.5 w-3.5" />
            식약처 공공데이터 기반 성분 분석
          </div>

          <h1 className="animate-fade-in-up stagger-1 text-4xl font-extrabold leading-snug tracking-tight sm:text-5xl sm:leading-snug lg:text-6xl lg:leading-snug">
            영양제, <span className="text-primary">성분</span>으로
            <br />
            똑똑하게 고르세요
          </h1>

          <p className="animate-fade-in-up stagger-2 mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            어려운 성분 정보를 쉽게 풀어드립니다.
            <br className="hidden sm:block" />
            비교하고, 분석하고, 나에게 맞는 영양제를 찾아보세요.
          </p>

          <div className="animate-fade-in-up stagger-3 relative z-10 mt-10">
            <SearchBar size="large" className="mx-auto max-w-xl" />
          </div>

          <div className="animate-fade-in-up stagger-4 relative z-0 mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-xs text-muted-foreground/60">인기</span>
            {POPULAR_TAGS.map((tag) => (
              <Link
                key={tag}
                href={`/products?q=${encodeURIComponent(tag)}`}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'h-7 rounded-full border-border/50 bg-background/60 px-3 text-xs backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
                )}
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="animate-fade-in-up text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Pillog로 할 수 있는 것
          </h2>
          <p className="mt-3 text-muted-foreground">
            복잡한 건강기능식품 정보, 한눈에 파악하세요
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<FlaskConical className="h-6 w-6" />}
            title="성분 쉬운 해석"
            description="전문 용어를 쉬운 말로 번역해 드립니다. 어려운 화학 명칭 대신 어떤 효과가 있는지 바로 확인하세요."
            href="/products"
            index={0}
          />
          <FeatureCard
            icon={<GitCompareArrows className="h-6 w-6" />}
            title="제품 비교"
            description="최대 4개 제품의 성분을 나란히 비교하세요. 함량, 권장량 대비 비율을 한눈에 파악할 수 있습니다."
            href="/compare"
            index={1}
          />
          <FeatureCard
            icon={<Activity className="h-6 w-6" />}
            title="섭취량 관리"
            description="복용 중인 영양제를 등록하면 1일 총 섭취량과 과잉 섭취 여부를 자동으로 확인해 드립니다."
            href="/dashboard"
            index={2}
          />
        </div>

        <div className="animate-fade-in-up stagger-5 mt-14 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className={cn(buttonVariants({ size: 'lg' }), 'gap-2 shadow-md shadow-primary/15')}
          >
            제품 검색 시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/recommend"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'gap-2')}
          >
            <Sparkles className="h-4 w-4" />
            내 맞춤 추천 받기
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/60 bg-muted/30 px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="animate-fade-in-up text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">이렇게 사용하세요</h2>
            <p className="mt-3 text-muted-foreground">3단계로 시작하는 영양 관리</p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <StepCard
              step="01"
              title="영양제 검색"
              description="복용 중이거나 관심 있는 영양제를 검색하세요."
            />
            <StepCard
              step="02"
              title="성분 분석 확인"
              description="각 성분의 효과와 함량, 권장량 대비 비율을 확인하세요."
            />
            <StepCard
              step="03"
              title="비교 & 관리"
              description="제품을 비교하고, 내 영양제를 등록해 섭취량을 관리하세요."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  href,
  index,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  index: number
}) {
  return (
    <Link href={href} className="group block">
      <Card className={cn(
        'animate-fade-in-up h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
        index === 0 && 'stagger-2',
        index === 1 && 'stagger-3',
        index === 2 && 'stagger-4',
      )}>
        <CardContent className="p-6">
          <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary/15">
            {icon}
          </div>
          <h3 className="mb-2 text-lg font-semibold group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string
  title: string
  description: string
}) {
  return (
    <div className="animate-fade-in-up text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
        {step}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
