import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, typography } from '../theme';

type TileBlockProps = {
  title: string
  onPress: () => void
  style?: ViewStyle
}

export default function TileBlock({ title, onPress, style }: TileBlockProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, style, pressed && styles.pressed]}
    >
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.button.activated,
    padding: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    margin: 5,
    minHeight: 140,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
})