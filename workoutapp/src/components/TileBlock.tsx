import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native'

type TileBlockProps = {
  title: string
  onPress: () => void
  style?: ViewStyle
}

export default function TileBlock({ title, onPress, style }: TileBlockProps) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, style]}>
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#4a90e2',
    padding: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    margin: 5,
    minHeight: 140,
  },
  title: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '600',
  },
})