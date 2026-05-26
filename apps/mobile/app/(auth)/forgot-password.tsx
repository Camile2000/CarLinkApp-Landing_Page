import React, { useState } from 'react';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { emailSchema } from '@carlink/shared/validators';
import { useToast } from '../../src/contexts/ToastContext';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Caption } from '../../src/components/ui/Typography';
import { fg } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  // Le paramètre `role` est récupéré par la page OTP via useLocalSearchParams
  // après transmission en Phase 4. Pour l'instant, non utilisé ici.
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const handleReset = async () => {
    setErrors({});

    try {
      const validated = emailSchema.parse(email);
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(validated, {
        redirectTo: 'carlink://reset-password',
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Un code a été envoyé à votre email.');
      setTimeout(() => {
        router.push({
          pathname: '/(auth)/otp',
          params: { email, type: 'recovery' },
        });
      }, 500);
    } catch (err: unknown) {
      if (err instanceof Error && 'errors' in err && Array.isArray(err.errors)) {
        const errArray = err.errors as Array<{ path?: string[]; message: string }>;
        const firstMsg = errArray[0]?.message || 'Erreur de validation';
        toast.error(firstMsg, 5000);
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
      heroIcon={Mail}
      heroTone="red"
      title="Mot de passe oublié ?"
      lead="Entrez votre email. Vous recevrez un code à 6 chiffres pour le réinitialiser."
    >
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="vous@exemple.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email ?? errors.form}
      />

      <Button
        label="Envoyer le code"
        onPress={handleReset}
        loading={loading}
        disabled={loading || !email.trim()}
        fullWidth
        style={authStyles.fullButton}
      />

      <Caption
        color={fg.muted}
        align="center"
        style={{ marginTop: 20, lineHeight: 18 }}
      >
        Si votre email est enregistré, vous recevrez un code de vérification dans quelques secondes.
      </Caption>
    </AuthLayout>
  );
}
