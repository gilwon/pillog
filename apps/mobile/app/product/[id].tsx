import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { pillogApi } from '@/lib/api'
import { colors, radius, fontSize, spacing } from '@/lib/theme'
import type { ProductWithIngredients } from '@pillog/types'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
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
        <ActivityIndicator color={colors.primary} size="large" />
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

  const getRdiColor = (amount: number, rdi: number, ul?: number | null) => {
    if (ul && amount > ul) return colors.warning
    const pct = (amount / rdi) * 100
    if (pct > 150) return colors.caution
    return colors.safe
  }

  // Parse raw_materials
  const rawMaterialItems = product.raw_materials
    ? product.raw_materials.split(',').map((s: string) => s.trim()).filter(Boolean)
    : []

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.company}>{product.company}</Text>
        <Text style={styles.productName}>{product.name}</Text>
        {product.functionality_tags.length > 0 && (
          <View style={styles.tags}>
            {product.functionality_tags.map((tag, i) => (
              <View key={`${tag}-${i}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Ingredients */}
      {product.ingredients.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기능성 원료</Text>
          {product.ingredients.map((ing) => (
            <View key={ing.id} style={styles.ingredientRow}>
              <View style={styles.ingredientHeader}>
                <Text style={styles.ingredientName}>{ing.canonical_name}</Text>
                {ing.amount != null && (
                  <Text style={[styles.ingredientAmount, { color: colors.primary }]}>
                    {ing.amount}{ing.amount_unit || 'mg'}
                  </Text>
                )}
              </View>
              {ing.description && (
                <Text style={styles.ingredientDesc}>{ing.description}</Text>
              )}
              {ing.daily_rdi != null && ing.amount != null && (
                <View style={styles.rdiBar}>
                  <View style={styles.rdiTrack}>
                    <View
                      style={[
                        styles.rdiProgress,
                        {
                          width: `${Math.min((ing.amount / ing.daily_rdi) * 100, 100)}%`,
                          backgroundColor: getRdiColor(ing.amount, ing.daily_rdi, ing.daily_ul),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.rdiText}>
                    RDI 대비 {Math.round((ing.amount / ing.daily_rdi) * 100)}%
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Raw materials */}
      {rawMaterialItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>원재료</Text>
          <View style={styles.rawMaterialsWrap}>
            {rawMaterialItems.map((item, i) => (
              <Pressable
                key={`raw-${i}`}
                style={styles.rawMaterialChip}
                onPress={() => {
                  router.push(`/(tabs)/search`)
                }}
              >
                <Text style={styles.rawMaterialText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Details */}
      {product.how_to_take && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>섭취 방법</Text>
          <Text style={styles.sectionContent}>{product.how_to_take}</Text>
        </View>
      )}

      {product.caution && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주의사항</Text>
          <Text style={styles.cautionContent}>{product.caution}</Text>
        </View>
      )}

      {product.storage_method && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>보관방법</Text>
          <Text style={styles.sectionContent}>{product.storage_method}</Text>
        </View>
      )}

      <Text style={styles.disclaimer}>
        이 정보는 식약처 공공데이터를 기반으로 하며, 의학적 조언이 아닙니다.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.textSecondary, fontSize: fontSize.lg },

  // Header
  header: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.sm,
  },
  company: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  productName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tag: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '500' },

  // Sections
  section: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  sectionContent: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  cautionContent: { fontSize: fontSize.md, color: colors.warning, lineHeight: 22 },

  // Ingredients
  ingredientRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: { fontSize: fontSize.lg - 1, fontWeight: '600', color: colors.text, flex: 1 },
  ingredientAmount: { fontSize: fontSize.md, fontWeight: '600' },
  ingredientDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  rdiBar: { marginTop: spacing.sm },
  rdiTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
  },
  rdiProgress: { height: 4, borderRadius: 2 },
  rdiText: { fontSize: fontSize.xs, color: colors.textTertiary },

  // Raw materials
  rawMaterialsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rawMaterialChip: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.background,
  },
  rawMaterialText: { fontSize: fontSize.sm, color: colors.text },

  // Disclaimer
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.xl,
    lineHeight: 18,
  },
})
