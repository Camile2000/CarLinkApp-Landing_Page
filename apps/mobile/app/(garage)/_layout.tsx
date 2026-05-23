import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { supabase } from '@carlink/shared/supabase/client';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/constants/colors';

export default function GarageLayout() {
  const { session, profile, loading } = useAuth();
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/signin');
      return;
    }

    if (profile?.role !== 'garage') {
      router.replace('/(driver)');
      return;
    }

    if (checkedRef.current === session.user.id) return;

    const checkGarageProfile = async () => {
      const { data, error } = await supabase
        .from('garages')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.warn('[garage layout] check failed', error.message);
        return;
      }

      checkedRef.current = session.user.id;

      if (!data) {
        router.replace('/(auth)/garage-setup');
      }
    };

    checkGarageProfile();
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
