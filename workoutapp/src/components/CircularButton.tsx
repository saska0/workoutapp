import { Pressable, StyleSheet, ViewStyle, Animated, View } from 'react-native'
import { useRef } from 'react'
import { Feather } from '@expo/vector-icons'
import { colors } from '../theme';

type CircularButtonProps = {
  iconName: keyof typeof Feather.glyphMap
  onPress: () => void
  style?: ViewStyle
  backgroundColor?: string
  iconColor?: string
  size?: number
  disabled?: boolean
  testID?: string
}

export default function CircularButton({ 
  iconName,
  onPress, 
  style, 
  backgroundColor = colors.background.secondary,
  iconColor = colors.text.primary,
  size = 60,
  disabled = false,
  testID
}: CircularButtonProps) {
  const buttonOffsetX = useRef(new Animated.Value(0)).current
  const buttonOffsetY = useRef(new Animated.Value(0)).current

  const handlePressIn = () => {
    if (disabled) return
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
    if (disabled) return
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

  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
    },
    style
  ]

  const shadowStyle = [
    styles.shadow,
    {
      borderRadius: size / 2,
    }
  ]

  const buttonStyle = [
    styles.button,
    {
      backgroundColor: disabled ? colors.button.disabled : backgroundColor,
      borderRadius: size / 2,
      width: size,
      height: size,
    }
  ]

  const iconSize = Math.floor(size * 0.4) // Icon size is 40% of button size

  return (
    <View style={containerStyle}>
      {/* Shadow/Border Layer - stays in place */}
      <View style={shadowStyle} />
      
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
          onPress={disabled ? undefined : onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={buttonStyle}
          disabled={disabled}
          testID={testID}
        >
          <Feather 
            name={iconName} 
            size={iconSize} 
            color={disabled ? colors.text.placeholder : iconColor} 
          />
        </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 5,
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: colors.border.primary,
    zIndex: 1,
  },
  buttonWrapper: {
    zIndex: 2,
  },
  button: {
    borderWidth: 3,
    borderColor: colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
