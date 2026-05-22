import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@carlink/shared/supabase/client';
import { otpSchema } from '@carlink/shared/validators';
import { colors, spacing } from '../../src/constants/colors';
import { OtpInput } from '../../src/components/ui/OtpInput';
import { Button } from '../../src/components/ui/Button';

type OtpType = 'signup' | 'recovery';

export default function OtpScreen() {
  const { email, type = 'signup' } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  const emailString = Array.isArray(email) ? email[0] : email;
  const otpType = Array.isArray(type) ? type[0] : type;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart}***@${domain}`;
    }
    return `${localPart[0]}${localPart[1]}***@${domain}`;
  };

  const handleVerifyOtp = async () => {
    setError('');

    try {
      otpSchema.parse(otp);

      if (!emailString) {
        Alert.alert('Erreur', 'Email manquant');
        return;
      }

      setLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        email: emailString,
        token: otp,
        type: otpType as OtpType,
      });

      if (error) {
        setError('Code incorrect. Veuillez réessayer.');
        return;
      }

      if (otpType === 'recovery') {
        router.push('/(auth)/new-password');
      } else {
        router.replace('/(tabs)');
      }
    } catch (_error: unknown) {
      setError('Code OTP invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!emailString) {
      Alert.alert('Erreur', 'Email manquant');
      return;
    }

    try {
      setResendLoading(true);

      let result;
      if (otpType === 'recovery') {
        result = await supabase.auth.resetPasswordForEmail(emailString, {
          redirectTo: 'carlink://reset-password',
        });
      } else {
        result = await supabase.auth.resetPasswordForEmail(emailString, {
          redirectTo: 'carlink://verify-email',
        });
      }

      if (result.error) {
        Alert.alert('Erreur', 'Impossible d\'envoyer le code');
        return;
      }

      setResendCooldown(60);
      Alert.alert('Succès', 'Un nouveau code a été envoyé');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {otpType === 'recovery'
            ? 'Réinitialiser votre mot de passe'
            : 'Vérifier votre email'}
        </Text>

        <Text style={styles.subtitle}>
          Nous avons envoyé un code à 6 chiffres à
        </Text>
        <Text style={styles.email}>{maskEmail(emailString)}</Text>

        <OtpInput
          value={otp}
          onChangeText={setOtp}
          length={6}
          style={styles.otpInput}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          label="Vérifier"
          onPress={handleVerifyOtp}
          loading={loading}
          disabled={loading || otp.length < 6}
          style={styles.button}
        />

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Vous n'avez pas reçu le code ?</Text>
          <TouchableOpacity
            onPress={handleResendOtp}
            disabled={resendCooldown > 0 || resendLoading}
          >
            <Text
              style={[
                styles.resendButton,
                (resendCooldown > 0 || resendLoading) && styles.resendButtonDisabled,
              ]}
            >
              {resendCooldown > 0
                ? `Renvoyer (${resendCooldown}s)`
                : 'Renvoyer le code'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[6],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing[1],
  },
  email: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
    marginBottom: spacing[6],
  },
  otpInput: {
    marginVertical: spacing[4],
  },
  error: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  button: {
    marginTop: spacing[2],
  },
  resendContainer: {
    marginTop: spacing[6],
    alignItems: 'center',
  },
  resendText: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing[2],
  },
  resendButton: {
    color: colors.red,
    fontWeight: '600',
    fontSize: 14,
  },
  resendButtonDisabled: {
    color: colors.muted,
  },
});
