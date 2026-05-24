import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Car, Wrench } from 'lucide-react-native';
import { colors, spacing, radius } from '../../src/constants/colors';

type AuthMode = 'signin' | 'signup';
type Role = 'driver' | 'garage';

interface RoleCardProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  onPress: () => void;
}

function RoleCard({ icon: Icon, title, description, onPress }: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.cardIconContainer}>
        <Icon size={36} color={colors.red} strokeWidth={1.75} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <ChevronRight size={22} color={colors.muted} />
    </Pressable>
  );
}

export default function RoleChoiceScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: AuthMode = params.mode === 'signin' ? 'signin' : 'signup';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/onboarding');
    }
  };

  const handleRoleSelect = (role: Role) => {
    const pathname = mode === 'signup' ? '/(auth)/signup' : '/(auth)/signin';
    router.push({ pathname, params: { role } });
  };

  const title = mode === 'signup' ? 'Créer un compte' : 'Se connecter';
  const subtitle =
    mode === 'signup'
      ? 'Quel type de compte souhaitez-vous créer ?'
      : 'Sélectionnez votre type de compte';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft size={28} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.cardsContainer}>
          <RoleCard
            icon={Car}
            title="Conducteur"
            description="Trouvez un garage de confiance et obtenez des devis transparents pour votre véhicule."
            onPress={() => handleRoleSelect('driver')}
          />
          <RoleCard
            icon={Wrench}
            title="Garagiste"
            description="Recevez des demandes de devis qualifiées et développez votre activité."
            onPress={() => handleRoleSelect('garage')}
          />
        </View>

        <Text style={styles.helperText}>
          Vous pourrez modifier votre profil par la suite depuis les paramètres.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[8],
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[2],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing[8],
    lineHeight: 22,
  },
  cardsContainer: {
    gap: spacing[4],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[5],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: '#FDECEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  cardContent: {
    flex: 1,
    paddingRight: spacing[2],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate,
    marginBottom: spacing[1],
  },
  cardDescription: {
    fontSize: 13,
    color: colors.slate,
    lineHeight: 18,
    opacity: 0.75,
  },
  helperText: {
    marginTop: spacing[8],
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: spacing[3],
  },
});
