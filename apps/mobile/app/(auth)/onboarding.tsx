import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  BadgeCheck,
  Check,
  Star,
} from 'lucide-react-native';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import {
  H2,
  BodySm,
  Caption,
  Eyebrow,
} from '../../src/components/ui/Typography';
import {
  accent,
  bg,
  border,
  fg,
  palette,
  radius,
  semantic,
  spacing,
} from '../../src/constants/theme';

const { width } = Dimensions.get('window');

type Language = 'fr' | 'en';

interface Slide {
  id: string;
  eyebrow: { fr: string; en: string };
  title: { fr: string; en: string };
  desc: { fr: string; en: string };
}

const SLIDES: Slide[] = [
  {
    id: '1',
    eyebrow: { fr: "La confiance d'abord", en: 'Trust first' },
    title: {
      fr: 'Des garages certifiés,\npas des inconnus.',
      en: 'Certified garages,\nnot strangers.',
    },
    desc: {
      fr: 'Chaque garage CarLink est vérifié sur place : adresse, équipement, expérience. Vous voyez les avis vérifiés des vrais clients.',
      en: 'Every CarLink garage is verified on-site: address, equipment, experience. Real verified reviews from real customers.',
    },
  },
  {
    id: '2',
    eyebrow: { fr: 'Plus de devinettes', en: 'No more guessing' },
    title: {
      fr: 'Comparez les devis\navant de payer.',
      en: 'Compare quotes\nbefore you pay.',
    },
    desc: {
      fr: "Décrivez le problème une fois, recevez plusieurs devis détaillés. Pièces, main d'oeuvre, délai — tout est écrit, sans surprise.",
      en: 'Describe the problem once, get multiple detailed quotes. Parts, labour, timeline — all written out, no surprises.',
    },
  },
  {
    id: '3',
    eyebrow: { fr: 'Votre véhicule, votre contrôle', en: 'Your car, your control' },
    title: {
      fr: 'Suivez chaque étape\nde la réparation.',
      en: 'Track every step\nof the repair.',
    },
    desc: {
      fr: "Photos avant/après, statuts en temps réel, carnet d'entretien automatique. Vous savez toujours où en est votre voiture.",
      en: 'Before/after photos, real-time status updates, automatic maintenance log. You always know where your car stands.',
    },
  },
];

function GarageCertifiedIllus() {
  return (
    <View style={illus.card}>
      <View style={illus.row}>
        <View style={illus.avatar}>
          <BadgeCheck size={20} color={accent.base} strokeWidth={2} />
        </View>
        <View style={illus.meta}>
          <BodySm weight="600" color={fg.strong}>
            Garage Étoile · Bonapriso
          </BodySm>
          <View style={illus.starRow}>
            <Star size={12} color="#C97A0E" fill="#C97A0E" />
            <Caption color={fg.muted}> 4.8 · 142 avis</Caption>
          </View>
        </View>
        <View style={illus.certBadge}>
          <BadgeCheck size={16} color={accent.base} strokeWidth={2} />
        </View>
      </View>
      <View style={illus.tagRow}>
        <View style={illus.tag}>
          <Check size={10} color={semantic.success} strokeWidth={3} />
          <Caption color={semantic.success}>Pièces d'origine</Caption>
        </View>
        <View style={illus.tag}>
          <Check size={10} color={semantic.success} strokeWidth={3} />
          <Caption color={semantic.success}>Sur place 2024</Caption>
        </View>
      </View>
    </View>
  );
}

function QuotesIllus() {
  const quotes = [
    { name: 'Garage Étoile', price: '38 500', best: true },
    { name: 'Auto Service Akwa', price: '45 000', best: false },
    { name: 'Méca+ Bonabéri', price: '52 000', best: false },
  ];
  return (
    <View style={illus.quoteList}>
      {quotes.map((q) => (
        <View
          key={q.name}
          style={[illus.quoteRow, q.best && illus.quoteRowBest]}
        >
          <View style={illus.quoteMeta}>
            <BodySm weight="600" color={fg.strong} style={{ fontSize: 12 }}>
              {q.name}
            </BodySm>
            {q.best && (
              <View style={illus.bestChip}>
                <Caption color={accent.base} weight="600">
                  Meilleur prix
                </Caption>
              </View>
            )}
          </View>
          <BodySm weight="700" color={q.best ? accent.base : fg.default}>
            {q.price} <Caption color={fg.muted}>FCFA</Caption>
          </BodySm>
        </View>
      ))}
    </View>
  );
}

function TrackingIllus() {
  const steps = [
    { label: 'Devis accepté', done: true },
    { label: 'En réparation', done: true, active: true },
    { label: 'Photos ajoutées', done: false },
    { label: 'Terminé', done: false },
  ];
  return (
    <View style={illus.trackList}>
      {steps.map((s, i) => (
        <View key={s.label} style={illus.trackRow}>
          <View
            style={[
              illus.trackDot,
              s.done && illus.trackDotDone,
              s.active && illus.trackDotActive,
            ]}
          >
            {s.done && <Check size={10} color="#fff" strokeWidth={3} />}
          </View>
          {i < steps.length - 1 && (
            <View
              style={[illus.trackLine, s.done && illus.trackLineDone]}
            />
          )}
          <Caption
            color={s.active ? fg.strong : s.done ? semantic.success : fg.muted}
            weight={s.active ? '600' : '400'}
          >
            {s.label}
          </Caption>
        </View>
      ))}
    </View>
  );
}

const ILLUSTRATIONS = [GarageCertifiedIllus, QuotesIllus, TrackingIllus];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const [lang, setLang] = useState<Language>('fr');
  const listRef = useRef<FlatList>(null);

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
    } else {
      router.push('/(auth)/signup');
    }
  };

  const skip = () => router.push('/(auth)/signup');

  const slide = SLIDES[index];
  const Illus = ILLUSTRATIONS[index];

  return (
    <Screen tone="paper">
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.langToggle}>
          {(['fr', 'en'] as Language[]).map((l) => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              style={[styles.langBtn, lang === l && styles.langBtnOn]}
            >
              <BodySm
                weight="600"
                color={lang === l ? fg.strong : fg.muted}
                style={styles.langText}
              >
                {l.toUpperCase()}
              </BodySm>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={skip} hitSlop={8}>
          <BodySm color={fg.muted} weight="600">
            {lang === 'fr' ? 'Passer' : 'Skip'}
          </BodySm>
        </Pressable>
      </View>

      {/* Illustration stage */}
      <View style={styles.stage}>
        <View style={styles.illustBg}>
          <Illus />
        </View>
      </View>

      {/* Text content */}
      <View style={styles.text}>
        <Eyebrow style={styles.eyebrow}>
          {lang === 'fr' ? slide.eyebrow.fr : slide.eyebrow.en}
        </Eyebrow>
        <H2 style={styles.title}>
          {lang === 'fr' ? slide.title.fr : slide.title.en}
        </H2>
        <BodySm color={fg.muted} style={styles.desc}>
          {lang === 'fr' ? slide.desc.fr : slide.desc.en}
        </BodySm>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <Button
          label={
            index === SLIDES.length - 1
              ? lang === 'fr' ? 'Commencer' : 'Get started'
              : lang === 'fr' ? 'Suivant' : 'Next'
          }
          onPress={goNext}
          fullWidth
          style={styles.cta}
        />
        <Pressable
          onPress={() => router.push('/(auth)/signin')}
          style={styles.altRow}
          hitSlop={8}
        >
          <BodySm color={fg.muted}>
            {lang === 'fr' ? 'Déjà un compte ?' : 'Already have an account?'}
          </BodySm>
          <BodySm color={accent.base} weight="600">
            {lang === 'fr' ? ' Se connecter' : ' Sign in'}
          </BodySm>
        </Pressable>
      </View>

      {/* Hidden FlatList to keep scroll ref consistent */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        renderItem={() => <View style={{ width }} />}
        style={{ height: 0 }}
      />
    </Screen>
  );
}

const illus = StyleSheet.create({
  card: {
    backgroundColor: bg.surface,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: border.subtle,
    gap: spacing[3],
    width: '100%',
    maxWidth: 280,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: palette.red[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  meta: { flex: 1, gap: 2 },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certBadge: {
    padding: 4,
    backgroundColor: palette.red[50],
    borderRadius: radius.xs,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: semantic.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  quoteList: {
    gap: spacing[2],
    width: '100%',
    maxWidth: 280,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: bg.surface,
    borderRadius: radius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: border.subtle,
  },
  quoteRowBest: {
    borderColor: accent.base,
    borderWidth: 2,
  },
  quoteMeta: { gap: 2 },
  bestChip: {
    backgroundColor: palette.red[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  trackList: {
    width: '100%',
    maxWidth: 200,
    gap: 0,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingVertical: 4,
  },
  trackDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: border.default,
    backgroundColor: bg.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  trackDotDone: {
    borderColor: semantic.success,
    backgroundColor: semantic.success,
  },
  trackDotActive: {
    borderColor: accent.base,
    backgroundColor: accent.base,
  },
  trackLine: {
    position: 'absolute',
    left: 9,
    top: 22,
    width: 2,
    height: 20,
    backgroundColor: border.subtle,
  },
  trackLineDone: {
    backgroundColor: semantic.success,
  },
});

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: palette.neutral[100],
    borderRadius: radius.sm,
    padding: 3,
    gap: 2,
  },
  langBtn: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: 6,
  },
  langBtnOn: {
    backgroundColor: bg.surface,
  },
  langText: {
    fontSize: 12,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  illustBg: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.neutral[100],
    borderRadius: radius.xl,
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
    minHeight: 200,
  },
  text: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
  },
  eyebrow: {
    marginBottom: spacing[1],
  },
  title: {
    lineHeight: 36,
  },
  desc: {
    lineHeight: 21,
    marginTop: spacing[1],
  },
  footer: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[6],
    gap: spacing[3],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.neutral[300],
  },
  dotActive: {
    width: 24,
    backgroundColor: accent.base,
  },
  cta: {},
  altRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
