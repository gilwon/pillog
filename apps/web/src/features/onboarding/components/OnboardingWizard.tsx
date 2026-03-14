'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HealthConcernSelector } from '@/features/recommendation/components/HealthConcernSelector'
import { HEALTH_CONCERNS } from '@/features/recommendation/constants/health-concerns'
import { cn } from '@/lib/utils'
import type { HealthConcernKey } from '@/features/recommendation/types'

type Step = 1 | 2 | 3

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [selectedConcerns, setSelectedConcerns] = useState<HealthConcernKey[]>([])
  const [saving, setSaving] = useState(false)

  const toggleConcern = (key: HealthConcernKey) => {
    setSelectedConcerns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSaveAndNext = async () => {
    setSaving(true)
    await fetch('/api/recommend/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ health_concerns: selectedConcerns }),
    })
    setSaving(false)
    setStep(3)
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding_skipped', '1')
    router.push('/my')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <StepIndicator current={step} total={3} />

      {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}

      {step === 2 && (
        <HealthConcernStep
          selectedConcerns={selectedConcerns}
          onToggle={toggleConcern}
          onNext={handleSaveAndNext}
          onSkip={handleSkip}
          saving={saving}
        />
      )}

      {step === 3 && (
        <CompleteStep
          selectedConcerns={selectedConcerns}
          onRecommend={() => router.push('/recommend')}
          onMyPage={() => router.push('/my')}
        />
      )}
    </div>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-10 flex items-center justify-center gap-3">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex items-center gap-3">
          <div
            className={cn(
              'h-3 w-3 rounded-full transition-colors',
              n <= current ? 'bg-primary' : 'bg-muted'
            )}
          />
          {n < total && <div className="h-px w-8 bg-muted" />}
        </div>
      ))}
    </div>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="inline-flex rounded-2xl bg-primary/10 p-5">
          <Pill className="h-12 w-12 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pillog에 오신 것을 환영해요!</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            내 건강 고민에 맞는 영양제를 찾고,
            <br />
            올바르게 복용하는 가장 쉬운 방법을 알려드릴게요.
          </p>
        </div>
      </div>

      <div className="grid gap-3 text-left sm:grid-cols-3">
        {[
          { emoji: '🔍', title: '성분 쉬운 해석', desc: '어려운 용어를 쉽게' },
          { emoji: '✨', title: '맞춤 추천', desc: '내 건강 고민 기반' },
          { emoji: '📊', title: '섭취량 관리', desc: '과잉 복용 방지' },
        ].map(({ emoji, title, desc }) => (
          <div key={title} className="rounded-xl border bg-card p-4 text-center">
            <div className="text-2xl">{emoji}</div>
            <div className="mt-2 font-medium text-sm">{title}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        딱 1분만 투자하면 맞춤 영양제 추천을 받을 수 있어요.
      </p>

      <Button size="lg" onClick={onNext} className="gap-2">
        시작하기
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function HealthConcernStep({
  selectedConcerns,
  onToggle,
  onNext,
  onSkip,
  saving,
}: {
  selectedConcerns: HealthConcernKey[]
  onToggle: (key: HealthConcernKey) => void
  onNext: () => Promise<void>
  onSkip: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-bold">어떤 건강 고민이 있으신가요?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          선택하신 고민에 맞는 영양제를 추천해 드릴게요.
        </p>
      </div>

      <HealthConcernSelector selected={selectedConcerns} onToggle={onToggle} />

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button
          size="lg"
          onClick={onNext}
          disabled={selectedConcerns.length === 0 || saving}
          className="gap-2 w-full sm:w-auto"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          다음
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={onSkip}
          disabled={saving}
          className="w-full sm:w-auto text-muted-foreground"
        >
          나중에 설정
        </Button>
      </div>
    </div>
  )
}

function CompleteStep({
  selectedConcerns,
  onRecommend,
  onMyPage,
}: {
  selectedConcerns: HealthConcernKey[]
  onRecommend: () => void
  onMyPage: () => void
}) {
  const concernLabels = selectedConcerns.map(
    (key) => HEALTH_CONCERNS.find((c) => c.key === key) ?? { key, label: key, emoji: '' }
  )

  return (
    <div className="space-y-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="inline-flex rounded-full bg-green-100 p-4 dark:bg-green-900/30">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">설정 완료!</h2>
          <p className="mt-2 text-muted-foreground">
            맞춤 건강 정보가 준비되었어요.
          </p>
        </div>
      </div>

      {concernLabels.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">선택하신 건강 고민</p>
          <div className="flex flex-wrap justify-center gap-2">
            {concernLabels.map(({ key, label, emoji }) => (
              <Badge key={key} variant="secondary" className="px-3 py-1 text-sm">
                {emoji} {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button size="lg" onClick={onRecommend} className="gap-2 w-full sm:w-auto">
          <ArrowRight className="h-4 w-4" />
          맞춤 추천 보기
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onMyPage}
          className="w-full sm:w-auto"
        >
          내 영양제 관리하기
        </Button>
      </div>
    </div>
  )
}
