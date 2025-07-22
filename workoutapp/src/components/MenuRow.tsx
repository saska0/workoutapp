import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface MenuRowProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export default function MenuRow({ title, onPress, style }: MenuRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, style, pressed && styles.pressed]}>
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const ROW_SIZE = 66;

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
    color: '#fff',
    fontSize: 17,
  },
});
