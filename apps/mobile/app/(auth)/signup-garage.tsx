import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Wrench } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { garagistSignUpSchema } from '@carlink/shared/validators';
import { Button } from '../../src/components/ui/Button';
import { DarkInput, SpecChip } from '../../src/components/ui/DarkInput';

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
  const insets = useSafeAreaInsets();
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
    <View style={s.root}>
      <LinearGradient
        colors={['#1F2937', '#0A0E15', '#0A0E15']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.haloRed} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[s.safe, { paddingTop: insets.top + 6 }]}>
          <View style={s.topBar}>
            <Pressable onPress={() => router.back()} hitSlop={8} style={s.backIcon}>
              <ArrowLeft size={20} color="rgba(255,255,255,0.7)" strokeWidth={2.2} />
            </Pressable>
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: insets.bottom + 24 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.heroIconWrap}>
              <Wrench size={26} color="#C8102E" strokeWidth={2.2} />
            </View>

            <Text style={s.eyebrow}>COMPTE GARAGISTE</Text>
            <Text style={s.title}>Créer mon{'\n'}compte garagiste</Text>
            <Text style={s.lead}>
              Renseignez les bases — vous compléterez le profil ensuite.
            </Text>

            {errors.form ? (
              <View style={s.errorBanner}>
                <Text style={s.errorBannerTxt}>{errors.form}</Text>
              </View>
            ) : null}

            <View style={s.form}>
              <DarkInput
                label="Nom du garage"
                value={garageName}
                onChangeText={setGarageName}
                placeholder="Garage Étoile Bonapriso"
                autoCapitalize="words"
                error={errors.garage_name}
              />

              <DarkInput
                label="Nom du gérant"
                value={managerName}
                onChangeText={setManagerName}
                placeholder="Pascal Mbarga"
                autoComplete="name"
                error={errors.manager_name}
              />

              <DarkInput
                label="Email pro"
                value={email}
                onChangeText={setEmail}
                placeholder="contact@garageetoile.cm"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
              />

              <DarkInput
                label="Téléphone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+237 6 99 23 41 87"
                keyboardType="phone-pad"
                autoComplete="tel"
                error={errors.phone}
              />

              <View style={s.row}>
                <DarkInput
                  label="Ville"
                  value={city}
                  onChangeText={setCity}
                  placeholder="Douala"
                  autoCapitalize="words"
                  error={errors.city}
                  style={{ flex: 1 }}
                />
                <DarkInput
                  label="Quartier"
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                  placeholder="Bonapriso"
                  autoCapitalize="words"
                  error={errors.neighborhood}
                  style={{ flex: 1 }}
                />
              </View>

              <DarkInput
                label="Adresse"
                value={address}
                onChangeText={setAddress}
                placeholder="Rue 1.234, Bonapriso"
                autoCapitalize="words"
                error={errors.address}
              />

              <View style={s.specWrap}>
                <Text style={s.specLabel}>
                  Spécialités principales
                  {specialties.length > 0 ? (
                    <Text style={s.specCount}> · {specialties.length}</Text>
                  ) : null}
                </Text>
                <View style={s.specChips}>
                  {SPECIALTIES.map((spec) => (
                    <SpecChip
                      key={spec}
                      label={spec}
                      selected={specialties.includes(spec)}
                      onPress={() => toggleSpec(spec)}
                    />
                  ))}
                </View>
                {errors.specialties ? (
                  <Text style={s.specError}>{errors.specialties}</Text>
                ) : null}
              </View>

              <DarkInput
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
                trailingIcon={ArrowRight}
                fullWidth
                style={s.cta}
              />
            </View>

            <Pressable
              onPress={() => router.push('/(auth)/signin')}
              hitSlop={8}
              style={s.altWrap}
            >
              <Text style={s.altTxt}>
                Déjà inscrit ? <Text style={s.altTxtAccent}>Se connecter</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0E15',
  },
  haloRed: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(200,16,46,0.32)',
    opacity: 0.9,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 22,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  backIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(200,16,46,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#C8102E',
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  lead: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    marginTop: 6,
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: 'rgba(200,16,46,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(200,16,46,0.5)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorBannerTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  form: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  specWrap: {
    marginBottom: 14,
  },
  specLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  specCount: {
    color: '#C8102E',
    fontWeight: '700',
  },
  specChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specError: {
    marginTop: 6,
    fontSize: 11,
    color: '#FF6B7A',
    fontWeight: '500',
  },
  cta: {
    marginTop: 8,
  },
  altWrap: {
    alignSelf: 'center',
    paddingVertical: 16,
  },
  altTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  altTxtAccent: {
    color: '#fff',
    fontWeight: '700',
  },
});
