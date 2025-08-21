import { Pressable, Text, StyleSheet, ViewStyle, Animated, View } from 'react-native'
import { useRef } from 'react'
import { colors, typography } from '../theme';

type TileBlockProps = {
  title: string
  onPress: () => void
  style?: ViewStyle
  tileColor?: string
}

export default function TileBlock({ title, onPress, style, tileColor = colors.button.tileDefault }: TileBlockProps) {
  const tileOffsetX = useRef(new Animated.Value(0)).current
  const tileOffsetY = useRef(new Animated.Value(0)).current

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(tileOffsetX, {
        toValue: 6,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tileOffsetY, {
        toValue: 6,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(tileOffsetX, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tileOffsetY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start()
  }

  return (
    <View style={[styles.container, style]}>
      {/* Shadow/Border Layer - stays in place */}
      <View style={styles.shadow} />
      
      {/* Main Tile - animates down and right towards shadow */}
      <Animated.View
        style={[
          styles.tileWrapper,
          {
            transform: [
              { translateX: tileOffsetX },
              { translateY: tileOffsetY }
            ]
          }
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.tile, { backgroundColor: tileColor }]}
        >
          <Text style={styles.title}>{title}</Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 5,
    minHeight: 140,
  },
  shadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: colors.border.primary,
    borderRadius: 8,
    zIndex: 1,
  },
  tileWrapper: {
    flex: 1,
    zIndex: 2,
  },
  tile: {
    padding: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    borderWidth: 3,
    borderColor: colors.border.primary,
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