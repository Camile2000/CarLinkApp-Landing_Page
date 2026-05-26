import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ToastProvider } from '../src/components/ui/ToastProvider';

function RootLayoutContent() {
  const { session, profile, loading, profileError, signOut } = useAuth();
  const navigationInitializedRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    // Prevent multiple navigation calls
    if (navigationInitializedRef.current) return;
    navigationInitializedRef.current = true;

    if (!session) {
      router.replace('/(auth)/splash');
      return;
    }

    // Session présente mais fetch profile a échoué : on ne devine pas le rôle,
    // on déconnecte proprement pour éviter de router au mauvais endroit.
    if (profileError) {
      void signOut();
      router.replace('/(auth)/signin');
      return;
    }

    // Session présente mais profile=null (trigger pas encore exécuté côté DB).
    // On attend : le retry interne d'AuthContext relance, et un nouveau cycle
    // se déclenchera. Ne pas rediriger.
    if (!profile) return;

    switch (profile.role) {
      case 'garage':
        router.replace('/(garage)');
        break;
      case 'admin':
      case 'conductor':
      default:
        router.replace('/(driver)');
    }
  }, [session, profile, loading, profileError, signOut]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
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
      <ToastProvider>
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
