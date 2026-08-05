import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

const PETALS = [
  { x: 0, y: -34, scale: 1.32, delay: 0 },
  { x: 28, y: -18, scale: 1.08, delay: 26 },
  { x: 28, y: 18, scale: 0.96, delay: 48 },
  { x: 0, y: 34, scale: 1.12, delay: 70 },
  { x: -28, y: 18, scale: 0.96, delay: 48 },
  { x: -28, y: -18, scale: 1.08, delay: 26 },
];

export default function SoftBloom({ triggerKey = 0, scale = 1 }) {
  const ringScale = useRef(new Animated.Value(0.3)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const coreScale = useRef(new Animated.Value(0.5)).current;
  const coreOpacity = useRef(new Animated.Value(0)).current;
  const petalProgress = useRef(PETALS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!triggerKey) return;

    ringScale.setValue(0.3);
    ringOpacity.setValue(0.34);
    coreScale.setValue(0.5);
    coreOpacity.setValue(0.95);
    petalProgress.forEach((value) => {
      value.stopAnimation();
      value.setValue(0);
    });

    Animated.parallel([
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.9,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 680,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(coreScale, {
          toValue: 1.35,
          duration: 220,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }),
        Animated.timing(coreOpacity, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      ...petalProgress.map((value, index) =>
        Animated.sequence([
          Animated.delay(PETALS[index].delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 760,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, [coreOpacity, coreScale, petalProgress, ringOpacity, ringScale, triggerKey]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.core,
          {
            opacity: coreOpacity,
            transform: [{ scale: coreScale }],
          },
        ]}
      />

      {PETALS.map((petal, index) => {
        const progress = petalProgress[index];
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, petal.x],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, petal.y],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.35, 1],
          outputRange: [0.25, 1, petal.scale],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 1, 0],
        });

        return (
          <Animated.View
            key={`petal-${index}`}
            style={[
              styles.petal,
              {
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 233, 173, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255, 243, 199, 0.72)',
  },
  core: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 247, 220, 0.95)',
  },
  petal: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#FDE68A',
    shadowColor: '#FFF7D6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});
