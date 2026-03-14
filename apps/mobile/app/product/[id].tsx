import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { pillogApi } from '@/lib/api'
import type { ProductWithIngredients } from '@pillog/types'

const DISCLAIMER = '이 정보는 식약처 공공데이터를 기반으로 하며, 의학적 조언이 아닙니다.'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [product, setProduct] = useState<ProductWithIngredients | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    pillogApi
      .getProduct(id)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    )
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>제품을 찾을 수 없습니다.</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.company}>{product.company}</Text>
        <View style={styles.tags}>
          {product.functionality_tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>성분 정보</Text>
        {product.ingredients.map((ing) => (
          <View key={ing.id} style={styles.ingredientRow}>
            <View style={styles.ingredientHeader}>
              <Text style={styles.ingredientName}>{ing.canonical_name}</Text>
              {ing.amount != null && (
                <Text style={styles.ingredientAmount}>
                  {ing.amount} {ing.amount_unit}
                </Text>
              )}
            </View>
            {ing.description && (
              <Text style={styles.ingredientDesc}>{ing.description}</Text>
            )}
            {ing.daily_rdi != null && ing.amount != null && (
              <View style={styles.rdiBar}>
                <View
                  style={[
                    styles.rdiProgress,
                    {
                      width: `${Math.min((ing.amount / ing.daily_rdi) * 100, 100)}%`,
                      backgroundColor:
                        ing.daily_ul && ing.amount > ing.daily_ul
                          ? '#ef4444'
                          : '#6366f1',
                    },
                  ]}
                />
                <Text style={styles.rdiText}>
                  권장량 대비 {Math.round((ing.amount / ing.daily_rdi) * 100)}%
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {product.how_to_take && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>섭취 방법</Text>
          <Text style={styles.sectionContent}>{product.how_to_take}</Text>
        </View>
      )}

      {product.caution && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주의사항</Text>
          <Text style={styles.sectionContent}>{product.caution}</Text>
        </View>
      )}

      <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#6b7280', fontSize: 16 },
  header: { backgroundColor: '#fff', padding: 20, marginBottom: 8 },
  productName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  company: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: {
    backgroundColor: '#ede9fe',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 12, color: '#6366f1' },
  section: { backgroundColor: '#fff', padding: 20, marginBottom: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionContent: { fontSize: 14, color: '#374151', lineHeight: 22 },
  ingredientRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  ingredientAmount: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
  ingredientDesc: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  rdiBar: { marginTop: 8 },
  rdiProgress: { height: 4, borderRadius: 2, marginBottom: 4 },
  rdiText: { fontSize: 11, color: '#9ca3af' },
  disclaimer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 20,
    lineHeight: 18,
  },
})
