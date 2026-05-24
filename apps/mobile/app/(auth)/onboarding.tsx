import React, { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Shield, Eye, Zap } from 'lucide-react-native';
import { colors, spacing, radius } from '../../src/constants/colors';
import { Button } from '../../src/components/ui/Button';

const { width } = Dimensions.get('window');

type Language = 'fr' | 'en';

// Photos de progression de réparation utilisées sur la 3ème slide.
// TODO: remplacer par les visuels définitifs fournis par le client.
const REPAIR_PHOTOS = {
  before: 'https://placehold.co/240x180/1F2937/FFFFFF.png?text=Avant',
  during: 'https://placehold.co/240x180/C8102E/FFFFFF.png?text=Pendant',
  after: 'https://placehold.co/240x180/5FD0A0/FFFFFF.png?text=Apr%C3%A8s',
} as const;

interface SlideImage {
  uri: string;
  labelFr: string;
  labelEn: string;
}

interface Slide {
  id: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  images?: SlideImage[];
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
    descriptionFr: 'Suivez l\'avancement de votre réparation à chaque étape, en toute transparence.',
    descriptionEn: 'Follow the progress of your repair at every step, with full transparency.',
    images: [
      { uri: REPAIR_PHOTOS.before, labelFr: 'Avant', labelEn: 'Before' },
      { uri: REPAIR_PHOTOS.during, labelFr: 'Pendant', labelEn: 'During' },
      { uri: REPAIR_PHOTOS.after, labelFr: 'Après', labelEn: 'After' },
    ],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState<Language>('fr');
  const flatListRef = useRef<FlatList<Slide>>(null);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  const handleStart = () => {
    router.push({
      pathname: '/(auth)/role-choice',
      params: { mode: 'signup' },
    });
  };

  const handleSignIn = () => {
    router.push({
      pathname: '/(auth)/role-choice',
      params: { mode: 'signin' },
    });
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
          <IconComponent size={64} color={colors.red} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {item.images && (
          <View style={styles.imagesRow}>
            {item.images.map((img, idx) => (
              <View key={`${item.id}-img-${idx}`} style={styles.imageCard}>
                <Image
                  source={{ uri: img.uri }}
                  style={styles.image}
                  resizeMode="cover"
                  accessibilityLabel={language === 'fr' ? img.labelFr : img.labelEn}
                />
                <Text style={styles.imageLabel}>
                  {language === 'fr' ? img.labelFr : img.labelEn}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={toggleLanguage}
          accessibilityRole="button"
          accessibilityLabel={language === 'fr' ? 'Passer en anglais' : 'Switch to French'}
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
        onMomentumScrollEnd={handleScroll}
        showsHorizontalScrollIndicator={false}
      />

      <View style={styles.indicators}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentIndex && styles.dotActive]}
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
        <View style={styles.signInLinkSlot}>
          {isLastSlide && (
            <TouchableOpacity
              onPress={handleSignIn}
              accessibilityRole="link"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.signInLink}>
                {language === 'fr' ? 'Déjà un compte ?' : 'Already have an account?'}
                <Text style={styles.signInLinkBold}>
                  {language === 'fr' ? ' Se connecter' : ' Sign in'}
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    paddingVertical: spacing[6],
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
  imagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: spacing[8],
    gap: spacing[3],
  },
  imageCard: {
    flex: 1,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    marginBottom: spacing[2],
    backgroundColor: colors.slate,
  },
  imageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
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
  signInLinkSlot: {
    minHeight: 22,
    justifyContent: 'center',
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
