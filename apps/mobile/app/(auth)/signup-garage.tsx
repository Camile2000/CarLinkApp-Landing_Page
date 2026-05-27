import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, ChevronDown, Wrench } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import {
  emailSchema,
  garagistSignUpSchema,
  passwordSchema,
  phoneSchema,
  checkEmailStatus,
} from '@carlink/shared';
import { SUPABASE_URL } from '@carlink/shared/env';
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
import { LightSpecChip } from '../../src/components/ui/DarkInput';
import { useToast } from '../../src/components/ui/ToastProvider';

const SPECIALTIES = [
  'Mécanique générale',
  'Électricité',
  'Carrosserie',
  'Climatisation',
  'Diagnostic',
  'Pneus',
  'Vidange & Entretien',
  'Freins',
  'Transmission',
];

const CITIES = ['Douala', 'Yaoundé', 'Bafoussam'] as const;
type CityOption = (typeof CITIES)[number];

export default function SignUpGarageScreen() {
  const [garageName, setGarageName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [citySelected, setCitySelected] = useState<CityOption | ''>('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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

  const validateGarageName = () => {
    if (!garageName.trim()) return setFieldError('garage_name', null);
    if (garageName.trim().length < 2) setFieldError('garage_name', 'Nom du garage requis');
    else setFieldError('garage_name', null);
  };

  const validateManagerName = () => {
    if (!managerName.trim()) return setFieldError('manager_name', null);
    if (managerName.trim().length < 2) setFieldError('manager_name', 'Nom du gérant requis');
    else setFieldError('manager_name', null);
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
    if (!citySelected) return setFieldError('city', null);
    setFieldError('city', null);
  };

  const validateAddress = () => {
    if (!address.trim()) return setFieldError('address', null);
    if (address.trim().length < 2) setFieldError('address', 'Adresse requise');
    else setFieldError('address', null);
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

  const toggleSpec = (spec: string) => {
    setSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSelectCity = (c: CityOption) => {
    setCitySelected(c);
    setCityDropdownOpen(false);
    setFieldError('city', null);
  };

  const handleSignUp = async () => {
    setErrors({});

    try {
      const data = garagistSignUpSchema.parse({
        garage_name: garageName.trim(),
        manager_name: managerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: citySelected,
        neighborhood: neighborhood.trim() || undefined,
        address: address.trim(),
        specialties,
        password,
        password_confirm: passwordConfirm,
        language: 'fr',
      });

      setLoading(true);

      const result = await checkEmailStatus(data.email, SUPABASE_URL);

      if (result.error) {
        toast.error('Erreur lors de la vérification de l\'email');
        return;
      }

      if (result.status === 'pending_verification') {
        toast.error('Un compte est déjà en cours de validation avec cet email. Veuillez vérifier le code reçu par email.');
        setFieldError('email', 'Email déjà en attente de vérification');
        return;
      }

      if (result.status === 'verified') {
        toast.error('Cet email est déjà associé à un compte.');
        setFieldError('email', 'Cet email est déjà utilisé');
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.manager_name,
            role: 'garage',
            language: data.language,
            phone: data.phone,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Inscription réussie. Vérifiez votre email.');
      setTimeout(() => {
        router.push({
          pathname: '/(auth)/otp',
          params: {
            email: data.email,
            type: 'signup',
            role: 'garage',
            garage_name: data.garage_name,
            phone: data.phone,
            city: data.city,
            neighborhood: data.neighborhood ?? '',
            address: data.address,
            specialties: JSON.stringify(data.specialties),
          },
        });
      }, 500);
    } catch (err: unknown) {
      if (err instanceof Error && 'issues' in err && Array.isArray(err.issues)) {
        const issuesArr = err.issues as Array<{ path?: Array<string | number>; message: string }>;
        const firstMsg = issuesArr[0]?.message || 'Erreur de validation';
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
    !!garageName.trim() &&
    !!managerName.trim() &&
    !!email.trim() &&
    !!phone.trim() &&
    !!citySelected &&
    !!address.trim() &&
    specialties.length > 0 &&
    !!password &&
    !!passwordConfirm;

  return (
    <AuthLayout
      onBack={() => router.back()}
      heroIcon={Wrench}
      heroTone="red"
      eyebrow="COMPTE GARAGISTE"
      title="Créer mon compte garagiste"
      lead="Renseignez les bases — vous compléterez le profil ensuite."
    >
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          setCityDropdownOpen(false);
        }}
      >
        <Input
        label="Nom du garage"
        value={garageName}
        onChangeText={setGarageName}
        placeholder="Garage Étoile Bonapriso"
        autoCapitalize="words"
        error={errors.garage_name}
        onBlur={validateGarageName}
        onFocus={() => setCityDropdownOpen(false)}
      />

      <Input
        label="Nom du gérant"
        value={managerName}
        onChangeText={setManagerName}
        placeholder="Pascal Mbarga"
        autoComplete="name"
        error={errors.manager_name}
        onBlur={validateManagerName}
        onFocus={() => setCityDropdownOpen(false)}
      />

      <Input
        label="Email"
        value={email}
        onChangeText={(t) => setEmail(t.trim())}
        placeholder="contact@garageetoile.cm"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
        onBlur={validateEmail}
        onFocus={() => setCityDropdownOpen(false)}
      />

      <Input
        label="Téléphone"
        value={phone}
        onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 9))}
        placeholder="6XXXXXXXX"
        keyboardType="phone-pad"
        autoComplete="tel"
        helper="Format Cameroun : 6XXXXXXXX (9 chiffres, commence par 6)"
        error={errors.phone}
        onBlur={validatePhone}
        onFocus={() => setCityDropdownOpen(false)}
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

      <Input
        label="Quartier"
        value={neighborhood}
        onChangeText={setNeighborhood}
        placeholder="Bonapriso"
        autoCapitalize="words"
        error={errors.neighborhood}
        onFocus={() => setCityDropdownOpen(false)}
      />

      <Input
        label="Adresse"
        value={address}
        onChangeText={setAddress}
        placeholder="Rue 1.234, Bonapriso"
        autoCapitalize="words"
        error={errors.address}
        onBlur={validateAddress}
        onFocus={() => setCityDropdownOpen(false)}
      />

      <View style={{ marginBottom: 14 }}>
        <BodySm weight="600" style={{ marginBottom: 8, letterSpacing: 0.2 }}>
          Spécialités principales
          {specialties.length > 0 ? (
            <BodySm color={accent.base} weight="700"> · {specialties.length}</BodySm>
          ) : null}
        </BodySm>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SPECIALTIES.map((spec) => (
            <LightSpecChip
              key={spec}
              label={spec}
              selected={specialties.includes(spec)}
              onPress={() => toggleSpec(spec)}
            />
          ))}
        </View>
        {errors.specialties ? (
          <BodySm weight="500" style={{ marginTop: 6, fontSize: 11, color: '#FF6B7A' }}>
            {errors.specialties}
          </BodySm>
        ) : null}
      </View>

      <Input
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        helper={passwordHelperText}
        error={errors.password}
        onBlur={validatePassword}
        onFocus={() => setCityDropdownOpen(false)}
      />

      <Input
        label="Confirmer le mot de passe"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        placeholder="••••••••"
        secureTextEntry
        error={errors.password_confirm}
        onFocus={() => setCityDropdownOpen(false)}
      />

      <Button
        label="Continuer vers la vérification"
        onPress={handleSignUp}
        loading={loading}
        disabled={loading || !allFieldsFilled || hasFieldErrors}
        fullWidth
        style={authStyles.fullButton}
      />

        <View style={authStyles.altRow}>
          <BodySm color={fg.muted}>Déjà inscrit ?</BodySm>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <BodySm color={accent.base} weight="600"> Se connecter</BodySm>
          </Pressable>
        </View>
      </Pressable>
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
