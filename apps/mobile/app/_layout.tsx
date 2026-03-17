import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { colors } from '@/lib/theme'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{ title: '제품 상세', headerBackTitle: '뒤로' }}
        />
      </Stack>
    </>
  )
}
