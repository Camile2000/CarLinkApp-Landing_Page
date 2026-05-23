import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { supabase } from '@carlink/shared/supabase/client';
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
      return;
    }

    const checkGarageProfile = async () => {
      if (!session.user.id) return;
      const { data } = await supabase
        .from('garages')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

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
