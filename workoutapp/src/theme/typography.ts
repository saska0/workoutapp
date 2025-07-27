export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    title: 32,
    timer: 24,
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: 'bold',
  },
} as const;

export type AppTypography = typeof typography; 