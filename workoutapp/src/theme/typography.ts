import { Platform } from 'react-native';

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    title_s: 24,
    title: 32,
    timer: 48,
    timerxl: 72,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: 'bold',
  },

  fontFamily: {
    monospace: Platform.OS === 'ios' ? 'Menlo' : Platform.OS === 'android' ? 'monospace' : 'Courier New',
  },
} as const;

export type AppTypography = typeof typography; 