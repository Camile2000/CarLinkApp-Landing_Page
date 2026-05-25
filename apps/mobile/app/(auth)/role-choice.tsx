import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, Car, Check, Wrench } from 'lucide-react-native';
import { Button } from '../../src/components/ui/Button';

type Role = 'conductor' | 'garage';

interface RoleOption {
  id: Role;
  eyebrow: string;
  label: string;
  description: string;
  icon: typeof Car;
  points: string[];
  recommended?: boolean;
}

const ROLES: RoleOption[] = [
  {
    id: 'conductor',
    eyebrow: 'JE CHERCHE UN GARAGE',
    label: 'Conducteur',
    description: 'Comparez les devis, suivez la réparation et payez en toute confiance.',
    icon: Car,
    points: ['Garages vérifiés', 'Devis comparés', 'Suivi photo en temps réel'],
    recommended: true,
  },
  {
    id: 'garage',
    eyebrow: 'JE SUIS PROFESSIONNEL',
    label: 'Garagiste',
    description: 'Recevez des demandes qualifiées, envoyez vos devis et fidélisez vos clients.',
    icon: Wrench,
    points: ['Demandes ciblées', 'Profil certifié', 'Outils de gestion'],
  },
];

export default function RoleChoiceScreen() {
  const [selected, setSelected] = useState<Role | null>(null);
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
    if (selected === 'conductor') {
      router.push('/(auth)/signin-conductor');
    } else if (selected === 'garage') {
      router.push('/(auth)/signin-garage');
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

      <View
        style={[
          s.safe,
          { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <View style={s.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={s.backIcon}>
            <ArrowLeft size={20} color="rgba(255,255,255,0.7)" strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={s.header}>
          <Text style={s.eyebrow}>BIENVENUE SUR CARLINK</Text>
          <Text style={s.title}>
            Vous êtes{'\n'}conducteur ou garagiste ?
          </Text>
          <Text style={s.subtitle}>
            On adapte l'expérience à votre profil dès la première seconde.
          </Text>
        </View>

        <View style={s.cardsContainer}>
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.id;
            return (
              <Pressable
                key={role.id}
                onPress={() => setSelected(role.id)}
                style={({ pressed }) => [
                  s.card,
                  isSelected && s.cardSelected,
                  pressed && s.cardPressed,
                ]}
              >
                {role.recommended && (
                  <View style={s.badge}>
                    <Text style={s.badgeTxt}>RECOMMANDÉ</Text>
                  </View>
                )}
                <View style={[s.radio, isSelected && s.radioSelected, role.recommended && s.radioWithBadge]}>
                  {isSelected ? (
                    <Check size={14} color="#fff" strokeWidth={3} />
                  ) : null}
                </View>
                <View style={[s.iconWrap, isSelected && s.iconWrapSelected]}>
                  <Icon
                    size={22}
                    color={isSelected ? '#fff' : '#C8102E'}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardEyebrow}>{role.eyebrow}</Text>
                  <Text style={s.cardLabel}>{role.label}</Text>
                  <Text style={s.cardDesc}>{role.description}</Text>
                  <View style={s.pointsList}>
                    {role.points.map((point, idx) => (
                      <View key={idx} style={s.pointRow}>
                        <Check size={14} color="#C8102E" strokeWidth={2.5} />
                        <Text style={s.pointTxt}>{point}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={s.footer}>
          <Button
            label="Continuer"
            onPress={handleContinue}
            disabled={!selected}
            trailingIcon={ArrowRight}
            fullWidth
          />
        </View>
      </View>
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
  header: {
    marginTop: 12,
    marginBottom: 24,
    gap: 8,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#C8102E',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    marginTop: 2,
  },
  cardsContainer: {
    flex: 1,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardSelected: {
    backgroundColor: 'rgba(200,16,46,0.10)',
    borderColor: '#C8102E',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(200,16,46,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: '#C8102E',
  },
  cardBody: {
    flex: 1,
    gap: 2,
    paddingRight: 32,
  },
  cardEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.62)',
    lineHeight: 17,
    fontWeight: '400',
    marginTop: 2,
  },
  radio: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  radioWithBadge: {
    top: 48,
  },
  radioSelected: {
    backgroundColor: '#C8102E',
    borderColor: '#C8102E',
  },
  footer: {
    gap: 4,
    marginTop: 16,
  },
  altWrap: {
    alignSelf: 'center',
    paddingVertical: 12,
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
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#C8102E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  badgeTxt: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pointsList: {
    marginTop: 10,
    gap: 6,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: -0.05,
  },
});
