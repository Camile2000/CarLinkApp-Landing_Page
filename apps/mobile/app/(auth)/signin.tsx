import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@carlink/shared/supabase/client';
import { credentialsSchema } from '@carlink/shared/validators';
import { colors, spacing } from '../../src/constants/colors';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignIn = async () => {
    setErrors({});

    try {
      const validatedData = credentialsSchema.parse({
        email,
        password,
      });

      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({
            form: 'Email ou mot de passe incorrect',
          });
        } else {
          Alert.alert('Erreur', error.message);
        }
        return;
      }
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

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Se connecter</Text>
        <Text style={styles.subtitle}>
          Accédez à votre compte CarLink
        </Text>

        {errors.form && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errors.form}</Text>
          </View>
        )}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="jean@example.com"
          keyboardType="email-address"
          error={errors.email}
        />

        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <Button
          label="Se connecter"
          onPress={handleSignIn}
          loading={loading}
          disabled={loading}
          style={styles.button}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>S'inscrire</Text>
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
    marginBottom: spacing[6],
  },
  errorBanner: {
    backgroundColor: colors.error,
    padding: spacing[3],
    borderRadius: 8,
    marginBottom: spacing[4],
  },
  errorBannerText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotLink: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing[4],
  },
  button: {
    marginTop: spacing[2],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[6],
  },
  footerText: {
    color: colors.muted,
    fontSize: 14,
  },
  signUpLink: {
    color: colors.red,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: spacing[2],
  },
});
