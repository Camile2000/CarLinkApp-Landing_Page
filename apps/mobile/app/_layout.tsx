import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

function RootLayoutContent() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/splash');
      return;
    }

    // loading=false guarantees profile fetch is complete
    switch (profile?.role) {
      case 'garage':
        router.replace('/(garage)');
        break;
      case 'conductor':
      case 'admin':
      default:
        router.replace('/(driver)');
    }
  }, [session, profile, loading]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="(garage)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="index" options={{ headerShown: true, title: 'CarLink' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
