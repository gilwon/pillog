import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { pillogApi } from '@/lib/api'

/**
 * 바코드 스캔 결과 처리 화면
 * @pillog/api-client의 getProductByBarcode()로 제품을 조회하고
 * 성공 시 제품 상세 화면으로 리다이렉트, 실패 시 에러 메시지 표시
 */
export default function BarcodeProductScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    pillogApi
      .getProductByBarcode(code)
      .then((product) => {
        if (product?.id) {
          router.replace(`/product/${product.id}`)
        } else {
          setError('해당 바코드의 제품을 찾을 수 없습니다.\n수동으로 검색해 보세요.')
        }
      })
      .catch(() => {
        setError('제품 조회 중 오류가 발생했습니다.')
      })
  }, [code, router])

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>😔</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.barcodeText}>바코드: {code}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#6366f1" size="large" />
      <Text style={styles.loadingText}>제품 조회 중...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  barcodeText: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 15 },
})
