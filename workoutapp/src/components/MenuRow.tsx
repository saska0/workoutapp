import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, Dimensions, TouchableOpacity } from 'react-native';
import { colors, typography } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface MenuRowProps {
  title: string;
  onPress: () => void;
  onMenuPress?: () => void;
  showMenuIcon?: boolean; // visual-only menu dots when onMenuPress is not provided
  style?: ViewStyle;
  isSelected?: boolean;
  rightText?: string; // optional right-aligned text
}

export default function MenuRow({ title, onPress, onMenuPress, showMenuIcon = false, style, isSelected = false, rightText }: MenuRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, style, pressed && styles.pressed]}>
      <Text style={[styles.title, isSelected ? styles.selectedTitle : styles.unselectedTitle]}>{title}</Text>
      {rightText ? (
        <Text style={[styles.rightText, isSelected ? styles.selectedRightText : styles.unselectedRightText]} numberOfLines={1}>
          {rightText}
        </Text>
      ) : onMenuPress ? (
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <Text style={[styles.menuIcon, isSelected ? styles.selectedMenuIcon : styles.unselectedMenuIcon]}>⋯</Text>
        </TouchableOpacity>
      ) : showMenuIcon ? (
        <Text style={[styles.menuIcon, styles.menuIconVisualOnly, isSelected ? styles.selectedMenuIcon : styles.unselectedMenuIcon]}>⋯</Text>
      ) : null}
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
  rightText: {
    maxWidth: SCREEN_WIDTH * 0.4,
    textAlign: 'right',
    marginLeft: 8,
  },
  selectedTitle: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.bold,
  },
  unselectedTitle: {
    color: colors.text.secondary,
  },
  selectedRightText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  unselectedRightText: {
    color: colors.text.secondary,
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  menuIcon: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  menuIconVisualOnly: {
    padding: 8,
    marginLeft: 8,
    opacity: 0.7,
  },
  selectedMenuIcon: {
    color: colors.text.primary,
  },
  unselectedMenuIcon: {
    color: colors.text.secondary,
  },
});
