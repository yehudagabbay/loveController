import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

const PARTICLES = [
  { x: 0, y: -76, rotate: '0deg', scale: 2.2, delay: 0, glyph: '\u2665' },
  { x: -52, y: -56, rotate: '-18deg', scale: 1.84, delay: 24, glyph: '\u2665' },
  { x: 52, y: -56, rotate: '18deg', scale: 1.84, delay: 24, glyph: '\u2665' },
  { x: -68, y: -12, rotate: '-24deg', scale: 1.48, delay: 54, glyph: '\u2726' },
  { x: 68, y: -12, rotate: '24deg', scale: 1.48, delay: 54, glyph: '\u2726' },
  { x: -28, y: -92, rotate: '-8deg', scale: 1.64, delay: 36, glyph: '\u2665' },
  { x: 28, y: -92, rotate: '8deg', scale: 1.64, delay: 36, glyph: '\u2665' },
];

export default function LoveBurst({
  triggerKey = 0,
  icon = '\u2661\u2661',
  iconStyle,
}) {
  const iconScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(0.2)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const centerScale = useRef(new Animated.Value(0.4)).current;
  const centerOpacity = useRef(new Animated.Value(0)).current;
  const particleProgress = useRef(
    PARTICLES.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (!triggerKey) return;

    iconScale.stopAnimation();
    ringScale.stopAnimation();
    ringOpacity.stopAnimation();
    centerScale.stopAnimation();
    centerOpacity.stopAnimation();

    iconScale.setValue(0.8);
    ringScale.setValue(0.2);
    ringOpacity.setValue(0.32);
    centerScale.setValue(0.4);
    centerOpacity.setValue(0.88);

    particleProgress.forEach((value) => {
      value.stopAnimation();
      value.setValue(0);
    });

    Animated.parallel([
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.24,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 4,
          tension: 170,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.9,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(centerScale, {
          toValue: 1.9,
          duration: 170,
          easing: Easing.out(Easing.back(1.8)),
          useNativeDriver: true,
        }),
        Animated.timing(centerOpacity, {
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
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, [
    centerOpacity,
    centerScale,
    iconScale,
    particleProgress,
    ringOpacity,
    ringScale,
    triggerKey,
  ]);

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      <Animated.Text
        style={[
          styles.centerHeart,
          {
            opacity: centerOpacity,
            transform: [{ scale: centerScale }],
          },
        ]}
      >
        {'\u2665'}
      </Animated.Text>

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
          inputRange: [0, 0.28, 1],
          outputRange: [0.3, 1.12, particle.scale],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.15, 0.85, 1],
          outputRange: [0, 1, 0.9, 0],
        });

        return (
          <Animated.Text
            key={`particle-${index}`}
            style={[
              styles.particle,
              particle.glyph === '\u2726' && styles.sparkle,
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
            {particle.glyph}
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
  ring: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 128, 160, 0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255, 214, 224, 0.58)',
  },
  centerHeart: {
    position: 'absolute',
    fontSize: 40,
    color: '#FF4F87',
    fontWeight: '900',
    textShadowColor: 'rgba(255,255,255,0.28)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  icon: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.98)',
    fontWeight: '900',
    letterSpacing: -1,
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
    color: '#FF79A8',
    fontWeight: '900',
  },
  sparkle: {
    fontSize: 22,
    color: '#FFD166',
  },
});
