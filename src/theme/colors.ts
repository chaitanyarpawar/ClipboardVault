export const lightTheme = {
  colors: {
    primary: '#6366F1',
    accent: '#10B981',
    background: '#F9FAFB',
    surface: 'rgba(255,255,255,0.12)',
    glass: 'rgba(255, 255, 255, 0.25)',
    text: '#111827',
    textSecondary: '#6B7280',
    border: 'rgba(255,255,255,0.3)',
    shadow: 'rgba(0,0,0,0.1)',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    card: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    glass: 24,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
  },
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#0F172A',
    surface: 'rgba(255,255,255,0.08)',
    glass: 'rgba(255, 255, 255, 0.1)',
    text: '#F9FAFB',
    textSecondary: '#94A3B8',
    border: 'rgba(255,255,255,0.2)',
    shadow: 'rgba(0,0,0,0.3)',
    card: '#1E293B',
  },
};

export type Theme = typeof lightTheme;