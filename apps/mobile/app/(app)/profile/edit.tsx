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
import { supabase } from '../../../src/lib/supabase';
import { ProfileSchema } from '@carlink/shared';
import { useAuth } from '../../../src/context/auth';

const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'San-Pédro', 'Yamoussoukro', 'Korhogo', 'Man', 'Autre'];

export default function ProfileEditScreen() {
  const { session, user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [language, setLanguage] = useState<'fr' | 'en'>(user?.language ?? 'fr');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError('');
    setSuccess(false);
    const result = ProfileSchema.safeParse({ full_name: fullName, city: city || undefined, language });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const uid = session?.user.id;
      if (!uid) throw new Error('Session expirée');

      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: result.data.full_name,
          city: result.data.city ?? null,
          language: result.data.language,
        })
        .eq('id', uid);

      if (dbError) throw dbError;
      await refreshUser();
      setSuccess(true);
      setTimeout(() => router.back(), 1200);
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
        <Text style={styles.label}>Nom complet *</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Kouamé Diallo"
          placeholderTextColor="#4A6585"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Ville</Text>
        <View style={styles.cityGrid}>
          {CITIES.map(c => (
            <Pressable
              key={c}
              style={[styles.cityBtn, city === c && styles.cityBtnActive]}
              onPress={() => setCity(c === city ? '' : c)}
            >
              <Text style={[styles.cityBtnText, city === c && styles.cityBtnTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Langue</Text>
        <View style={styles.langRow}>
          <Pressable
            style={[styles.langBtn, language === 'fr' && styles.langBtnActive]}
            onPress={() => setLanguage('fr')}
          >
            <Text style={[styles.langBtnText, language === 'fr' && styles.langBtnTextActive]}>🇫🇷 Français</Text>
          </Pressable>
          <Pressable
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>🇬🇧 English</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>Profil mis à jour ✓</Text> : null}

        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0B1F3A" />
            : <Text style={styles.btnText}>Enregistrer</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F3A' },
  inner: { padding: 28, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: '600', color: '#9DB2CE', marginBottom: 10 },
  input: {
    backgroundColor: '#162C4A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1E3D5C',
  },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  cityBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E3D5C',
    backgroundColor: '#162C4A',
  },
  cityBtnActive: { borderColor: '#5FD0A0', backgroundColor: '#0E3D2C' },
  cityBtnText: { color: '#9DB2CE', fontSize: 14 },
  cityBtnTextActive: { color: '#5FD0A0', fontWeight: '600' },
  langRow: { flexDirection: 'row', gap: 12, marginBottom: 36 },
  langBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3D5C',
    backgroundColor: '#162C4A',
    alignItems: 'center',
  },
  langBtnActive: { borderColor: '#5FD0A0', backgroundColor: '#0E3D2C' },
  langBtnText: { fontSize: 15, color: '#9DB2CE', fontWeight: '600' },
  langBtnTextActive: { color: '#5FD0A0' },
  error: { color: '#FF6B6B', fontSize: 14, marginBottom: 16 },
  success: { color: '#5FD0A0', fontSize: 14, marginBottom: 16, fontWeight: '600' },
  btn: {
    backgroundColor: '#5FD0A0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#0B1F3A', fontSize: 17, fontWeight: '700' },
});
