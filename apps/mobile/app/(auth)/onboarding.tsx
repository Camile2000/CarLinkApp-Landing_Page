import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Shield, Eye, Zap } from 'lucide-react-native';
import { colors, spacing, radius } from '../../src/constants/colors';
import { Button } from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');

type Language = 'fr' | 'en';

interface Slide {
  id: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: Shield,
    titleFr: 'La confiance',
    titleEn: 'Trust',
    descriptionFr: 'Connectez-vous avec des garages vérifiés et fiables pour vos réparations automobiles.',
    descriptionEn: 'Connect with verified and reliable garages for your car repairs.',
  },
  {
    id: '2',
    icon: Eye,
    titleFr: 'La transparence',
    titleEn: 'Transparency',
    descriptionFr: 'Recevez des devis clairs et détaillés avant de confier votre véhicule.',
    descriptionEn: 'Receive clear and detailed quotes before entrusting your vehicle.',
  },
  {
    id: '3',
    icon: Zap,
    titleFr: 'Le contrôle',
    titleEn: 'Control',
    descriptionFr: 'Vous gardez le contrôle total de vos demandes et de vos décisions.',
    descriptionEn: 'Keep full control of your requests and decisions.',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState<Language>('fr');
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const handleStart = () => {
    // @ts-expect-error Expo Router doesn't recognize dynamic route groups
    router.push('/(auth)/signup' as const);
  };

  const handleSignIn = () => {
    // @ts-expect-error Expo Router doesn't recognize dynamic route groups
    router.push('/(auth)/signin' as const);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const renderSlide = ({ item }: { item: Slide }): React.ReactElement => {
    const IconComponent = item.icon;
    const title = language === 'fr' ? item.titleFr : item.titleEn;
    const description = language === 'fr' ? item.descriptionFr : item.descriptionEn;

    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <IconComponent
            size={64}
            color={colors.red}
            strokeWidth={1.5}
          />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={toggleLanguage}
        >
          <Text style={styles.languageText}>
            {language === 'fr' ? 'EN' : 'FR'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
      />

      <View style={styles.indicators}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          label={language === 'fr' ? 'Commencer' : 'Get Started'}
          onPress={handleStart}
          variant="primary"
          size="md"
          style={styles.button}
        />
        <TouchableOpacity onPress={handleSignIn}>
          <Text style={styles.signInLink}>
            {language === 'fr' ? 'Déjà un compte ?' : 'Already have an account?'}
            <Text style={styles.signInLinkBold}>
              {language === 'fr' ? ' Se connecter' : ' Sign in'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    alignItems: 'flex-end',
  },
  languageButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radius.md,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate,
  },
  slide: {
    width,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing[6],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
    marginHorizontal: spacing[2],
  },
  dotActive: {
    backgroundColor: colors.red,
    width: 24,
  },
  footer: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
  },
  button: {
    marginBottom: spacing[4],
  },
  signInLink: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
  },
  signInLinkBold: {
    color: colors.red,
    fontWeight: '600',
  },
});
