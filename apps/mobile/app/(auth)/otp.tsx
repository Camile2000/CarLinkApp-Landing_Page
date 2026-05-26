import React, { useState, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { otpSchema } from '@carlink/shared/validators';
import { useToast } from '../../src/contexts/ToastContext';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { OtpInput } from '../../src/components/ui/OtpInput';
import { Button } from '../../src/components/ui/Button';
import { BodySm, Caption } from '../../src/components/ui/Typography';
import { accent, fg, semantic } from '../../src/constants/theme';

type OtpType = 'signup' | 'recovery';

export default function OtpScreen() {
  const params = useLocalSearchParams();
  const { email, type = 'signup', role } = params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const toast = useToast();

  const emailStr = Array.isArray(email) ? email[0] : (email ?? '');
  const otpType = Array.isArray(type) ? type[0] : type;
  const roleStr = Array.isArray(role) ? role[0] : role;

  const pickStr = (key: string): string => {
    const v = params[key];
    if (Array.isArray(v)) return v[0] ?? '';
    return v ?? '';
  };

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
        toast.warning('Code OTP invalide. Vérifiez et réessayez.');
        setError('Code incorrect. Veuillez réessayer.');
        return;
      }

      if (otpType === 'recovery') {
        router.push('/(auth)/new-password');
        return;
      }

      if (roleStr === 'garage') {
        // L'utilisateur garage a saisi toutes ses infos au signup-garage.
        // Après vérification OTP, on insère la ligne garages liée à son user_id.
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (!userId) {
          toast.error('Votre session a expiré. Recommencez l\'inscription.');
          setError('Session invalide après vérification. Veuillez vous reconnecter.');
          return;
        }

        let parsedSpecialties: string[] = [];
        try {
          parsedSpecialties = JSON.parse(pickStr('specialties') || '[]');
        } catch {
          parsedSpecialties = [];
        }

        const neighborhoodValue = pickStr('neighborhood').trim() || null;
        const addressValue = pickStr('address').trim() || null;

        const { error: insertError } = await supabase.from('garages').insert({
          user_id: userId,
          garage_name: pickStr('garage_name'),
          city: pickStr('city'),
          neighborhood: neighborhoodValue,
          address: addressValue,
          phone: pickStr('phone'),
          specialties: parsedSpecialties,
        });

        if (insertError) {
          const insertMsg = insertError.code === '23505'
            ? 'Un garage existe déjà pour ce compte.'
            : "Impossible d'enregistrer le garage. Réessayez.";
          toast.error(insertMsg);
          setError(insertMsg);
          return;
        }

        router.replace('/(garage)');
        return;
      }

      router.replace('/(driver)');
    } catch {
      toast.error('Format OTP invalide');
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
        toast.error('Impossible d\'envoyer le code. Réessayez.');
        setError('Impossible d\'envoyer le code. Réessayez.');
        return;
      }

      toast.success('Code renvoyé. Vérifiez votre email.');
      setCooldown(60);
    } catch {
      toast.error('Impossible d\'envoyer le code. Réessayez.');
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
