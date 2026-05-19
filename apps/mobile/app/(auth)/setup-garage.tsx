import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { GarageSetupSchema } from '@carlink/shared';
import { useAuth } from '../../src/context/auth';

const ALL_SPECIALTIES = [
  'Mécanique générale',
  'Électronique auto',
  'Climatisation',
  'Carrosserie',
  'Pneumatiques',
  'Vidange / entretien',
  'Diagnostic',
  'Transmission',
];

export default function SetupGarageScreen() {
  const { session, refreshUser } = useAuth();
  const [garageName, setGarageName] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleSpecialty(s: string) {
    setSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  async function handleSave() {
    setError('');
    const result = GarageSetupSchema.safeParse({
      garage_name: garageName,
      city,
      neighborhood: neighborhood || undefined,
      phone: phone || undefined,
      specialties,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const uid = session?.user.id;
      if (!uid) throw new Error('Session expirée');

      // Vérifier si un garage existe déjà pour cet utilisateur
      const { data: existing } = await supabase
        .from('garages')
        .select('id')
        .eq('user_id', uid)
        .maybeSingle();

      if (existing) {
        const { error: dbError } = await supabase
          .from('garages')
          .update({
            garage_name: result.data.garage_name,
            city: result.data.city,
            neighborhood: result.data.neighborhood ?? null,
            phone: result.data.phone ?? null,
            specialties: result.data.specialties,
          })
          .eq('id', existing.id);
        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabase
          .from('garages')
          .insert({
            user_id: uid,
            garage_name: result.data.garage_name,
            city: result.data.city,
            neighborhood: result.data.neighborhood ?? null,
            phone: result.data.phone ?? null,
            specialties: result.data.specialties,
          });
        if (dbError) throw dbError;
      }

      await refreshUser();
      router.replace('/(app)');
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Mon garage</Text>
        <Text style={styles.subtitle}>Informations affichées aux conducteurs</Text>

        <Text style={styles.label}>Nom du garage *</Text>
        <TextInput
          style={styles.input}
          value={garageName}
          onChangeText={setGarageName}
          placeholder="Garage Kouamé & Frères"
          placeholderTextColor="#4A6585"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Ville *</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="Abidjan"
          placeholderTextColor="#4A6585"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Quartier</Text>
        <TextInput
          style={styles.input}
          value={neighborhood}
          onChangeText={setNeighborhood}
          placeholder="Yopougon, Cocody…"
          placeholderTextColor="#4A6585"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Téléphone du garage</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+22507XXXXXXXX"
          placeholderTextColor="#4A6585"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Spécialités</Text>
        <View style={styles.specialtyGrid}>
          {ALL_SPECIALTIES.map(s => (
            <Pressable
              key={s}
              style={[styles.specialtyBtn, specialties.includes(s) && styles.specialtyBtnActive]}
              onPress={() => toggleSpecialty(s)}
            >
              <Text style={[styles.specialtyText, specialties.includes(s) && styles.specialtyTextActive]}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0B1F3A" />
            : <Text style={styles.btnText}>Créer mon garage →</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F3A' },
  inner: { padding: 28, paddingTop: 48, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#9DB2CE', marginBottom: 36 },
  label: { fontSize: 14, fontWeight: '600', color: '#9DB2CE', marginBottom: 10 },
  input: {
    backgroundColor: '#162C4A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E3D5C',
  },
  specialtyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 36 },
  specialtyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E3D5C',
    backgroundColor: '#162C4A',
  },
  specialtyBtnActive: { borderColor: '#5FD0A0', backgroundColor: '#0E3D2C' },
  specialtyText: { color: '#9DB2CE', fontSize: 13 },
  specialtyTextActive: { color: '#5FD0A0', fontWeight: '600' },
  error: { color: '#FF6B6B', fontSize: 14, marginBottom: 16 },
  btn: {
    backgroundColor: '#5FD0A0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#0B1F3A', fontSize: 17, fontWeight: '700' },
});
