import { ChatPageClient } from '@/features/ai-chat/components/ChatPageClient'

export const metadata = {
  title: 'AI 영양 상담 | Pillog',
  description: '내 영양제를 기반으로 AI에게 맞춤 영양 상담을 받아보세요.',
}

export default function ChatPage() {
  return <ChatPageClient />
}
