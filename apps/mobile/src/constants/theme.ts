/**
 * CarLink Design System — source of truth.
 * Mirrors packages/shared/design/colors_and_type.css.
 * Components must reference these tokens, never hardcode hex.
 */

export const palette = {
  red: {
    50: '#FCE9EC',
    100: '#F6C2CA',
    200: '#EE94A2',
    300: '#E26678',
    400: '#D64152',
    500: '#C8102E',
    600: '#A60E27',
    700: '#840B1F',
    800: '#620818',
    900: '#410510',
  },
  slate: {
    50: '#EEF0F2',
    100: '#D5DADD',
    200: '#BAC1C6',
    300: '#9AA3AA',
    400: '#7A8590',
    500: '#5C6873',
    600: '#3F4A52',
    700: '#2F383F',
    800: '#1F262B',
    900: '#131820',
  },
  navy: {
    50: '#EAEDF1',
    100: '#C9D1DB',
    200: '#A2AEBE',
    300: '#7A8BA0',
    400: '#556B85',
    500: '#344C68',
    600: '#243750',
    700: '#1F2937',
    800: '#141B26',
    900: '#0A0E15',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F1F3F5',
    200: '#E4E7EB',
    300: '#CBD0D6',
    400: '#A2AAB3',
    500: '#7A828D',
    600: '#5C6470',
    700: '#3F4651',
    800: '#262B33',
    900: '#11141A',
  },
} as const;

export const brand = {
  red: palette.red[500],
  slate: palette.slate[600],
  navy: palette.navy[700],
  paper: palette.neutral[50],
} as const;

export const semantic = {
  success: '#1F8A4C',
  successSoft: '#E5F4EC',
  warning: '#C97A0E',
  warningSoft: '#FCEFD9',
  danger: brand.red,
  dangerSoft: palette.red[50],
  info: '#2B6CB0',
  infoSoft: '#E5EFF9',
} as const;

export const bg = {
  page: palette.neutral[50],
  surface: palette.neutral[0],
  sunken: palette.neutral[100],
  inverted: brand.navy,
} as const;

export const fg = {
  strong: brand.navy,
  default: brand.slate,
  muted: palette.neutral[500],
  subtle: palette.neutral[400],
  onPrimary: palette.neutral[0],
  onInverted: palette.neutral[0],
} as const;

export const border = {
  subtle: palette.neutral[200],
  default: palette.neutral[300],
  strong: brand.slate,
  accent: brand.red,
} as const;

export const accent = {
  base: brand.red,
  hover: palette.red[600],
  press: palette.red[700],
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const;

export const shadow = {
  xs: {
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 36,
    elevation: 12,
  },
  red: {
    shadowColor: '#C8102E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const typography = {
  family: {
    sans: 'Inter, System',
    mono: 'Menlo, monospace',
  },
  size: {
    display: 48,
    h1: 36,
    h2: 28,
    h3: 22,
    h4: 18,
    body: 16,
    bodySm: 14,
    label: 13,
    caption: 12,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '800',
  },
  lineHeight: {
    tight: 1.15,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.65,
  },
  tracking: {
    tight: -0.5,
    snug: -0.25,
    wide: 0.3,
    caps: 1,
  },
} as const;

export const motion = {
  duration: {
    fast: 120,
    base: 200,
    slow: 320,
  },
} as const;
