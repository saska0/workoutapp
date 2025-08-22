import React, { useRef } from 'react'
import { View, TextInput, StyleSheet, ViewStyle, TextInputProps, Animated } from 'react-native'
import { colors, typography } from '../theme'

export type NeoInputProps = TextInputProps & {
  containerStyle?: ViewStyle
  error?: boolean
}

export default function NeoInput({ containerStyle, error, style, ...rest }: NeoInputProps) {
  const offsetX = useRef(new Animated.Value(0)).current
  const offsetY = useRef(new Animated.Value(0)).current

  const handleFocus = () => {
    Animated.parallel([
      Animated.timing(offsetX, { toValue: 4, duration: 120, useNativeDriver: true }),
      Animated.timing(offsetY, { toValue: 4, duration: 120, useNativeDriver: true }),
    ]).start()
  }

  const handleBlur = () => {
    Animated.parallel([
      Animated.timing(offsetX, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(offsetY, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start()
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.shadow} />
      <Animated.View style={[styles.wrapper, { transform: [{ translateX: offsetX }, { translateY: offsetY }] }]}>
        <TextInput
          {...rest}
          onFocus={(e) => { handleFocus(); rest.onFocus?.(e) }}
          onBlur={(e) => { handleBlur(); rest.onBlur?.(e) }}
          placeholderTextColor={rest.placeholderTextColor ?? colors.text.placeholder}
          style={[
            styles.input,
            error && { borderColor: colors.input.borderError },
            style as any,
          ]}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
  wrapper: {
    zIndex: 2,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 3,
    borderColor: colors.border.primary,
  },
})
