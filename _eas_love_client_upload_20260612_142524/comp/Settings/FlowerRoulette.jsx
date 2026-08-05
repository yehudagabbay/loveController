import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

const logoSource = require('../../assets/images/logo1.png');

const FAST_SPIN_DURATION = 1500;
const SLOW_SPIN_DURATION = 8000;

const FlowerRoulette = ({ style, tapToSpin = false }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const currentAnimationRef = useRef(null);
  const loopAnimationRef = useRef(null);

  const stopAnimations = useCallback(() => {
    currentAnimationRef.current?.stop?.();
    loopAnimationRef.current?.stop?.();
    currentAnimationRef.current = null;
    loopAnimationRef.current = null;
  }, []);

  const startSlowLoop = useCallback(() => {
    spinValue.setValue(0);

    const slowLoop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: SLOW_SPIN_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loopAnimationRef.current = slowLoop;
    currentAnimationRef.current = slowLoop;
    slowLoop.start();
  }, [spinValue]);

  const restartSpin = useCallback(() => {
    stopAnimations();
    spinValue.setValue(0);

    const fastSpin = Animated.timing(spinValue, {
      toValue: 1,
      duration: FAST_SPIN_DURATION,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    });

    currentAnimationRef.current = fastSpin;
    fastSpin.start(({ finished }) => {
      if (!finished) {
        return;
      }
      startSlowLoop();
    });
  }, [spinValue, startSlowLoop, stopAnimations]);

  useEffect(() => {
    restartSpin();

    return () => {
      stopAnimations();
    };
  }, [restartSpin, stopAnimations]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const flowerImage = (
    <Animated.Image
      source={logoSource}
      resizeMode="contain"
      style={[style, { transform: [{ rotate: spin }] }]}
    />
  );

  if (!tapToSpin) {
    return flowerImage;
  }

  return (
    <Pressable onPress={restartSpin} hitSlop={10}>
      {flowerImage}
    </Pressable>
  );
};

export default FlowerRoulette;
