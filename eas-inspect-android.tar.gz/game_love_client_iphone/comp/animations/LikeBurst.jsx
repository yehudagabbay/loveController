import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

const PARTICLES = [
  { x: -20, y: -28, rotate: '-18deg', scale: 0.86, delay: 0 },
  { x: -8, y: -40, rotate: '10deg', scale: 0.72, delay: 18 },
  { x: 14, y: -34, rotate: '18deg', scale: 0.9, delay: 32 },
  { x: 22, y: -18, rotate: '28deg', scale: 0.74, delay: 54 },
  { x: -24, y: -12, rotate: '-30deg', scale: 0.68, delay: 70 },
];

export default function LikeBurst({
  triggerKey = 0,
  icon = '\u2661',
  iconStyle,
}) {
  const iconScale = useRef(new Animated.Value(1)).current;
  const glowScale = useRef(new Animated.Value(0.45)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const particleProgress = useRef(
    PARTICLES.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (!triggerKey) return;

    iconScale.stopAnimation();
    glowScale.stopAnimation();
    glowOpacity.stopAnimation();

    iconScale.setValue(0.84);
    glowScale.setValue(0.45);
    glowOpacity.setValue(0.22);
    particleProgress.forEach((value) => {
      value.stopAnimation();
      value.setValue(0);
    });

    Animated.parallel([
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.16,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 4,
          tension: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(glowScale, {
          toValue: 1.18,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      ...particleProgress.map((value, index) =>
        Animated.sequence([
          Animated.delay(PARTICLES[index].delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, [glowOpacity, glowScale, iconScale, particleProgress, triggerKey]);

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
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
          outputRange: [0.35, 1, particle.scale],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.18, 1],
          outputRange: [0, 1, 0],
        });

        return (
          <Animated.Text
            key={`particle-${index}`}
            style={[
              styles.particle,
              {
                opacity,
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                  { rotate: particle.rotate },
                ],
              },
            ]}
          >
            {'\u2665'}
          </Animated.Text>
        );
      })}

      <Animated.Text
        style={[
          styles.icon,
          iconStyle,
          {
            transform: [{ scale: iconScale }],
          },
        ]}
      >
        {icon}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  glow: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 97, 136, 0.24)',
  },
  icon: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.96)',
    fontWeight: '800',
    letterSpacing: 0,
  },
  particle: {
    position: 'absolute',
    fontSize: 10,
    color: '#FF7AA2',
    fontWeight: '900',
  },
});
