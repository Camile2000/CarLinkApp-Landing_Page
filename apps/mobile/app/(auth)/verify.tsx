import { useEffect, useRef, useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { OtpSchema } from '@carlink/shared';

const OTP_LENGTH = 6;
const RESEND_DELAY = 60;

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_DELAY);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleVerify(token: string) {
    if (token.length < OTP_LENGTH) return;
    setError('');

    const result = OtpSchema.safeParse({ phone, token });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        phone: result.data.phone,
        token: result.data.token,
        type: 'sms',
      });
      if (authError) throw authError;
      // AuthContext détectera la session → index.tsx redirigera
      router.replace('/');
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Code invalide ou expiré');
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setError('');
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: 'sms' },
    });
    if (authError) setError(authError.message);
    else setCountdown(RESEND_DELAY);
  }

  function handleChangeCode(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(digits);
    if (digits.length === OTP_LENGTH) handleVerify(digits);
  }

  const maskedPhone = phone ? `${phone.slice(0, 5)}****${phone.slice(-3)}` : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Code de vérification</Text>
        <Text style={styles.subtitle}>
          Entrez le code à 6 chiffres reçu par SMS au {maskedPhone}
        </Text>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleChangeCode}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
        />

        <Pressable style={styles.codeRow} onPress={() => inputRef.current?.focus()}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.codeCell,
                i === code.length && styles.codeCellActive,
                code[i] ? styles.codeCellFilled : undefined,
              ]}
            >
              <Text style={styles.codeCellText}>{code[i] ?? ''}</Text>
            </View>
          ))}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading && <ActivityIndicator color="#5FD0A0" style={{ marginTop: 16 }} />}

        <Pressable onPress={handleResend} disabled={countdown > 0}>
          <Text style={[styles.resend, countdown > 0 && styles.resendDisabled]}>
            {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F3A' },
  inner: { flex: 1, padding: 28, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, color: '#9DB2CE', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  codeRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  codeCell: {
    width: 48,
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1E3D5C',
    backgroundColor: '#162C4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCellActive: { borderColor: '#5FD0A0' },
  codeCellFilled: { borderColor: '#5FD0A0', backgroundColor: '#0E3D2C' },
  codeCellText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  error: { color: '#FF6B6B', fontSize: 14, marginBottom: 16 },
  resend: { color: '#5FD0A0', fontSize: 15, fontWeight: '600', marginTop: 8 },
  resendDisabled: { color: '#4A6585' },
});
