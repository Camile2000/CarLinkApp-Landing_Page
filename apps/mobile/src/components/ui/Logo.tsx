import React from 'react';
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { brand, fg, palette, typography } from '../../constants/theme';

type Tone = 'color' | 'white' | 'on-navy';

interface LogoProps {
  size?: number;
  tone?: Tone;
  showWordmark?: boolean;
  showTagline?: boolean;
  taglineColor?: string;
  style?: ViewStyle;
  markStyle?: ImageStyle;
}

const SOURCES = {
  color: require('../../../assets/logo-mark.png'),
  white: require('../../../assets/logo-mark-white.png'),
  'on-navy': require('../../../assets/logo-mark-on-navy.png'),
} as const;

export function Logo({
  size = 72,
  tone = 'color',
  showWordmark = false,
  showTagline = false,
  taglineColor,
  style,
  markStyle,
}: LogoProps) {
  const carColor = tone === 'color' ? brand.red : palette.neutral[0];
  const linkColor = tone === 'color' ? brand.navy : palette.neutral[0];
  const fallbackTagline = tone === 'color' ? fg.muted : 'rgba(255,255,255,0.65)';

  return (
    <View style={[styles.container, style]}>
      <Image
        source={SOURCES[tone]}
        style={[{ width: size, height: size }, styles.mark, markStyle]}
        resizeMode="contain"
      />
      {showWordmark ? (
        <Text style={styles.wordmark}>
          <Text style={{ color: carColor }}>Car</Text>
          <Text style={{ color: linkColor }}>Link</Text>
        </Text>
      ) : null}
      {showTagline ? (
        <Text style={[styles.tagline, { color: taglineColor ?? fallbackTagline }]}>
          Le lien de confiance auto
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    alignSelf: 'center',
  },
  wordmark: {
    fontSize: 32,
    fontWeight: typography.weight.black,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    fontWeight: typography.weight.medium,
    letterSpacing: 0,
  },
});
