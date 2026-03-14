import { AlertTriangle } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

export function Disclaimer() {
  return (
    <Alert variant="caution">
      <AlertTriangle />
      <AlertTitle>면책 사항</AlertTitle>
      <AlertDescription>
        이 서비스는 식약처 공공데이터를 기반으로 한 정보 제공 목적이며,
        의학적 조언이나 진단을 대체하지 않습니다. 건강기능식품 섭취 전
        전문가와 상담하시기 바랍니다.
      </AlertDescription>
    </Alert>
  )
}
