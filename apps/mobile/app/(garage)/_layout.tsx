import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/constants/colors';

export default function GarageLayout() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/signin');
      return;
    }

    if (profile?.role !== 'garage') {
      router.replace('/(driver)');
    }
  }, [session, profile, loading]);

  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navyDeep },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Tableau de bord' }} />
    </Stack>
  );
}
