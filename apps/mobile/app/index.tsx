import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/context/auth';

export default function Root() {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1F3A' }}>
        <ActivityIndicator color="#5FD0A0" size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  // Profil incomplet → compléter d'abord
  if (!user?.full_name) return <Redirect href="/(auth)/setup-profile" />;

  // Garagiste sans profil garage → compléter
  if (user.role === 'garage') return <Redirect href="/(auth)/setup-garage" />;

  return <Redirect href="/(app)" />;
}
