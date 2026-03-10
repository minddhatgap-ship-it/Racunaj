export const colors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  secondary: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  
  // FURS colors
  fursOrange: '#FF6B35',
  fursBlue: '#004E89',
  fursGreen: '#00A878',
  
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  
  border: '#334155',
  borderLight: '#475569',
  
  success: '#10B981',
  error: '#EF4444',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};
