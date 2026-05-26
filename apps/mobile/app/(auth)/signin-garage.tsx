import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Wrench } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { credentialsSchema } from '@carlink/shared/validators';
import { useToast } from '../../src/contexts/ToastContext';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { BodySm } from '../../src/components/ui/Typography';
import { accent, fg } from '../../src/constants/theme';

export default function SignInGarageScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

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
        const msg = error.message.includes('Invalid login credentials')
          ? 'Email ou mot de passe incorrect'
          : error.message;
        toast.error(msg);
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error && 'errors' in err && Array.isArray(err.errors)) {
        const errArray = err.errors as Array<{ path?: string[]; message: string }>;
        const firstMsg = errArray[0]?.message || 'Erreur de validation';
        toast.error(firstMsg, { duration: 5000 });
        const next: Record<string, string> = {};
        errArray.forEach((e) => {
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
      heroIcon={Wrench}
      heroTone="red"
      title="Se connecter"
      lead="Accédez à votre compte garagiste CarLink."
    >
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

      <Pressable onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: { role: 'garage' } })} hitSlop={8}>
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
        <Pressable onPress={() => router.push('/(auth)/signup-garage')} hitSlop={8}>
          <BodySm color={accent.base} weight="600"> S'inscrire</BodySm>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
