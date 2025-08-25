import { Pressable, Text, StyleSheet, ViewStyle, Animated, View } from 'react-native'
import { useRef } from 'react'
import { colors, typography } from '../theme';

type WideButtonProps = {
  title: string
  onPress: () => void
  style?: ViewStyle
  backgroundColor?: string
  textColor?: string
}

export default function WideButton({ 
  title, 
  onPress, 
  style, 
  backgroundColor = colors.button.dark,
  textColor = colors.text.primary
}: WideButtonProps) {
  const buttonOffsetX = useRef(new Animated.Value(0)).current
  const buttonOffsetY = useRef(new Animated.Value(0)).current

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(buttonOffsetX, {
        toValue: 4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOffsetY, {
        toValue: 4,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(buttonOffsetX, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOffsetY, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const buttonStyle = [styles.button, { backgroundColor }]

  return (
    <View style={[styles.container, style]}>
      {/* Shadow/Border Layer - stays in place */}
      <View style={styles.shadow} />
      
      {/* Main Button - animates down and right towards shadow */}
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [
              { translateX: buttonOffsetX },
              { translateY: buttonOffsetY }
            ]
          }
        ]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={buttonStyle}
        >
          <Text
            style={[styles.title, { color: textColor }]}
          >
            {title}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 6,
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: colors.border.primary,
    borderRadius: 8,
    zIndex: 1,
  },
  buttonWrapper: {
    zIndex: 2,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 3,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
})
