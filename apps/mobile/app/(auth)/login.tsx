import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { LoginSchema } from '@carlink/shared';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'conductor' | 'garage'>('conductor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    setError('');
    const result = LoginSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: result.data.email,
        options: {
          data: { role },
          emailRedirectTo: 'carlink://',
        },
      });
      if (authError) throw authError;
      router.push({ pathname: '/(auth)/verify', params: { email: result.data.email } });
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>CarLink</Text>
        <Text style={styles.tagline}>Conducteurs ⇄ Garages</Text>

        <Text style={styles.label}>Adresse email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          placeholder="nom@exemple.com"
          placeholderTextColor="#4A6585"
          returnKeyType="done"
        />

        <Text style={styles.label}>Je suis…</Text>
        <View style={styles.roleRow}>
          <Pressable
            style={[styles.roleBtn, role === 'conductor' && styles.roleBtnActive]}
            onPress={() => setRole('conductor')}
          >
            <Text style={[styles.roleBtnText, role === 'conductor' && styles.roleBtnTextActive]}>
              🚗 Conducteur
            </Text>
          </Pressable>
          <Pressable
            style={[styles.roleBtn, role === 'garage' && styles.roleBtnActive]}
            onPress={() => setRole('garage')}
          >
            <Text style={[styles.roleBtnText, role === 'garage' && styles.roleBtnTextActive]}>
              🔧 Garagiste
            </Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0B1F3A" />
            : <Text style={styles.btnText}>Recevoir le code</Text>}
        </Pressable>

        <Text style={styles.disclaimer}>
          En continuant, vous acceptez les conditions d'utilisation de CarLink.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F3A' },
  inner: { flex: 1, padding: 28, justifyContent: 'center' },
  logo: { fontSize: 44, fontWeight: '800', color: '#fff', textAlign: 'center' },
  tagline: { fontSize: 14, color: '#9DB2CE', textAlign: 'center', marginTop: 4, marginBottom: 44 },
  label: { fontSize: 14, fontWeight: '600', color: '#9DB2CE', marginBottom: 8 },
  input: {
    backgroundColor: '#162C4A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#fff',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E3D5C',
  },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  roleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E3D5C',
    backgroundColor: '#162C4A',
    alignItems: 'center',
  },
  roleBtnActive: { borderColor: '#5FD0A0', backgroundColor: '#0E3D2C' },
  roleBtnText: { fontSize: 15, color: '#9DB2CE', fontWeight: '600' },
  roleBtnTextActive: { color: '#5FD0A0' },
  error: { color: '#FF6B6B', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  btn: {
    backgroundColor: '#5FD0A0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#0B1F3A', fontSize: 17, fontWeight: '700' },
  disclaimer: { color: '#4A6585', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
