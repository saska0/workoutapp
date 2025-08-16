import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { colors, typography } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface MenuRowProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  isSelected?: boolean;
}

export default function MenuRow({ title, onPress, style, isSelected = false }: MenuRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, style, pressed && styles.pressed]}>
      <Text style={[styles.title, isSelected ? styles.selectedTitle : styles.unselectedTitle]}>{title}</Text>
    </Pressable>
  );
}

const ROW_SIZE = 60;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_SIZE,
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginVertical: 0,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
  },
  selectedTitle: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  unselectedTitle: {
    color: colors.text.secondary,
  },
});
