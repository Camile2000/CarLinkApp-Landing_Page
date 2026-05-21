import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@carlink/shared/supabase/client';
import { emailSchema } from '@carlink/shared/validators';
import { colors, spacing } from '../../src/constants/colors';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleResetPassword = async () => {
    setErrors({});

    try {
      const validatedEmail = emailSchema.parse(email);

      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        validatedEmail,
        {
          redirectTo: 'carlink://reset-password',
        }
      );

      if (error) {
        Alert.alert('Erreur', error.message);
        return;
      }

      // @ts-expect-error Expo Router doesn't recognize dynamic route groups
      router.push({
        pathname: '/(auth)/otp' as const,
        params: { email, type: 'recovery' },
      });
    } catch (error: unknown) {
      if (error instanceof Error && 'errors' in error && Array.isArray(error.errors)) {
        const newErrors: Record<string, string> = {};
        (error.errors as Array<{ path?: string[]; message: string }>).forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Réinitialiser votre mot de passe</Text>
        <Text style={styles.subtitle}>
          Entrez votre email et nous vous enverrons un code pour réinitialiser votre mot de passe.
        </Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="jean@example.com"
          keyboardType="email-address"
          error={errors.email}
        />

        <Button
          label="Envoyer un code"
          onPress={handleResetPassword}
          loading={loading}
          disabled={loading}
          style={styles.button}
        />

        <Text style={styles.info}>
          Vous recevrez un email avec un code à 6 chiffres pour réinitialiser votre mot de passe.
        </Text>
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
  backButton: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing[4],
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
    marginBottom: spacing[6],
    lineHeight: 20,
  },
  button: {
    marginTop: spacing[2],
  },
  info: {
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing[4],
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
