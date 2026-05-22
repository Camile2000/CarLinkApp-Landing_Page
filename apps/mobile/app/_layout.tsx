import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

function RootLayoutContent() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/splash');
    }
  }, [session, loading]);

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0B1F3A' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'CarLink' }} />
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
