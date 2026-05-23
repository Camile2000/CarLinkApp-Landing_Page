import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { signUpWithPasswordSchema } from '@carlink/shared/validators';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { BodySm } from '../../src/components/ui/Typography';
import { accent, fg } from '../../src/constants/theme';

export default function SignUpScreen() {
  const { selectedRole } = useLocalSearchParams<{ selectedRole: string }>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignUp = async () => {
    setErrors({});

    if (!selectedRole) {
      setErrors({ form: 'Veuillez sélectionner un rôle' });
      return;
    }

    try {
      const data = signUpWithPasswordSchema.parse({
        full_name: fullName,
        email,
        password,
        role: selectedRole,
        language: 'fr',
      });

      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: data.email as string,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: data.role,
            language: data.language,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ email: 'Cet email est déjà utilisé' });
        } else {
          setErrors({ form: error.message });
        }
        return;
      }

      router.push({
        pathname: '/(auth)/otp',
        params: { email, type: 'signup' },
      });
    } catch (err: unknown) {
      if (err instanceof Error && 'errors' in err && Array.isArray(err.errors)) {
        const next: Record<string, string> = {};
        (err.errors as Array<{ path?: string[]; message: string }>).forEach((e) => {
          if (e.path) next[e.path[0]] = e.message;
        });
        setErrors(next);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      onBack={() => router.back()}
      heroIcon={UserPlus}
      heroTone="red"
      title="Créer votre compte"
      lead="Rejoignez CarLink — c'est gratuit et prend moins d'une minute."
    >
      {errors.form ? (
        <View style={authStyles.errorBanner}>
          <BodySm color="#fff" weight="500">{errors.form}</BodySm>
        </View>
      ) : null}

      <Input
        label="Nom complet"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Jean Dupont"
        autoComplete="name"
        error={errors.full_name}
      />

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="vous@exemple.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />

      <Input
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        placeholder="8 caractères minimum"
        secureTextEntry
        error={errors.password}
      />

      <Button
        label="Créer mon compte"
        onPress={handleSignUp}
        loading={loading}
        disabled={loading}
        fullWidth
        style={authStyles.fullButton}
      />

      <View style={authStyles.altRow}>
        <BodySm color={fg.muted}>Déjà un compte ?</BodySm>
        <Pressable onPress={() => router.push('/(auth)/signin')} hitSlop={8}>
          <BodySm color={accent.base} weight="600"> Se connecter</BodySm>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
