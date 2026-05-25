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
        // Cas anormal : compte garage sans ligne garages associée.
        // Avec le nouveau flow, l'INSERT garages se fait dans otp.tsx juste
        // après la vérification de l'email. Si on arrive ici, l'inscription
        // a été interrompue. On signe out + redirige vers le choix du rôle
        // pour que l'utilisateur recommence le signup proprement.
        await supabase.auth.signOut();
        router.replace('/(auth)/role-choice');
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
