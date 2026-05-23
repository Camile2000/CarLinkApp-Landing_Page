import React, { useState } from 'react';
import { BackHandler, Pressable, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Wrench } from 'lucide-react-native';
import { supabase } from '@carlink/shared/supabase/client';
import { garageSignUpSchema } from '@carlink/shared/validators';
import { useAuth } from '../../src/contexts/AuthContext';
import { AuthLayout, authStyles } from '../../src/components/ui/AuthLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { BodySm } from '../../src/components/ui/Typography';
import { fg } from '../../src/constants/theme';

const SPECIALTIES = [
  'Mécanique générale',
  'Carrosserie',
  'Électronique auto',
  'Climatisation',
  'Pneus / Roues',
  'Vidange & Entretien',
  'Freins',
  'Transmission',
  'Diagnostic',
  'Tuning',
];

const mapSupabaseError = (code?: string, message?: string): string => {
  if (code === '23505') return 'Un garage existe déjà pour ce compte.';
  if (code === '42501' || code === 'PGRST301') {
    return "Action non autorisée. Vérifiez que votre compte est bien un compte garage.";
  }
  if (message?.toLowerCase().includes('network')) {
    return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
  }
  return "Impossible d'enregistrer le garage. Réessayez.";
};

export default function GarageSetupScreen() {
  const { user } = useAuth();
  const [garageName, setGarageName] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bloque le bouton retour Android : l'utilisateur doit terminer le setup.
  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSave = async () => {
    if (loading) return;
    setErrors({});

    if (!user) {
      setErrors({ form: 'Session expirée. Veuillez vous reconnecter.' });
      return;
    }

    try {
      const data = garageSignUpSchema.parse({
        garage_name: garageName,
        city,
        neighborhood,
        phone,
        specialties: selectedSpecialties,
      });

      setLoading(true);

      const neighborhoodValue = data.neighborhood?.trim()
        ? data.neighborhood.trim()
        : null;

      const { error } = await supabase.from('garages').insert({
        user_id: user.id,
        garage_name: data.garage_name,
        city: data.city,
        neighborhood: neighborhoodValue,
        phone: data.phone,
        specialties: data.specialties,
      });

      if (error) {
        setErrors({ form: mapSupabaseError(error.code, error.message) });
        return;
      }

      router.replace('/(garage)');
    } catch (err: unknown) {
      if (err instanceof Error && 'errors' in err && Array.isArray(err.errors)) {
        const next: Record<string, string> = {};
        (err.errors as Array<{ path?: string[]; message: string }>).forEach((e) => {
          if (e.path) next[e.path[0]] = e.message;
        });
        setErrors(next);
      } else {
        setErrors({ form: mapSupabaseError() });
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    garageName.trim().length > 0 &&
    city.trim().length > 0 &&
    phone.trim().length > 0 &&
    selectedSpecialties.length > 0;

  return (
    <AuthLayout
      heroIcon={Wrench}
      heroTone="red"
      title="Paramètres de votre garage"
      lead="Complétez les informations de votre garage pour continuer."
    >
      <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
        {errors.form ? (
          <View style={authStyles.errorBanner}>
            <BodySm color="#fff" weight="500">
              {errors.form}
            </BodySm>
          </View>
        ) : null}

        <Input
          label="Nom du garage"
          value={garageName}
          onChangeText={setGarageName}
          placeholder="Auto Réparation SA"
          error={errors.garage_name}
        />

        <Input
          label="Ville"
          value={city}
          onChangeText={setCity}
          placeholder="Casablanca"
          error={errors.city}
        />

        <Input
          label="Quartier (optionnel)"
          value={neighborhood}
          onChangeText={setNeighborhood}
          placeholder="Anciens Camps"
          error={errors.neighborhood}
        />

        <Input
          label="Téléphone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+212 6XX XXX XXX"
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <View style={{ marginBottom: 24 }}>
          <BodySm color={fg.muted} weight="500" style={{ marginBottom: 12 }}>
            {selectedSpecialties.length === 0
              ? 'Spécialités (sélectionnez-en au moins une)'
              : `Spécialités · ${selectedSpecialties.length} sélectionnée${selectedSpecialties.length > 1 ? 's' : ''}`}
          </BodySm>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SPECIALTIES.map((specialty) => {
              const isSelected = selectedSpecialties.includes(specialty);
              return (
                <Pressable
                  key={specialty}
                  onPress={() => toggleSpecialty(specialty)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 16,
                    backgroundColor: isSelected ? '#C8102E' : 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    borderColor: isSelected ? '#C8102E' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <BodySm color={isSelected ? '#fff' : fg.muted} weight={isSelected ? '600' : '500'}>
                    {specialty}
                  </BodySm>
                </Pressable>
              );
            })}
          </View>
          {errors.specialties ? (
            <BodySm color="#ff4444" weight="500" style={{ marginTop: 8 }}>
              {errors.specialties}
            </BodySm>
          ) : null}
        </View>

        <Button
          label="Terminer"
          onPress={handleSave}
          loading={loading}
          disabled={!isFormValid || loading}
          fullWidth
          style={authStyles.fullButton}
        />
      </ScrollView>
    </AuthLayout>
  );
}
