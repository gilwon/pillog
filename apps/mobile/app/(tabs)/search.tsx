import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { pillogApi } from '@/lib/api'
import type { ProductSearchResult } from '@pillog/types'

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text)
    if (text.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const { data } = await pillogApi.searchProducts(text)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="제품명 또는 성분명 검색"
          value={query}
          onChangeText={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {loading && <ActivityIndicator style={styles.loader} color="#6366f1" />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.resultItem}
            onPress={() => router.push(`/product/${item.id}`)}
          >
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.company}>{item.company}</Text>
            <View style={styles.tags}>
              {item.functionality_tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  loader: { marginTop: 20 },
  resultItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  productName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  company: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: '#ede9fe',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 11, color: '#6366f1' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9ca3af' },
})
