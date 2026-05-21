export const colors = {
  red: '#C8102E',          // CTA, brand, erreurs
  slate: '#3F4A52',        // texte secondaire
  navy: '#1F2937',         // fond hero
  navyDeep: '#0B1F3A',     // fond app
  paper: '#F9FAFB',        // fond card
  white: '#FFFFFF',
  black: '#000000',
  border: '#E5E7EB',
  muted: '#9DB2CE',
  success: '#5FD0A0',
  error: '#C8102E',
  warning: '#F59E0B',
  info: '#3B82F6',
  disabled: '#9CA3AF',
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;
