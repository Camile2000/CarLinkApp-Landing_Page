import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Wrench } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { garagistSignUpSchema } from '@carlink/shared/validators';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { BodySm } from '../../src/components/ui/Typography';
import { accent, fg } from '../../src/constants/theme';
import { LightSpecChip } from '../../src/components/ui/DarkInput';

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

export default function SignUpGarageScreen() {
  const [garageName, setGarageName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleSpec = (spec: string) => {
    setSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSignUp = async () => {
    setErrors({});

    try {
      const data = garagistSignUpSchema.parse({
        garage_name: garageName.trim(),
        manager_name: managerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim() || undefined,
        address: address.trim(),
        specialties,
        password,
        language: 'fr',
      });

      setLoading(true);

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
        if (error.message.includes('already registered')) {
          setErrors({ email: 'Cet email est déjà utilisé' });
        } else {
          setErrors({ form: error.message });
        }
        return;
      }

      // Les infos garage sont passées en params jusqu'à OTP qui fera
      // l'INSERT dans public.garages après vérification de l'email.
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
      heroIcon={Wrench}
      heroTone="red"
      eyebrow="COMPTE GARAGISTE"
      title="Créer mon compte garagiste"
      lead="Renseignez les bases — vous compléterez le profil ensuite."
    >
      {errors.form ? (
        <View style={authStyles.errorBanner}>
          <BodySm color="#fff" weight="500">{errors.form}</BodySm>
        </View>
      ) : null}

      <Input
        label="Nom du garage"
        value={garageName}
        onChangeText={setGarageName}
        placeholder="Garage Étoile Bonapriso"
        autoCapitalize="words"
        error={errors.garage_name}
      />

      <Input
        label="Nom du gérant"
        value={managerName}
        onChangeText={setManagerName}
        placeholder="Pascal Mbarga"
        autoComplete="name"
        error={errors.manager_name}
      />

      <Input
        label="Email pro"
        value={email}
        onChangeText={setEmail}
        placeholder="contact@garageetoile.cm"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />

      <Input
        label="Téléphone"
        value={phone}
        onChangeText={setPhone}
        placeholder="+237 6 99 23 41 87"
        keyboardType="phone-pad"
        autoComplete="tel"
        error={errors.phone}
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Input
          label="Ville"
          value={city}
          onChangeText={setCity}
          placeholder="Douala"
          autoCapitalize="words"
          error={errors.city}
          style={{ flex: 1 }}
        />
        <Input
          label="Quartier"
          value={neighborhood}
          onChangeText={setNeighborhood}
          placeholder="Bonapriso"
          autoCapitalize="words"
          error={errors.neighborhood}
          style={{ flex: 1 }}
        />
      </View>

      <Input
        label="Adresse"
        value={address}
        onChangeText={setAddress}
        placeholder="Rue 1.234, Bonapriso"
        autoCapitalize="words"
        error={errors.address}
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
        helper="8 caractères minimum, dont 1 majuscule et 1 chiffre."
        error={errors.password}
      />

      <Button
        label="Continuer vers la vérification"
        onPress={handleSignUp}
        loading={loading}
        disabled={loading}
        fullWidth
        style={authStyles.fullButton}
      />

      <View style={authStyles.altRow}>
        <BodySm color={fg.muted}>Déjà inscrit ?</BodySm>
        <Pressable onPress={() => router.replace('/(auth)/signin-garage')} hitSlop={8}>
          <BodySm color={accent.base} weight="600"> Se connecter</BodySm>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
