import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { pillogApi } from '@/lib/api'
import { colors, fontSize, spacing } from '@/lib/theme'

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
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.loadingText}>제품 조회 중...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },
  errorIcon: { fontSize: 48, marginBottom: spacing.lg },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  barcodeText: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: spacing.sm },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary, fontSize: fontSize.lg - 1 },
})
