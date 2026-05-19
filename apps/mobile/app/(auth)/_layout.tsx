import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0B1F3A' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Connexion', headerShown: false }} />
      <Stack.Screen name="verify" options={{ title: 'Vérification' }} />
      <Stack.Screen name="setup-profile" options={{ title: 'Mon profil' }} />
      <Stack.Screen name="setup-garage" options={{ title: 'Mon garage' }} />
    </Stack>
  );
}
