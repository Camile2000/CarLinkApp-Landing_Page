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
import { signUpWithPasswordSchema } from '@carlink/shared/validators';
import { colors, spacing } from '../../src/constants/colors';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignUp = async () => {
    setErrors({});

    try {
      const validatedData = signUpWithPasswordSchema.parse({
        full_name: fullName,
        email,
        password,
        role: 'conductor',
        language: 'fr',
      });

      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: validatedData.email as string,
        password: validatedData.password,
        options: {
          data: {
            full_name: validatedData.full_name,
            role: validatedData.role,
            language: validatedData.language,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ email: 'Cet email est déjà utilisé' });
        } else {
          Alert.alert('Erreur', error.message);
        }
        return;
      }

      router.push({
        pathname: '/(auth)/otp',
        params: { email: email || '', type: 'signup' },
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

  const handleSignIn = () => {
    router.push('/(auth)/signin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>
          Rejoignez CarLink pour vos réparations automobiles
        </Text>

        <Input
          label="Nom complet"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Jean Dupont"
          error={errors.full_name}
        />

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

        <Button
          label="S'inscrire"
          onPress={handleSignUp}
          loading={loading}
          disabled={loading}
          style={styles.button}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ?</Text>
          <TouchableOpacity onPress={handleSignIn}>
            <Text style={styles.signInLink}>Se connecter</Text>
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
  signInLink: {
    color: colors.red,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: spacing[2],
  },
});
