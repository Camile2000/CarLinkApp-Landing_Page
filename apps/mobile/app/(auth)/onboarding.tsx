import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowRight,
  Camera,
  Check,
  Star,
  Wrench,
} from 'lucide-react-native';
import { Button } from '../../src/components/ui/Button';

type Lang = 'fr' | 'en';

interface SlideText {
  eyebrow: { fr: string; en: string };
  title: { fr: string; en: string };
  desc: { fr: string; en: string };
}

const SLIDES: SlideText[] = [
  {
    eyebrow: { fr: "LA CONFIANCE D'ABORD", en: 'TRUST COMES FIRST' },
    title: {
      fr: 'Des garages certifiés,\npas des inconnus.',
      en: 'Certified garages,\nnot strangers.',
    },
    desc: {
      fr: 'Chaque garage CarLink est vérifié sur place : adresse, équipement, expérience. Vous voyez les avis vérifiés des vrais clients — pas du remplissage.',
      en: 'Every CarLink garage is checked on site: address, gear, experience. You see verified reviews from real customers — no filler.',
    },
  },
  {
    eyebrow: { fr: 'PLUS DE DEVINETTES', en: 'NO MORE GUESSWORK' },
    title: {
      fr: 'Comparez les devis\navant de payer.',
      en: 'Compare quotes\nbefore you pay.',
    },
    desc: {
      fr: "Décrivez le problème une fois, recevez plusieurs devis détaillés. Pièces, main d'œuvre, délai — tout est écrit noir sur blanc, sans surprise au moment de régler.",
      en: 'Describe the issue once, get several detailed quotes back. Parts, labor, lead time — written down, so there are no surprises when you settle the bill.',
    },
  },
  {
    eyebrow: { fr: 'VOUS GARDEZ LA MAIN', en: 'YOU STAY IN CONTROL' },
    title: {
      fr: 'Suivez la réparation,\nétape par étape.',
      en: 'Follow the repair,\nstep by step.',
    },
    desc: {
      fr: 'Photos avant / pendant / après, étapes validées, notifications à chaque changement. Vous savez où en est votre véhicule — même sans appeler le garage.',
      en: 'Photos before / during / after, validated stages, a notification at each change. You know exactly where your vehicle is — without ever calling the garage.',
    },
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const [lang, setLang] = useState<Lang>('fr');
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<SlideText>>(null);

  const isLast = index === SLIDES.length - 1;

  const goNext = () => {
    if (!isLast) {
      const next = index + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    } else {
      router.push('/(auth)/role-choice');
    }
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== index) setIndex(newIndex);
  };

  const renderSlide = ({ item, index: i }: { item: SlideText; index: number }) => (
    <View style={[s.page, { width: SCREEN_WIDTH }]}>
      <View style={s.stage}>
        {i === 0 ? <GarageIllus /> : null}
        {i === 1 ? <QuotesIllus /> : null}
        {i === 2 ? <TrackingIllus lang={lang} /> : null}
      </View>
      <View style={s.text}>
        <Text style={s.eyebrow}>
          {lang === 'fr' ? item.eyebrow.fr : item.eyebrow.en}
        </Text>
        <Text style={s.title}>
          {lang === 'fr' ? item.title.fr : item.title.en}
        </Text>
        <Text style={s.desc}>
          {lang === 'fr' ? item.desc.fr : item.desc.en}
        </Text>
      </View>
    </View>
  );

  const goSignIn = () => router.push('/(auth)/role-choice');
  const skip = () => router.push('/(auth)/role-choice');

  const ctaLabel = isLast
    ? lang === 'fr'
      ? 'Commencer'
      : 'Get started'
    : lang === 'fr'
      ? 'Suivant'
      : 'Next';

  const altLabel = isLast
    ? lang === 'fr'
      ? "J'ai déjà un compte"
      : 'I already have an account'
    : null;

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
          { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 6 },
        ]}
      >
        <View style={s.topBar}>
          <View style={s.langToggle}>
            {(['fr', 'en'] as Lang[]).map((l) => (
              <Pressable
                key={l}
                onPress={() => setLang(l)}
                style={[s.langBtn, lang === l && s.langBtnOn]}
                hitSlop={6}
              >
                <Text style={[s.langTxt, lang === l && s.langTxtOn]}>
                  {l.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={skip} hitSlop={8}>
            <Text style={s.skipTxt}>
              {lang === 'fr' ? 'Passer' : 'Skip'}
            </Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(_, i) => `slide-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          scrollEventThrottle={16}
          getItemLayout={(_, i) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * i,
            index: i,
          })}
          style={s.list}
        />

        <View style={[s.footer, isLast && s.footerLast]}>
          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[s.dot, i === index && s.dotOn]}
              />
            ))}
          </View>
          <Button
            label={ctaLabel}
            onPress={goNext}
            size="md"
            trailingIcon={ArrowRight}
            style={isLast ? s.ctaLast : s.cta}
            fullWidth={isLast}
          />
        </View>

        {altLabel ? (
          <Pressable onPress={goSignIn} hitSlop={8} style={s.altWrap}>
            <Text style={s.altTxt}>{altLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function GarageIllus() {
  return (
    <View style={ill.stage1}>
      <View style={ill.card1}>
        <View style={ill.row}>
          <View style={ill.avatar}>
            <Wrench size={18} color="#1F2937" strokeWidth={2.2} />
          </View>
          <View style={ill.meta}>
            <Text style={ill.name} numberOfLines={1}>
              Garage Étoile · Bo…
            </Text>
            <View style={ill.starRow}>
              <Star size={10} color="#C97A0E" fill="#C97A0E" />
              <Text style={ill.sub}> 4.8 · 142 avis</Text>
            </View>
          </View>
          <View style={ill.stamp}>
            <Check size={16} color="#fff" strokeWidth={3} />
          </View>
        </View>
        <View style={ill.tags}>
          <View style={[ill.tag, ill.tagOk]}>
            <Check size={10} color="#186B3B" strokeWidth={3} />
            <Text style={ill.tagOkTxt}>Pièces d'origine</Text>
          </View>
          <View style={[ill.tag, ill.tagOk]}>
            <Check size={10} color="#186B3B" strokeWidth={3} />
            <Text style={ill.tagOkTxt}>Sur place 2024</Text>
          </View>
        </View>
      </View>

      <View style={ill.mini}>
        <View style={ill.miniAv}>
          <Text style={ill.miniAvTxt}>JE</Text>
        </View>
        <View style={ill.miniMeta}>
          <Text style={ill.miniName}>Jules Etoga</Text>
          <Text style={ill.miniSub}>« Service rapide et pro »</Text>
        </View>
        <Text style={ill.miniStars}>★★★★★</Text>
      </View>
    </View>
  );
}

function QuotesIllus() {
  return (
    <View style={ill.stage2}>
      <View style={[ill.quote, ill.quoteA]}>
        <View style={ill.qHead}>
          <Text style={ill.qName}>Garage Étoile</Text>
          <View style={ill.qBest}>
            <Text style={ill.qBestTxt}>MEILLEUR PRIX</Text>
          </View>
        </View>
        <Text style={ill.qPrice}>
          38 500 <Text style={ill.qUnit}>FCFA</Text>
        </Text>
        <Text style={ill.qMeta}>Plaquettes + main d'œuvre · 2 j</Text>
      </View>

      <View style={[ill.quote, ill.quoteB]}>
        <Text style={ill.qName}>Auto Service Akwa</Text>
        <Text style={ill.qPrice}>
          45 000 <Text style={ill.qUnit}>FCFA</Text>
        </Text>
        <Text style={ill.qMeta}>Plaquettes + disque · 3 j</Text>
      </View>

      <View style={[ill.quote, ill.quoteC]}>
        <Text style={ill.qName}>Méca+ Bonabéri</Text>
        <Text style={ill.qPrice}>
          52 000 <Text style={ill.qUnit}>FCFA</Text>
        </Text>
        <Text style={ill.qMeta}>Diagnostic complet · 2 j</Text>
      </View>
    </View>
  );
}

function TrackingIllus({ lang }: { lang: Lang }) {
  const steps = [
    { label: lang === 'fr' ? 'Reçu' : 'Received', state: 'done' as const },
    { label: 'Diag', state: 'done' as const },
    { label: lang === 'fr' ? 'Réparation' : 'Repair', state: 'now' as const },
    { label: lang === 'fr' ? 'Livraison' : 'Pick-up', state: 'upcoming' as const },
  ];
  return (
    <View style={ill.stage3}>
      <View style={ill.trackCard}>
        <View style={ill.trackHead}>
          <Text style={ill.trackLabel}>
            {lang === 'fr' ? 'RÉPARATION EN COURS' : 'REPAIR IN PROGRESS'}
          </Text>
          <Text style={ill.trackPct}>62 %</Text>
        </View>
        <View style={ill.trackBar}>
          <View style={ill.trackBarFill} />
        </View>
        <View style={ill.trackSteps}>
          {steps.map((st) => (
            <View key={st.label} style={ill.step}>
              <View
                style={[
                  ill.stepDot,
                  st.state === 'done' && ill.stepDotDone,
                  st.state === 'now' && ill.stepDotNow,
                ]}
              >
                {st.state === 'done' ? (
                  <Check size={10} color="#fff" strokeWidth={3} />
                ) : null}
              </View>
              <Text
                style={[
                  ill.stepLbl,
                  (st.state === 'done' || st.state === 'now') && ill.stepLblOn,
                ]}
              >
                {st.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={ill.photos}>
        <View style={[ill.photo, ill.photoBefore]}>
          <Image
            source={{ uri: 'https://i.pinimg.com/736x/e2/d2/ac/e2d2ac66983e34260dcfb2ab86e0d8d1.jpg' }}
            style={ill.photoImg}
            resizeMode="cover"
          />
          <Text style={ill.photoTxt}>AVANT</Text>
        </View>
        <View style={[ill.photo, ill.photoNow]}>
          <Image
            source={{ uri: 'https://i.pinimg.com/736x/46/88/38/468838ed64e43b945aab1ff701f2763a.jpg' }}
            style={ill.photoImg}
            resizeMode="cover"
          />
          <Camera
            size={14}
            color="#fff"
            strokeWidth={2}
            style={ill.photoIcon}
          />
          <Text style={ill.photoTxt}>EN COURS</Text>
        </View>
        <View style={[ill.photo, ill.photoAfter]}>
          <Image
            source={{ uri: 'https://i.pinimg.com/1200x/1b/0b/3f/1b0b3ff4e2de85fa1936e94a579f7249.jpg' }}
            style={ill.photoImg}
            resizeMode="cover"
          />
          <Text style={ill.photoTxt}>APRÈS</Text>
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 22,
  },
  list: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: 22,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    padding: 3,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  langBtnOn: {
    backgroundColor: '#C8102E',
  },
  langTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.4,
  },
  langTxtOn: {
    color: '#fff',
  },
  skipTxt: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    fontWeight: '600',
  },
  stage: {
    flex: 1.05,
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  text: {
    gap: 8,
    marginBottom: 16,
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
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  desc: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 22,
  },
  footerLast: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  dotOn: {
    width: 22,
    backgroundColor: '#C8102E',
  },
  cta: {
    paddingHorizontal: 18,
    minWidth: 140,
  },
  ctaLast: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: '100%',
  },
  altWrap: {
    alignSelf: 'center',
    paddingVertical: 10,
    marginTop: 2,
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

const ill = StyleSheet.create({
  stage1: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  card1: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    width: 240,
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 18,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EAEDF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3F4A52',
  },
  stamp: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C8102E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C8102E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagOk: {
    backgroundColor: '#E5F4EC',
  },
  tagOkTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: '#186B3B',
    letterSpacing: 0.1,
  },
  mini: {
    position: 'absolute',
    bottom: '6%',
    right: '4%',
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    transform: [{ rotate: '4deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  miniAv: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2B6CB0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  miniMeta: {
    flex: 1,
    minWidth: 0,
  },
  miniName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1F2937',
  },
  miniSub: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#7A828D',
    marginTop: 1,
  },
  miniStars: {
    color: '#C97A0E',
    fontSize: 10,
    letterSpacing: 0.5,
  },

  stage2: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  quote: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 14,
  },
  quoteA: {
    top: '4%',
    left: '4%',
    transform: [{ rotate: '-3deg' }],
    borderLeftWidth: 3,
    borderLeftColor: '#C8102E',
    zIndex: 3,
  },
  quoteB: {
    top: '36%',
    right: '2%',
    transform: [{ rotate: '2.5deg' }],
    zIndex: 2,
    opacity: 0.96,
  },
  quoteC: {
    bottom: '4%',
    left: '8%',
    transform: [{ rotate: '-1.5deg' }],
    zIndex: 1,
    opacity: 0.8,
  },
  qHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  qName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.05,
  },
  qBest: {
    backgroundColor: '#C8102E',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  qBestTxt: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  qPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  qUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3F4A52',
  },
  qMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7A828D',
    marginTop: 4,
  },

  stage3: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  trackCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    width: '92%',
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 14,
  },
  trackHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trackLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C8102E',
    letterSpacing: 1.1,
  },
  trackPct: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  trackBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#F1F3F5',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  trackBarFill: {
    height: '100%',
    width: '62%',
    backgroundColor: '#C8102E',
    borderRadius: 999,
  },
  trackSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E4E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#C8102E',
  },
  stepDotNow: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#C8102E',
  },
  stepLbl: {
    fontSize: 9,
    fontWeight: '600',
    color: '#7A828D',
    letterSpacing: 0.2,
  },
  stepLblOn: {
    color: '#1F2937',
  },

  photos: {
    flexDirection: 'row',
    gap: 10,
    width: '94%',
    maxWidth: 320,
  },
  photo: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 6,
  },
  photoBefore: {
    backgroundColor: '#5A4434',
  },
  photoNow: {
    backgroundColor: '#3A4450',
    transform: [{ scale: 1.05 }],
    borderWidth: 2,
    borderColor: '#C8102E',
    zIndex: 2,
  },
  photoAfter: {
    backgroundColor: '#3A4E42',
    opacity: 0.75,
  },
  photoTxt: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  photoIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    opacity: 0.85,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
});
