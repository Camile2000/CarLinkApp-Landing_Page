import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Car, Check, ChevronDown } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import {
  conductorSignUpSchema,
  emailSchema,
  nameSchema,
  passwordSchema,
  phoneSchema,
} from '@carlink/shared/validators';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { BodySm } from '../../src/components/ui/Typography';
import {
  accent,
  bg,
  border,
  fg,
  palette,
  radius,
  spacing,
  typography,
} from '../../src/constants/theme';
import { useToast } from '../../src/components/ui/ToastProvider';

const CITIES = ['Douala', 'Yaoundé', 'Bafoussam', 'Autre'] as const;
type CityOption = (typeof CITIES)[number];

const sanitizeName = (text: string) =>
  text.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, '');

export default function SignUpConductorScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [citySelected, setCitySelected] = useState<CityOption | ''>('');
  const [cityCustom, setCityCustom] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const finalCity = citySelected === 'Autre' ? cityCustom.trim() : citySelected;

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

  useEffect(() => {
    if (!passwordConfirm) {
      setFieldError('password_confirm', null);
      return;
    }
    if (passwordConfirm === password) {
      setFieldError('password_confirm', null);
    } else {
      setFieldError('password_confirm', 'Les mots de passe ne correspondent pas');
    }
  }, [password, passwordConfirm]);

  const validateFirstName = () => {
    if (!firstName.trim()) return setFieldError('first_name', null);
    const result = nameSchema.safeParse(firstName.trim());
    if (result.success) setFieldError('first_name', null);
    else setFieldError('first_name', result.error.issues[0]?.message || 'Prénom invalide');
  };

  const validateLastName = () => {
    if (!lastName.trim()) return setFieldError('last_name', null);
    const result = nameSchema.safeParse(lastName.trim());
    if (result.success) setFieldError('last_name', null);
    else setFieldError('last_name', result.error.issues[0]?.message || 'Nom invalide');
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
    if (!finalCity) return setFieldError('city', null);
    if (finalCity.length < 2) return setFieldError('city', 'Ville requise');
    if (finalCity.length > 100) return setFieldError('city', '100 caractères maximum');
    setFieldError('city', null);
  };

  const validatePassword = () => {
    if (!password) return setFieldError('password', null);
    const result = passwordSchema.safeParse(password);
    if (result.success) setFieldError('password', null);
    else setFieldError('password', result.error.issues[0]?.message || 'Mot de passe invalide');
  };

  const passwordChecks = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
  };

  const passwordHelperText = password
    ? `${passwordChecks.length ? '✓' : '○'} 6 caractères   ${passwordChecks.upper ? '✓' : '○'} Majuscule   ${passwordChecks.digit ? '✓' : '○'} Chiffre`
    : '6 caractères minimum, dont 1 majuscule et 1 chiffre.';

  const handleSelectCity = (c: CityOption) => {
    setCitySelected(c);
    setCityDropdownOpen(false);
    if (c !== 'Autre') {
      setCityCustom('');
      setFieldError('city', null);
    }
  };

  const handleSignUp = async () => {
    setErrors({});

    try {
      const data = conductorSignUpSchema.parse({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: finalCity,
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
    !!finalCity &&
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
          onChangeText={(t) => setFirstName(sanitizeName(t))}
          placeholder="Marie"
          autoComplete="given-name"
          error={errors.first_name}
          onBlur={validateFirstName}
          style={{ flex: 1 }}
        />
        <Input
          label="Nom"
          value={lastName}
          onChangeText={(t) => setLastName(sanitizeName(t))}
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
        onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 9))}
        placeholder="6XXXXXXXX"
        keyboardType="phone-pad"
        autoComplete="tel"
        error={errors.phone}
        helper="Format Cameroun : 6XXXXXXXX (9 chiffres, commence par 6)"
        onBlur={validatePhone}
      />

      <View style={dd.wrapper}>
        <Text style={dd.label}>Ville</Text>
        <Pressable
          onPress={() => setCityDropdownOpen((o) => !o)}
          style={[
            dd.field,
            cityDropdownOpen && dd.fieldFocused,
            !!errors.city && dd.fieldError,
          ]}
        >
          <Text style={citySelected ? dd.value : dd.placeholder}>
            {citySelected || 'Sélectionner votre ville'}
          </Text>
          <ChevronDown
            size={18}
            color={palette.neutral[500]}
            strokeWidth={1.75}
            style={{ transform: [{ rotate: cityDropdownOpen ? '180deg' : '0deg' }] }}
          />
        </Pressable>
        {cityDropdownOpen ? (
          <View style={dd.options}>
            {CITIES.map((c) => {
              const isSelected = citySelected === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => handleSelectCity(c)}
                  style={[dd.option, isSelected && dd.optionSelected]}
                >
                  <Text style={[dd.optionText, isSelected && dd.optionTextSelected]}>
                    {c}
                  </Text>
                  {isSelected ? <Check size={14} color={accent.base} strokeWidth={3} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {errors.city ? <Text style={dd.errorText}>{errors.city}</Text> : null}
      </View>

      {citySelected === 'Autre' ? (
        <Input
          label="Préciser la ville"
          value={cityCustom}
          onChangeText={(t) => setCityCustom(sanitizeName(t))}
          placeholder="Ex : Limbé"
          autoCapitalize="words"
          onBlur={validateCity}
        />
      ) : null}

      <Input
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        helper={passwordHelperText}
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

const dd = StyleSheet.create({
  wrapper: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.semibold,
    color: fg.strong,
    marginBottom: spacing[2],
    letterSpacing: typography.tracking.wide,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border.subtle,
    backgroundColor: palette.neutral[100],
  },
  fieldFocused: {
    borderColor: border.strong,
    backgroundColor: bg.surface,
  },
  fieldError: {
    borderColor: border.accent,
    backgroundColor: bg.surface,
  },
  value: {
    fontSize: typography.size.body,
    color: fg.strong,
  },
  placeholder: {
    fontSize: typography.size.body,
    color: fg.subtle,
  },
  options: {
    marginTop: spacing[1],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border.subtle,
    backgroundColor: bg.surface,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    minHeight: 40,
  },
  optionSelected: {
    backgroundColor: palette.neutral[100],
  },
  optionText: {
    fontSize: typography.size.body,
    color: fg.strong,
  },
  optionTextSelected: {
    fontWeight: typography.weight.semibold,
    color: accent.base,
  },
  errorText: {
    marginTop: spacing[1],
    fontSize: typography.size.caption,
    color: border.accent,
    fontWeight: typography.weight.medium,
  },
});
