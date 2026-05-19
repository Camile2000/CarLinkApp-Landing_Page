import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/auth';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const isGarage = user?.role === 'garage';

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Bonjour, {user?.full_name ?? '…'} 👋</Text>
      <Text style={styles.role}>{isGarage ? '🔧 Garagiste' : '🚗 Conducteur'}</Text>
      {user?.city ? <Text style={styles.city}>{user.city}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {isGarage ? 'Demandes de devis' : 'Trouver un garage'}
        </Text>
        <Text style={styles.cardSubtitle}>
          {isGarage ? 'Aucune demande pour l\'instant' : 'Fonctionnalité disponible en S3'}
        </Text>
      </View>

      <Pressable style={styles.profileBtn} onPress={() => router.push('/(app)/profile/edit')}>
        <Text style={styles.profileBtnText}>Modifier mon profil</Text>
      </Pressable>

      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F3A', padding: 28, paddingTop: 60 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  role: { fontSize: 16, color: '#5FD0A0', fontWeight: '600', marginBottom: 4 },
  city: { fontSize: 14, color: '#9DB2CE', marginBottom: 36 },
  card: {
    backgroundColor: '#162C4A',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E3D5C',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: '#9DB2CE' },
  profileBtn: {
    backgroundColor: '#162C4A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3D5C',
    marginBottom: 12,
  },
  profileBtnText: { color: '#5FD0A0', fontSize: 16, fontWeight: '600' },
  signOutBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { color: '#4A6585', fontSize: 15 },
});
