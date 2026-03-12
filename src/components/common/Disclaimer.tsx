import { AlertTriangle } from 'lucide-react'

export function Disclaimer() {
  return (
    <div className="rounded-lg border border-caution/30 bg-caution/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-caution" />
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            면책 사항
          </p>
          <p>
            이 서비스는 식약처 공공데이터를 기반으로 한 정보 제공 목적이며,
            의학적 조언이나 진단을 대체하지 않습니다. 건강기능식품 섭취 전
            전문가와 상담하시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  )
}
