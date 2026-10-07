import { motion } from '@juandavidfuentes/indomitox-shared/tokens';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

/**
 * Elemento táctil que se encoge con un resorte al presionarlo (MASTER §6: 0,95–0,98).
 * Si el sistema pide reducir el movimiento, no se anima (queda el cambio de opacidad).
 */
export function PressableScale({
  children,
  style,
  className,
  pressedScale = 0.96,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  pressedScale?: number;
}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        {...props}
        className={`active:opacity-90 ${className ?? ''}`}
        onPressIn={(event) => {
          if (!reduceMotion) scale.set(withSpring(pressedScale, motion.spring));
          props.onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(withSpring(1, motion.spring));
          props.onPressOut?.(event);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
