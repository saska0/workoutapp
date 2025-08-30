import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, typography } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_SWIPE_DISTANCE = SCREEN_WIDTH * 0.35;
const SWIPE_THRESHOLD = MAX_SWIPE_DISTANCE * 0.95;
// Do not capture gestures starting at the very left edge on iOS
const IOS_BACK_GESTURE_EXCLUDE = 30; // px

interface SwipeableRowProps {
  onActivate: () => void;
  children: React.ReactNode;
  isSelected?: boolean;
}

export default function SwipeableRow({ onActivate, children, isSelected = false }: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const panGesture = Gesture.Pan()
    .hitSlop(Platform.OS === 'ios' ? { left: -IOS_BACK_GESTURE_EXCLUDE } : undefined)
    .onStart(() => {
      // Reset position at start of gesture
    })
    .onUpdate((event) => {
      // Only allow left swipe (negative values) and limit to max distance
      if (event.translationX <= 0) {
        translateX.value = Math.max(event.translationX, -MAX_SWIPE_DISTANCE);
      }
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        // Activate action - swipe far enough to the left
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
          mass: 0.8,
          overshootClamping: true,
        });
        runOnJS(onActivate)();
      } else {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
          mass: 0.8,
          overshootClamping: true,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isSelected ? colors.button.activated : colors.button.deactivated,
      opacity: 1,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateX.value) / MAX_SWIPE_DISTANCE;
    const opacity = interpolate(progress, [0, 0.3, 1], [0, 0.5, 1]);
    
    return {
      opacity,
    };
  });

  return (
    <View style={styles.swipeContainer}>
      <Animated.View style={[styles.indicator, indicatorStyle]}>
        <Animated.Text style={[styles.indicatorText, textStyle]}>
          {isSelected ? 'DESELECT' : 'SELECT'}
        </Animated.Text>
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[
          styles.rowContainer, 
          isSelected ? styles.selectedRowContainer : styles.unselectedRowContainer,
          animatedStyle
        ]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: MAX_SWIPE_DISTANCE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  indicatorText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
  rowContainer: {
    backgroundColor: colors.background.secondary,
    zIndex: 1,
  },
  selectedRowContainer: {
    backgroundColor: colors.background.primary,
  },
  unselectedRowContainer: {
    backgroundColor: colors.background.secondary,
  },
});
