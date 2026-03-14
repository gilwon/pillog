import { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { pillogApi } from '@/lib/api'
import type { UserSupplement } from '@pillog/types'

// getMySupplements는 products 조인 포함 반환
type SupplementWithProduct = UserSupplement & {
  products: {
    id: string
    name: string
    company: string
    shape: string | null
    functionality_tags: string[]
  } | null
}

// ─── Loading ───────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color="#6366f1" size="large" />
    </View>
  )
}

// ─── Login ─────────────────────────────────────────────────────────────────

function LoginView() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.loginTitle}>내 영양제</Text>
      <Text style={styles.loginSubtitle}>로그인하고 복용 중인 영양제를 관리하세요</Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.loginButtonText}>로그인</Text>
        )}
      </Pressable>
    </View>
  )
}

// ─── Add Supplement Modal ───────────────────────────────────────────────────

interface AddSupplementModalProps {
  visible: boolean
  userId: string
  onClose: () => void
  onAdded: () => void
}

function AddSupplementModal({ visible, userId, onClose, onAdded }: AddSupplementModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string; name: string; company: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

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

  const handleAdd = async (productId: string) => {
    setAdding(productId)
    try {
      await pillogApi.addSupplement(userId, productId)
      onAdded()
      onClose()
      setQuery('')
      setResults([])
    } catch (e: unknown) {
      const msg = e instanceof Error && e.message === 'SUPPLEMENT_DUPLICATE'
        ? '이미 등록된 영양제입니다.'
        : '영양제 추가에 실패했습니다.'
      Alert.alert('오류', msg)
    } finally {
      setAdding(null)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>영양제 추가</Text>
          <Pressable onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>닫기</Text>
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="제품명 또는 성분명 검색"
            value={query}
            onChangeText={handleSearch}
            autoFocus
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
              onPress={() => handleAdd(item.id)}
              disabled={adding === item.id}
            >
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultCompany}>{item.company}</Text>
              </View>
              {adding === item.id ? (
                <ActivityIndicator color="#6366f1" size="small" />
              ) : (
                <Text style={styles.addButtonText}>추가</Text>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            query.length >= 2 && !loading ? (
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
            ) : null
          }
        />
      </View>
    </Modal>
  )
}

// ─── My Supplements View ───────────────────────────────────────────────────

interface MySupplementsViewProps {
  userId: string
}

function MySupplementsView({ userId }: MySupplementsViewProps) {
  const router = useRouter()
  const { signOut } = useAuth()
  const [supplements, setSupplements] = useState<SupplementWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchSupplements = useCallback(async () => {
    try {
      const data = await pillogApi.getMySupplements(userId)
      setSupplements(data as SupplementWithProduct[])
    } catch {
      Alert.alert('오류', '영양제 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId])

  useEffect(() => {
    fetchSupplements()
  }, [fetchSupplements])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSupplements()
  }

  const handleDoseChange = async (id: string, newDose: number) => {
    // 낙관적 업데이트
    const prev = supplements
    setSupplements((s) => s.map((item) => item.id === id ? { ...item, daily_dose: newDose } : item))
    try {
      await pillogApi.updateSupplement(id, userId, newDose)
    } catch {
      setSupplements(prev) // 롤백
      Alert.alert('오류', '복용량 변경에 실패했습니다.')
    }
  }

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '영양제 삭제',
      `"${name}"을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await pillogApi.deleteSupplement(id, userId)
              setSupplements((s) => s.filter((item) => item.id !== id))
            } catch {
              Alert.alert('오류', '삭제에 실패했습니다.')
            }
          },
        },
      ]
    )
  }

  if (loading) return <LoadingView />

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 영양제</Text>
        <Pressable onPress={signOut}>
          <Text style={styles.signOutText}>로그아웃</Text>
        </Pressable>
      </View>

      <FlatList
        data={supplements}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
        }
        renderItem={({ item }) => {
          const product = item.products
          if (!product) return null
          return (
            <View style={styles.supplementItem}>
              <Pressable
                style={styles.supplementInfo}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <Text style={styles.supplementName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.supplementCompany}>{product.company}</Text>
              </Pressable>

              <View style={styles.doseControl}>
                <Pressable
                  style={[styles.doseBtn, item.daily_dose <= 1 && styles.doseBtnDisabled]}
                  onPress={() => item.daily_dose > 1 && handleDoseChange(item.id, item.daily_dose - 1)}
                  disabled={item.daily_dose <= 1}
                >
                  <Text style={styles.doseBtnText}>−</Text>
                </Pressable>
                <Text style={styles.doseValue}>{item.daily_dose}</Text>
                <Pressable
                  style={styles.doseBtn}
                  onPress={() => handleDoseChange(item.id, item.daily_dose + 1)}
                >
                  <Text style={styles.doseBtnText}>+</Text>
                </Pressable>
                <Text style={styles.doseUnit}>회/일</Text>
              </View>

              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, product.name)}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </Pressable>
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>등록된 영양제가 없습니다</Text>
            <Text style={styles.emptySubtitle}>아래 + 버튼으로 추가하거나{'\n'}스캔 탭에서 바코드를 스캔해보세요</Text>
          </View>
        }
      />

      {/* 영양제 추가 FAB */}
      <Pressable style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <AddSupplementModal
        visible={showAddModal}
        userId={userId}
        onClose={() => setShowAddModal(false)}
        onAdded={fetchSupplements}
      />
    </View>
  )
}

// ─── Screen Entry Point ────────────────────────────────────────────────────

export default function MyScreen() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingView />
  if (!user) return <LoginView />
  return <MySupplementsView userId={user.id} />
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#f9fafb' },

  // Login
  loginContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 24,
    justifyContent: 'center',
  },
  loginTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  loginSubtitle: { fontSize: 15, color: '#6b7280', marginBottom: 32 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
  loginButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  signOutText: { fontSize: 14, color: '#9ca3af' },

  // Supplement item
  supplementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 8,
  },
  supplementInfo: { flex: 1, minWidth: 0 },
  supplementName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  supplementCompany: { fontSize: 12, color: '#9ca3af', marginTop: 2 },

  // Dose control
  doseControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doseBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  doseBtnDisabled: { borderColor: '#e5e7eb', opacity: 0.4 },
  doseBtnText: { fontSize: 16, color: '#374151', lineHeight: 20 },
  doseValue: { minWidth: 24, textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#111827' },
  doseUnit: { fontSize: 11, color: '#9ca3af' },

  // Delete
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 14, color: '#d1d5db' },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 26, lineHeight: 30 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalClose: { padding: 4 },
  modalCloseText: { fontSize: 15, color: '#6366f1' },
  searchBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  loader: { marginTop: 20 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  resultCompany: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  addButtonText: { fontSize: 14, fontWeight: '600', color: '#6366f1' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9ca3af', fontSize: 14 },
})
