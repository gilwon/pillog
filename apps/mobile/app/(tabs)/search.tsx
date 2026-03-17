import { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { pillogApi } from '@/lib/api'
import { colors, radius, fontSize, spacing } from '@/lib/theme'
import type { ProductSearchResult } from '@pillog/types'

const POPULAR_TAGS = [
  '항산화', '피부건강', '면역력', '피로회복',
  '눈건강', '장건강', '뼈건강', '혈행개선',
]

const SUGGEST_DEBOUNCE_MS = 250

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const router = useRouter()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchResults = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const { data } = await pillogApi.searchProducts(text.trim())
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = useCallback((text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchResults(text), SUGGEST_DEBOUNCE_MS)
  }, [fetchResults])

  const handleTagPress = (tag: string) => {
    setQuery(tag)
    fetchResults(tag)
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <View style={styles.inputWrapper}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="영양제 이름 또는 성분을 검색하세요"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={handleChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
            onSubmitEditing={() => fetchResults(query)}
          />
        </View>
      </View>

      {/* Popular tags — only when no search */}
      {!searched && (
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsLabel}>인기 검색어</Text>
          <View style={styles.tagsRow}>
            {POPULAR_TAGS.map((tag) => (
              <Pressable key={tag} style={styles.tagChip} onPress={() => handleTagPress(tag)}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {loading && <ActivityIndicator style={styles.loader} color={colors.primary} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={styles.resultItem}
            onPress={() => router.push(`/product/${item.id}`)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.company}>{item.company}</Text>
            </View>
            {item.functionality_tags.length > 0 && (
              <View style={styles.tags}>
                {item.functionality_tags.slice(0, 2).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          searched && !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
              <Text style={styles.emptySubtext}>다른 키워드로 검색해보세요.</Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchIcon: { marginLeft: spacing.md },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  tagsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  tagsLabel: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  tagChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  loader: { marginTop: spacing.xl },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
    gap: spacing.md,
  },
  productName: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  company: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  tags: { flexDirection: 'row', gap: spacing.xs },
  tag: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: { fontSize: fontSize.xs, color: colors.primary },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
})
