import React, { useState, useEffect } from 'react';
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
import { useToast } from '../../src/components/ui/ToastProvider';

const MAX_ATTEMPTS = 3;
const COOLDOWN_MS = 15 * 60 * 1000;

export default function SignInConductorScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const toast = useToast();

  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => {
      const remaining = cooldownUntil - Date.now();
      if (remaining <= 0) {
        setCooldownUntil(null);
        setCooldownRemaining(0);
        setFailedAttempts(0);
      } else {
        setCooldownRemaining(Math.ceil(remaining / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const isOnCooldown = cooldownUntil !== null && Date.now() < cooldownUntil;

  const handleSignIn = async () => {
    if (isOnCooldown) {
      toast.error(`Trop de tentatives. Réessayez dans ${Math.ceil(cooldownRemaining / 60)} min`);
      return;
    }

    setErrors({});

    try {
      const data = credentialsSchema.parse({ email, password });
      setLoading(true);

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        const newCount = failedAttempts + 1;
        setFailedAttempts(newCount);

        if (newCount >= MAX_ATTEMPTS) {
          setCooldownUntil(Date.now() + COOLDOWN_MS);
          toast.error('Trop de tentatives. Réessayez dans 15 min');
          return;
        }

        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou mot de passe incorrect');
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          toast.error('Vérifiez votre email avant de vous connecter');
        } else {
          toast.error(error.message);
        }
        return;
      }

      const role = authData?.user?.user_metadata?.role;
      if (role === 'garage') {
        await supabase.auth.signOut();
        toast.error('Ce compte est associé à un espace garagiste. Veuillez utiliser la connexion garagiste.');
        return;
      }

      setFailedAttempts(0);
      setCooldownUntil(null);
      toast.success('Connexion réussie');
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

  const buttonLabel = isOnCooldown
    ? `Réessayez dans ${Math.ceil(cooldownRemaining / 60)} min`
    : 'Se connecter';

  return (
    <AuthLayout
      onBack={() => router.back()}
      heroIcon={Car}
      heroTone="red"
      title="Se connecter"
      lead="Accédez à votre compte conducteur CarLink."
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

      <Pressable onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: { role: 'conductor' } })} hitSlop={8}>
        <BodySm color={accent.base} weight="600" style={{ marginBottom: 16 }}>
          Mot de passe oublié ?
        </BodySm>
      </Pressable>

      <Button
        label={buttonLabel}
        onPress={handleSignIn}
        loading={loading}
        disabled={loading || isOnCooldown}
        fullWidth
        style={authStyles.fullButton}
      />

      <View style={authStyles.altRow}>
        <BodySm color={fg.muted}>Pas encore de compte ?</BodySm>
        <Pressable onPress={() => router.push('/(auth)/signup-conductor')} hitSlop={8}>
          <BodySm color={accent.base} weight="600"> S'inscrire</BodySm>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
