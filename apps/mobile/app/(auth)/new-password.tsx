import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { newPasswordSchema } from '@carlink/shared/validators';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Caption } from '../../src/components/ui/Typography';
import { fg } from '../../src/constants/theme';

export default function NewPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleUpdate = async () => {
    setErrors({});

    try {
      const data = newPasswordSchema.parse({ password, confirm });
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      Alert.alert(
        'Mot de passe mis à jour',
        'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
        [{ text: 'Se connecter', onPress: () => router.push('/(auth)/signin') }]
      );
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
      heroIcon={ShieldCheck}
      heroTone="success"
      title="Nouveau mot de passe"
      lead="Choisissez un mot de passe solide. Vous ne pourrez plus utiliser l'ancien."
    >
      <Input
        label="Nouveau mot de passe"
        value={password}
        onChangeText={setPassword}
        placeholder="8 caractères minimum"
        secureTextEntry
        error={errors.password}
      />

      <Input
        label="Confirmer le mot de passe"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="••••••••"
        secureTextEntry
        error={errors.confirm ?? errors.form}
      />

      <Caption color={fg.muted} style={{ marginBottom: 16, lineHeight: 18 }}>
        8 caractères minimum, dont une majuscule et un chiffre.
      </Caption>

      <Button
        label="Réinitialiser"
        onPress={handleUpdate}
        loading={loading}
        disabled={loading || !password || !confirm}
        fullWidth
        style={authStyles.fullButton}
      />
    </AuthLayout>
  );
}
