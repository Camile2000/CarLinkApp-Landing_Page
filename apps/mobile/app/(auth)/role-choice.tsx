import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Users, Wrench } from 'lucide-react-native';
import { Button } from '../../src/components/ui/Button';
import { BodySm } from '../../src/components/ui/Typography';

type Role = 'conductor' | 'garage';

interface RoleOption {
  id: Role;
  label: string;
  description: string;
  icon: typeof Users;
  emoji: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'conductor',
    label: 'Conducteur',
    description: 'Trouvez des garages de confiance et comparez les devis',
    icon: Users,
    emoji: '👤',
  },
  {
    id: 'garage',
    label: 'Garagiste',
    description: 'Gérez vos demandes de réparation et vos clients',
    icon: Wrench,
    emoji: '🔧',
  },
];

export default function RoleChoiceScreen() {
  const [selected, setSelected] = useState<Role | null>(null);
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
    if (selected) {
      router.push({
        pathname: '/(auth)/signup',
        params: { selectedRole: selected },
      });
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.header}>
        <Text style={s.title}>Quel est votre rôle ?</Text>
        <Text style={s.subtitle}>Choisissez pour continuer</Text>
      </View>

      <View style={s.cardsContainer}>
        {ROLES.map((role) => (
          <Pressable
            key={role.id}
            onPress={() => setSelected(role.id)}
            style={({ pressed }) => [
              s.card,
              selected === role.id && s.cardSelected,
              pressed && s.cardPressed,
            ]}
          >
            <View style={s.cardContent}>
              <View style={s.iconWrap}>
                <Text style={s.emoji}>{role.emoji}</Text>
              </View>
              <Text style={s.label}>{role.label}</Text>
              <Text style={s.description}>{role.description}</Text>
            </View>
            {selected === role.id && (
              <View style={s.checkmark}>
                <View style={s.checkmarkInner} />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <View style={s.footer}>
        <Button
          label="Continuer"
          onPress={handleContinue}
          disabled={!selected}
          fullWidth
        />
        <Pressable onPress={() => router.back()} hitSlop={8} style={s.backBtn}>
          <BodySm color="rgba(255,255,255,0.55)">Retour</BodySm>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0E15',
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 28,
    paddingBottom: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  cardsContainer: {
    flex: 1,
    gap: 16,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardSelected: {
    backgroundColor: 'rgba(200,16,46,0.12)',
    borderColor: '#C8102E',
  },
  cardContent: {
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.62)',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#C8102E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  footer: {
    gap: 12,
    paddingBottom: 20,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
