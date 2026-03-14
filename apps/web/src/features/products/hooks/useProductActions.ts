'use client'
import { useState, useCallback, useEffect } from 'react'

interface Notification {
  message: string
  variant: 'success' | 'destructive'
}

interface UseProductActionsReturn {
  addSupplement: () => Promise<void>
  addFavorite: () => Promise<void>
  isSupplement: boolean
  isFavorite: boolean
  notification: Notification | null
  clearNotification: () => void
}

export function useProductActions(productId: string): UseProductActionsReturn {
  const [isSupplement, setIsSupplement] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      const [suppRes, favRes] = await Promise.all([
        fetch(`/api/my/supplements?product_id=${productId}`),
        fetch(`/api/my/favorites?product_id=${productId}`),
      ])
      if (suppRes.ok) {
        const { registered } = await suppRes.json()
        setIsSupplement(!!registered)
      }
      if (favRes.ok) {
        const { favorited } = await favRes.json()
        setIsFavorite(!!favorited)
      }
    }
    checkStatus()
  }, [productId])

  const showNotification = useCallback(
    (message: string, variant: 'success' | 'destructive') => {
      setNotification({ message, variant })
      setTimeout(() => setNotification(null), 3000)
    },
    []
  )

  const clearNotification = useCallback(() => setNotification(null), [])

  const addSupplement = async () => {
    try {
      const res = await fetch('/api/my/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      })
      if (res.ok) {
        setIsSupplement(true)
        showNotification('내 영양제에 등록되었습니다.', 'success')
      } else {
        const data = await res.json()
        showNotification(data.error?.message || '등록에 실패했습니다.', 'destructive')
      }
    } catch {
      showNotification('등록에 실패했습니다.', 'destructive')
    }
  }

  const addFavorite = async () => {
    try {
      const res = await fetch('/api/my/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      })
      if (res.ok) {
        setIsFavorite(true)
        showNotification('즐겨찾기에 추가되었습니다.', 'success')
      } else {
        const data = await res.json()
        showNotification(data.error?.message || '추가에 실패했습니다.', 'destructive')
      }
    } catch {
      showNotification('추가에 실패했습니다.', 'destructive')
    }
  }

  return { addSupplement, addFavorite, isSupplement, isFavorite, notification, clearNotification }
}
