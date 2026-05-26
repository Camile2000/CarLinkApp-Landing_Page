import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Car } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { credentialsSchema } from '@carlink/shared/validators';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { BodySm } from '../../src/components/ui/Typography';
import { accent, fg } from '../../src/constants/theme';

export default function SignInConductorScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignIn = async () => {
    setErrors({});

    try {
      const data = credentialsSchema.parse({ email, password });
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ form: 'Email ou mot de passe incorrect' });
        } else {
          setErrors({ form: error.message });
        }
        return;
      }
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
      heroIcon={Car}
      heroTone="red"
      title="Se connecter"
      lead="Accédez à votre compte conducteur CarLink."
    >
      {errors.form ? (
        <View style={authStyles.errorBanner}>
          <BodySm color="#fff" weight="500">{errors.form}</BodySm>
        </View>
      ) : null}

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
        placeholder="••••••••"
        secureTextEntry
        error={errors.password}
      />

      <Pressable onPress={() => router.replace({ pathname: '/(auth)/forgot-password', params: { role: 'conductor' } })} hitSlop={8}>
        <BodySm color={accent.base} weight="600" style={{ marginBottom: 16 }}>
          Mot de passe oublié ?
        </BodySm>
      </Pressable>

      <Button
        label="Se connecter"
        onPress={handleSignIn}
        loading={loading}
        disabled={loading}
        fullWidth
        style={authStyles.fullButton}
      />

      <View style={authStyles.altRow}>
        <BodySm color={fg.muted}>Pas encore de compte ?</BodySm>
        <Pressable onPress={() => router.replace('/(auth)/signup-conductor')} hitSlop={8}>
          <BodySm color={accent.base} weight="600"> S'inscrire</BodySm>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
