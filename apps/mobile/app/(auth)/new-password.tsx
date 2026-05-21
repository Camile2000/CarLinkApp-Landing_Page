import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@carlink/shared/supabase/client';
import { newPasswordSchema } from '@carlink/shared/validators';
import { colors, spacing } from '../../src/constants/colors';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function NewPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleUpdatePassword = async () => {
    setErrors({});

    try {
      const validatedData = newPasswordSchema.parse({
        password,
        confirm,
      });

      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: validatedData.password,
      });

      if (error) {
        Alert.alert('Erreur', error.message);
        return;
      }

      Alert.alert(
        'Succès',
        'Votre mot de passe a été réinitialisé. Veuillez vous reconnecter.',
        [
          {
            text: 'OK',
            // @ts-expect-error Expo Router doesn't recognize dynamic route groups
            onPress: () => router.push('/(auth)/signin' as const),
          },
        ]
      );
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Nouveau mot de passe</Text>
        <Text style={styles.subtitle}>
          Créez un nouveau mot de passe pour votre compte CarLink
        </Text>

        <Input
          label="Nouveau mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          error={errors.password}
        />

        <Input
          label="Confirmer le mot de passe"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="••••••••"
          secureTextEntry
          error={errors.confirm}
        />

        <Text style={styles.requirements}>
          Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.
        </Text>

        <Button
          label="Réinitialiser le mot de passe"
          onPress={handleUpdatePassword}
          loading={loading}
          disabled={loading}
          style={styles.button}
        />
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
    marginBottom: spacing[6],
  },
  requirements: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing[4],
    lineHeight: 18,
    fontStyle: 'italic',
  },
  button: {
    marginTop: spacing[2],
  },
});
