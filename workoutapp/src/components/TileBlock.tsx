import { Pressable, Text, StyleSheet, ViewStyle, Animated, View } from 'react-native'
import { useRef } from 'react'
import { Feather } from '@expo/vector-icons'
import { colors, typography } from '../theme';

type TileBlockProps = {
  title: string
  onPress: () => void
  style?: ViewStyle
  tileColor?: string
  iconName?: keyof typeof Feather.glyphMap
  iconColor?: string
}

export default function TileBlock({ 
  title, 
  onPress, 
  style, 
  tileColor = colors.button.tileDefault, 
  iconName = 'box',
  iconColor = colors.text.primary
}: TileBlockProps) {
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
          <View style={styles.iconContainer}>
            <Feather name={iconName} size={48} color={iconColor} />
          </View>
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
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
})