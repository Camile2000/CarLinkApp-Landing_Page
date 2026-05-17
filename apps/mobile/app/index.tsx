import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../src/lib/supabase';

export default function Home() {
  const [status, setStatus] = useState('Connexion à Supabase…');

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(() => setStatus('Connecté à Supabase ✓'))
      .catch((e: unknown) =>
        setStatus(`Erreur Supabase : ${(e as Error).message}`)
      );
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CarLink</Text>
      <Text style={styles.subtitle}>
        Conducteurs ⇄ Garages
      </Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1F3A',
    padding: 24,
  },
  title: { fontSize: 40, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 16, color: '#9DB2CE', marginTop: 8 },
  status: { fontSize: 14, color: '#5FD0A0', marginTop: 32 },
});
