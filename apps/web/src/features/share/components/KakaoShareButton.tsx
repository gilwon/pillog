'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

// Extend Window for Kakao SDK
declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void
      isInitialized: () => boolean
      Share: {
        sendDefault: (options: Record<string, unknown>) => void
      }
    }
  }
}

interface KakaoShareButtonProps {
  url: string
  title: string
  description: string
}

export function KakaoShareButton({
  url,
  title,
  description,
}: KakaoShareButtonProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY

  useEffect(() => {
    if (!kakaoKey) return

    // Load Kakao SDK if not already loaded
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoKey)
      }
      setSdkLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'
    script.crossOrigin = 'anonymous'
    script.integrity = 'sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmO1GRhk+IEWly96bMlR97KSr'
    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoKey)
      }
      setSdkLoaded(true)
    }
    document.head.appendChild(script)
  }, [kakaoKey])

  const handleKakaoShare = () => {
    if (!window.Kakao) return

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl: `${window.location.origin}/og-image.png`,
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
      buttons: [
        {
          title: '확인하기',
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
      ],
    })
  }

  // Don't render if no Kakao key configured
  if (!kakaoKey) return null

  return (
    <button
      onClick={handleKakaoShare}
      disabled={!sdkLoaded}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] px-4 py-2.5 text-sm font-medium text-[#3C1E1E] transition-colors hover:bg-[#FDD835] disabled:opacity-50"
    >
      <MessageCircle className="h-4 w-4" />
      카카오톡으로 공유
    </button>
  )
}
