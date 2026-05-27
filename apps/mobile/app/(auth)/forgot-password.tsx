import React, { useState } from 'react';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { emailSchema } from '@carlink/shared/validators';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Caption } from '../../src/components/ui/Typography';
import { fg } from '../../src/constants/theme';
import { useToast } from '../../src/components/ui/ToastProvider';

export default function ForgotPasswordScreen() {
  // Le paramètre `role` est récupéré par la page OTP via useLocalSearchParams
  // après transmission en Phase 4. Pour l'instant, non utilisé ici.
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const setFieldError = (field: string, message: string | null) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message === null) {
        if (!(field in next)) return prev;
        delete next[field];
        return next;
      }
      if (next[field] === message) return prev;
      next[field] = message;
      return next;
    });
  };

  const validateEmail = () => {
    if (!email) return setFieldError('email', null);
    const result = emailSchema.safeParse(email);
    if (result.success) setFieldError('email', null);
    else setFieldError('email', result.error.issues[0]?.message || 'Email invalide');
  };

  const handleReset = async () => {
    setErrors({});

    try {
      const validated = emailSchema.parse(email.trim());
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
          params: { email: validated, type: 'recovery' },
        });
      }, 500);
    } catch (err: unknown) {
      if (err instanceof Error && 'issues' in err && Array.isArray(err.issues)) {
        const issuesArr = err.issues as Array<{ path?: Array<string | number>; message: string }>;
        const firstMsg = issuesArr[0]?.message || 'Email invalide';
        toast.error(firstMsg);
        const next: Record<string, string> = {};
        issuesArr.forEach((e) => {
          if (e.path && e.path.length > 0) next[String(e.path[0])] = e.message;
          else next.email = e.message;
        });
        setErrors(next);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasFieldErrors = Object.keys(errors).length > 0;

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
        onChangeText={(t) => setEmail(t.trim())}
        placeholder="vous@exemple.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
        onBlur={validateEmail}
      />

      <Button
        label="Envoyer le code"
        onPress={handleReset}
        loading={loading}
        disabled={loading || !email.trim() || hasFieldErrors}
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
