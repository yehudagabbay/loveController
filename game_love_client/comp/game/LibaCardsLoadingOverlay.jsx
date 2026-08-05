import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

import iconFamily from '../../assets/images/icons/family.png';
import iconFriends from '../../assets/images/icons/friends.png';
import iconFun from '../../assets/images/icons/fun.png';
import iconHome from '../../assets/images/icons/home.png';
import iconLove from '../../assets/images/icons/love.png';
import iconRelations from '../../assets/images/icons/relations.png';

const LOADING_ICONS = [
  iconLove,
  iconRelations,
  iconFun,
  iconFamily,
  iconFriends,
  iconHome,
];
const LOADING_ICON_INTERVAL_MS = 500;

export default function LibaCardsLoadingOverlay({ visible }) {
  const [iconIndex, setIconIndex] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    setIconIndex(0);
    pulse.setValue(0);
    spin.setValue(0);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 720,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 720,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    pulseLoop.start();
    spinLoop.start();
    const iconTimer = setInterval(() => {
      setIconIndex((current) => (current + 1) % LOADING_ICONS.length);
    }, LOADING_ICON_INTERVAL_MS);

    return () => {
      clearInterval(iconTimer);
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin, visible]);

  if (!visible) {
    return null;
  }

  const iconScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });
  const ringRotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={styles.overlay}
      pointerEvents="auto"
      accessibilityRole="progressbar"
      accessibilityLabel="Loading cards"
    >
      <View style={styles.bubble}>
        <Animated.View
          style={[
            styles.ring,
            { transform: [{ rotate: ringRotation }] },
          ]}
        />
        {LOADING_ICONS.map((iconSource, index) => (
          <Animated.Image
            key={index}
            source={iconSource}
            resizeMode="contain"
            style={[
              styles.icon,
              index === iconIndex ? styles.iconVisible : styles.iconHidden,
              {
                transform: [{ scale: iconScale }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 120,
    elevation: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,248,250,0.48)',
  },
  bubble: {
    width: 118,
    height: 118,
    borderRadius: 59,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(233,30,99,0.14)',
    borderTopColor: '#E91E63',
    borderRightColor: 'rgba(255,152,0,0.48)',
  },
  icon: {
    position: 'absolute',
    width: 70,
    height: 70,
  },
  iconVisible: {
    opacity: 1,
  },
  iconHidden: {
    opacity: 0,
  },
});
