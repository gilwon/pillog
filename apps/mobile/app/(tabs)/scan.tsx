import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { colors, radius, fontSize } from '@/lib/theme'
import type { BarcodeScanResult } from '@pillog/types'

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const router = useRouter()

  const handleBarcodeScanned = useCallback(
    ({ type, data }: BarcodeScanResult) => {
      if (scanned) return
      setScanned(true)
      router.push(`/product/barcode?code=${encodeURIComponent(data)}&type=${type}`)
    },
    [scanned, router]
  )

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라 권한을 확인 중...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          바코드 스캔을 위해 카메라 접근 권한이 필요합니다.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>권한 허용</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text style={styles.scanHint}>제품 바코드를 박스 안에 맞춰주세요</Text>
        </View>
      </CameraView>

      {scanned && (
        <Pressable style={styles.rescanButton} onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>다시 스캔</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: { flex: 1, width: '100%' },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scanArea: {
    width: 280,
    height: 140,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  scanHint: { color: '#fff', fontSize: fontSize.md, textAlign: 'center' },
  message: {
    color: '#fff',
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  rescanButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  buttonText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '600' },
})
