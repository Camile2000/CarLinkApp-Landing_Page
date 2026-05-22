/**
 * Legacy alias of the design tokens — kept so existing screens compile
 * while we migrate every consumer to the new `theme` module.
 */
import {
  brand,
  border,
  fg,
  bg,
  palette,
  semantic,
  spacing as themeSpacing,
  radius as themeRadius,
  shadow,
} from './theme';

export const colors = {
  red: brand.red,
  slate: brand.slate,
  navy: brand.navy,
  navyDeep: palette.navy[900],
  paper: brand.paper,
  white: palette.neutral[0],
  black: palette.neutral[900],
  border: border.subtle,
  muted: fg.muted,
  success: semantic.success,
  error: semantic.danger,
  warning: semantic.warning,
  info: semantic.info,
  disabled: palette.neutral[400],
  bgPage: bg.page,
  bgSurface: bg.surface,
} as const;

export const shadows = {
  sm: shadow.xs,
  md: shadow.sm,
  lg: shadow.md,
} as const;

export const spacing = {
  0: themeSpacing[0],
  1: themeSpacing[1],
  2: themeSpacing[2],
  3: themeSpacing[3],
  4: themeSpacing[4],
  5: themeSpacing[5],
  6: themeSpacing[6],
  7: 28,
  8: themeSpacing[8],
  9: 36,
  10: themeSpacing[10],
  12: themeSpacing[12],
} as const;

export const radius = {
  xs: 4,
  sm: themeRadius.sm,
  md: themeRadius.md,
  lg: themeRadius.lg,
  full: themeRadius.pill,
} as const;
