import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Car } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import {
  conductorSignUpSchema,
  emailSchema,
  passwordSchema,
  phoneSchema,
} from '@carlink/shared/validators';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { BodySm } from '../../src/components/ui/Typography';
import { accent, fg } from '../../src/constants/theme';
import { useToast } from '../../src/components/ui/ToastProvider';

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
  const toast = useToast();

  const setFieldError = (field: string, message: string | null) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message === null) delete next[field];
      else next[field] = message;
      return next;
    });
  };

  const validateFirstName = () => {
    const v = firstName.trim();
    if (!v) return setFieldError('first_name', 'Prénom requis');
    if (v.length > 50) return setFieldError('first_name', '50 caractères maximum');
    setFieldError('first_name', null);
  };

  const validateLastName = () => {
    const v = lastName.trim();
    if (!v) return setFieldError('last_name', 'Nom requis');
    if (v.length > 50) return setFieldError('last_name', '50 caractères maximum');
    setFieldError('last_name', null);
  };

  const validateEmail = () => {
    if (!email) return setFieldError('email', null);
    const result = emailSchema.safeParse(email);
    if (result.success) setFieldError('email', null);
    else setFieldError('email', result.error.issues[0]?.message || 'Email invalide');
  };

  const validatePhone = () => {
    if (!phone) return setFieldError('phone', null);
    const result = phoneSchema.safeParse(phone);
    if (result.success) setFieldError('phone', null);
    else setFieldError('phone', result.error.issues[0]?.message || 'Téléphone invalide');
  };

  const validateCity = () => {
    const v = city.trim();
    if (!v) return setFieldError('city', null);
    if (v.length < 2) return setFieldError('city', 'Ville requise');
    if (v.length > 100) return setFieldError('city', '100 caractères maximum');
    setFieldError('city', null);
  };

  const validatePassword = () => {
    if (!password) return setFieldError('password', null);
    const result = passwordSchema.safeParse(password);
    if (result.success) setFieldError('password', null);
    else setFieldError('password', result.error.issues[0]?.message || 'Mot de passe invalide');
  };

  const validatePasswordConfirm = () => {
    if (!passwordConfirm) return setFieldError('password_confirm', null);
    if (passwordConfirm !== password) {
      return setFieldError('password_confirm', 'Les mots de passe ne correspondent pas');
    }
    setFieldError('password_confirm', null);
  };

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
        if (error.message.toLowerCase().includes('already registered')) {
          toast.error('Cet email est déjà utilisé');
          setFieldError('email', 'Cet email est déjà utilisé');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Inscription réussie. Vérifiez votre email.');
      setTimeout(() => {
        router.push({
          pathname: '/(auth)/otp',
          params: { email: data.email, type: 'signup', role: 'conductor' },
        });
      }, 500);
    } catch (err: unknown) {
      if (err instanceof Error && 'issues' in err && Array.isArray(err.issues)) {
        const issuesArr = err.issues as Array<{ path?: Array<string | number>; message: string }>;
        const firstMsg = issuesArr[0]?.message || 'Erreur de validation';
        toast.error(firstMsg);
        const next: Record<string, string> = {};
        issuesArr.forEach((e) => {
          if (e.path && e.path.length > 0) next[String(e.path[0])] = e.message;
        });
        setErrors(next);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasFieldErrors = Object.keys(errors).length > 0;
  const allFieldsFilled =
    !!firstName.trim() &&
    !!lastName.trim() &&
    !!email.trim() &&
    !!phone.trim() &&
    !!city.trim() &&
    !!password &&
    !!passwordConfirm;

  return (
    <AuthLayout
      onBack={() => router.back()}
      heroIcon={Car}
      heroTone="red"
      eyebrow="COMPTE CONDUCTEUR"
      title="Créer mon compte"
      lead="Quelques informations pour vous proposer les meilleurs garages."
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Input
          label="Prénom"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Marie"
          autoComplete="given-name"
          error={errors.first_name}
          onBlur={validateFirstName}
          style={{ flex: 1 }}
        />
        <Input
          label="Nom"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Tchapnga"
          autoComplete="family-name"
          error={errors.last_name}
          onBlur={validateLastName}
          style={{ flex: 1 }}
        />
      </View>

      <Input
        label="Email"
        value={email}
        onChangeText={(text) => setEmail(text.trim())}
        placeholder="marie@carlink.cm"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
        onBlur={validateEmail}
      />

      <Input
        label="Téléphone"
        value={phone}
        onChangeText={setPhone}
        placeholder="+237 6 78 12 45 09"
        keyboardType="phone-pad"
        autoComplete="tel"
        error={errors.phone}
        onBlur={validatePhone}
      />

      <Input
        label="Ville"
        value={city}
        onChangeText={setCity}
        placeholder="Douala"
        autoCapitalize="words"
        error={errors.city}
        onBlur={validateCity}
      />

      <Input
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        helper="8 caractères minimum, dont 1 majuscule et 1 chiffre."
        error={errors.password}
        onBlur={validatePassword}
      />

      <Input
        label="Confirmer le mot de passe"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        placeholder="••••••••"
        secureTextEntry
        error={errors.password_confirm}
        onBlur={validatePasswordConfirm}
      />

      <Button
        label="Créer mon compte"
        onPress={handleSignUp}
        loading={loading}
        disabled={loading || !allFieldsFilled || hasFieldErrors}
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
