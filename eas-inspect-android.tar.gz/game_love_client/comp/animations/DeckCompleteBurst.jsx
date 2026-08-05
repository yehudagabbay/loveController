import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const PARTICLES = [
  { x: 0, y: -240, glyph: '✨', scale: 2.7, delay: 0 },
  { x: 164, y: -168, glyph: '⭐', scale: 2.36, delay: 40 },
  { x: -164, y: -168, glyph: '⭐', scale: 2.36, delay: 40 },
  { x: 236, y: -20, glyph: '✨', scale: 2.04, delay: 80 },
  { x: -236, y: -20, glyph: '✨', scale: 2.04, delay: 80 },
  { x: 140, y: 140, glyph: '✦', scale: 1.84, delay: 120 },
  { x: -140, y: 140, glyph: '✦', scale: 1.84, delay: 120 },
  { x: 0, y: 204, glyph: '⭐', scale: 2.16, delay: 150 },
];

export default function DeckCompleteBurst({ triggerKey = 0 }) {
  const ringScale = useRef(new Animated.Value(0.2)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const labelScale = useRef(new Animated.Value(0.7)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const particleProgress = useRef(
    PARTICLES.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (!triggerKey) return;

    ringScale.setValue(0.2);
    ringOpacity.setValue(0.44);
    glowScale.setValue(0.5);
    glowOpacity.setValue(0.26);
    labelScale.setValue(0.7);
    labelOpacity.setValue(0);
    particleProgress.forEach((value) => {
      value.stopAnimation();
      value.setValue(0);
    });

    Animated.parallel([
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.7,
          duration: 820,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 820,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(glowScale, {
          toValue: 2.1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(labelScale, {
            toValue: 1.06,
            duration: 280,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(labelOpacity, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(420),
        Animated.timing(labelOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      ...particleProgress.map((value, index) =>
        Animated.sequence([
          Animated.delay(PARTICLES[index].delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 920,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, [
    glowOpacity,
    glowScale,
    labelOpacity,
    labelScale,
    particleProgress,
    ringOpacity,
    ringScale,
    triggerKey,
  ]);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {PARTICLES.map((particle, index) => {
        const progress = particleProgress[index];
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.x],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.y],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0.2, 1.1, particle.scale],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.15, 0.85, 1],
          outputRange: [0, 1, 0.92, 0],
        });

        return (
          <Animated.Text
            key={`deck-particle-${index}`}
            style={[
              styles.particle,
              {
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          >
            {particle.glyph}
          </Animated.Text>
        );
      })}

      <Animated.View
        style={[
          styles.badge,
          {
            opacity: labelOpacity,
            transform: [{ scale: labelScale }],
          },
        ]}
      >
        <Text style={styles.badgeTitle}>Done</Text>
        <Text style={styles.badgeStars}>✦ ✦ ✦</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 220, 120, 0.24)',
  },
  ring: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: 'rgba(255, 240, 190, 0.9)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  particle: {
    position: 'absolute',
    fontSize: 60,
    color: '#FFE082',
    textShadowColor: 'rgba(255,255,255,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 24,
    borderRadius: 44,
    backgroundColor: 'rgba(17, 24, 39, 0.82)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  badgeTitle: {
    color: '#FFF8E1',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  badgeStars: {
    color: '#FFD166',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
  },
});
