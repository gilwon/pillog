'use client'

import { useState, useCallback } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return

      const newMessages: ChatMessage[] = [
        ...messages,
        { role: 'user', content: userMessage },
      ]
      setMessages(newMessages)
      setIsLoading(true)
      setError(null)

      // Placeholder for streaming assistant response
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error?.message || '응답을 받지 못했습니다.')
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        if (!reader) throw new Error('Stream unavailable')

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          accumulated += chunk
          // Update last assistant message incrementally
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: accumulated,
            }
            return updated
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '오류가 발생했습니다.'
        setError(msg)
        // Remove empty assistant placeholder on error
        setMessages((prev) =>
          prev[prev.length - 1]?.content === ''
            ? prev.slice(0, -1)
            : prev
        )
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading]
  )

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendMessage, reset }
}
