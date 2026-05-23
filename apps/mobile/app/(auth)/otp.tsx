import React, { useState, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { otpSchema } from '@carlink/shared/validators';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { OtpInput } from '../../src/components/ui/OtpInput';
import { Button } from '../../src/components/ui/Button';
import { BodySm, Caption } from '../../src/components/ui/Typography';
import { accent, fg, semantic } from '../../src/constants/theme';

type OtpType = 'signup' | 'recovery';

export default function OtpScreen() {
  const { email, type = 'signup', role } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');

  const emailStr = Array.isArray(email) ? email[0] : (email ?? '');
  const otpType = Array.isArray(type) ? type[0] : type;
  const roleStr = Array.isArray(role) ? role[0] : role;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const maskEmail = (e: string) => {
    const [local, domain] = e.split('@');
    if (!domain) return e;
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  };

  const handleVerify = async () => {
    setError('');
    try {
      otpSchema.parse(otp);
      if (!emailStr) return;
      setLoading(true);

      const { error: err } = await supabase.auth.verifyOtp({
        email: emailStr,
        token: otp,
        type: otpType as OtpType,
      });

      if (err) {
        setError('Code incorrect. Veuillez réessayer.');
        return;
      }

      if (otpType === 'recovery') {
        router.push('/(auth)/new-password');
      } else if (roleStr === 'garage') {
        router.replace('/(auth)/garage-setup');
      } else {
        router.replace('/(driver)');
      }
    } catch {
      setError('Code OTP invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailStr) return;
    try {
      setResendLoading(true);

      const result = otpType === 'recovery'
        ? await supabase.auth.resetPasswordForEmail(emailStr, {
            redirectTo: 'carlink://reset-password',
          })
        : await supabase.auth.resend({ email: emailStr, type: 'signup' });

      if (result.error) {
        setError('Impossible d\'envoyer le code. Réessayez.');
        return;
      }

      setCooldown(60);
    } catch {
      setError('Impossible d\'envoyer le code. Réessayez.');
    } finally {
      setResendLoading(false);
    }
  };

  const isRecovery = otpType === 'recovery';

  return (
    <AuthLayout
      onBack={() => router.back()}
      heroIcon={MailCheck}
      heroTone="red"
      title={isRecovery ? 'Réinitialisez votre mot de passe' : 'Vérifiez votre email'}
      lead={`Nous avons envoyé un code à 6 chiffres à ${maskEmail(emailStr)}`}
    >
      <OtpInput
        value={otp}
        onChangeText={setOtp}
        length={6}
        hasError={!!error}
      />

      {error ? (
        <BodySm
          color={semantic.danger}
          weight="500"
          align="center"
          style={{ marginBottom: 16 }}
        >
          {error}
        </BodySm>
      ) : null}

      <Caption color={fg.muted} align="center" style={{ marginBottom: 16 }}>
        Le code expire dans 15 minutes.
      </Caption>

      <Button
        label="Vérifier"
        onPress={handleVerify}
        loading={loading}
        disabled={loading || otp.length < 6}
        fullWidth
        style={authStyles.fullButton}
      />

      <View style={[authStyles.altRow, { flexDirection: 'column', gap: 4 }]}>
        <BodySm color={fg.muted} align="center">
          Vous n'avez pas reçu le code ?
        </BodySm>
        <Pressable
          onPress={handleResend}
          disabled={cooldown > 0 || resendLoading}
          hitSlop={8}
        >
          <BodySm
            color={cooldown > 0 ? fg.muted : accent.base}
            weight="600"
            align="center"
          >
            {cooldown > 0
              ? `Renvoyer dans ${cooldown}s`
              : 'Renvoyer le code'}
          </BodySm>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
