import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Screen } from './Screen';
import { H1, BodySm, Eyebrow } from './Typography';
import {
  accent,
  border,
  fg,
  palette,
  radius,
  semantic,
  spacing,
} from '../../constants/theme';

type HeroTone = 'red' | 'navy' | 'success' | 'info';

interface AuthLayoutProps {
  onBack?: () => void;
  heroIcon?: LucideIcon;
  heroTone?: HeroTone;
  eyebrow?: string;
  title: string;
  lead?: string;
}

const HERO_COLORS: Record<HeroTone, { bg: string; icon: string }> = {
  red: { bg: palette.red[50], icon: accent.base },
  navy: { bg: palette.navy[50], icon: fg.strong },
  success: { bg: semantic.successSoft, icon: semantic.success },
  info: { bg: semantic.infoSoft, icon: semantic.info },
};

export function AuthLayout({
  onBack,
  heroIcon: HeroIcon,
  heroTone = 'red',
  eyebrow,
  title,
  lead,
  children,
}: PropsWithChildren<AuthLayoutProps>) {
  const hc = HERO_COLORS[heroTone];

  return (
    <Screen scroll>
      <View style={styles.container}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
            <BodySm color={accent.base} weight="600">
              ← Retour
            </BodySm>
          </Pressable>
        ) : null}

        {HeroIcon ? (
          <View style={[styles.hero, { backgroundColor: hc.bg }]}>
            <HeroIcon size={32} color={hc.icon} strokeWidth={1.75} />
          </View>
        ) : null}

        {eyebrow ? (
          <Eyebrow style={styles.eyebrow}>{eyebrow}</Eyebrow>
        ) : null}

        <H1 style={styles.title}>{title}</H1>

        {lead ? (
          <BodySm color={fg.muted} style={styles.lead}>
            {lead}
          </BodySm>
        ) : null}

        <View style={styles.form}>{children}</View>
      </View>
    </Screen>
  );
}

export const authStyles = StyleSheet.create({
  errorBanner: {
    backgroundColor: accent.base,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
  },
  divider: {
    height: 1,
    backgroundColor: border.subtle,
    marginVertical: spacing[4],
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[5],
  },
  fullButton: {
    alignSelf: 'stretch',
    marginTop: spacing[2],
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing[5],
  },
  hero: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  eyebrow: {
    marginBottom: spacing[2],
  },
  title: {
    marginBottom: spacing[2],
  },
  lead: {
    marginBottom: spacing[5],
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
});
