import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Car } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { conductorSignUpSchema } from '@carlink/shared/validators';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { BodySm } from '../../src/components/ui/Typography';
import { accent, fg } from '../../src/constants/theme';

export default function SignUpConductorScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignUp = async () => {
    setErrors({});

    try {
      const data = conductorSignUpSchema.parse({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        password,
        password_confirm: passwordConfirm,
        language: 'fr',
      });

      setLoading(true);

      const fullName = `${data.first_name} ${data.last_name}`;
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: fullName,
            role: 'conductor',
            language: data.language,
            phone: data.phone,
            city: data.city,
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
        params: { email: data.email, type: 'signup', role: 'conductor' },
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
      heroIcon={Car}
      heroTone="red"
      eyebrow="COMPTE CONDUCTEUR"
      title="Créer mon compte"
      lead="Quelques informations pour vous proposer les meilleurs garages."
    >
      {errors.form ? (
        <View style={authStyles.errorBanner}>
          <BodySm color="#fff" weight="500">{errors.form}</BodySm>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Input
          label="Prénom"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Marie"
          autoComplete="given-name"
          error={errors.first_name}
          style={{ flex: 1 }}
        />
        <Input
          label="Nom"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Tchapnga"
          autoComplete="family-name"
          error={errors.last_name}
          style={{ flex: 1 }}
        />
      </View>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="marie@carlink.cm"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />

      <Input
        label="Téléphone"
        value={phone}
        onChangeText={setPhone}
        placeholder="+237 6 78 12 45 09"
        keyboardType="phone-pad"
        autoComplete="tel"
        error={errors.phone}
      />

      <Input
        label="Ville"
        value={city}
        onChangeText={setCity}
        placeholder="Douala"
        autoCapitalize="words"
        error={errors.city}
      />

      <Input
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        helper="8 caractères minimum, dont 1 majuscule et 1 chiffre."
        error={errors.password}
      />

      <Input
        label="Confirmer le mot de passe"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        placeholder="••••••••"
        secureTextEntry
        error={errors.password_confirm}
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
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <BodySm color={accent.base} weight="600"> Se connecter</BodySm>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
