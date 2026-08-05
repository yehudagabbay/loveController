// comp/game/AnimatedDeck.jsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from 'react-native';

const W = Math.min(
  520,
  Math.max(320, Math.round(Dimensions.get('window').width - 40)),
);

// שכבות החפיסה
const DECK_LAYERS = [
  { rotate: '-6deg', translate: -4, zIndex: 1, opacity: 0.85, scale: 0.92 },
  { rotate: '4deg', translate: -2, zIndex: 2, opacity: 0.95, scale: 0.96 },
  { rotate: '0deg', translate: 0, zIndex: 3, opacity: 1.0, scale: 1.0 },
];

const isValidImageSource = (source) =>
  typeof source === 'number' ||
  !!(source && typeof source === 'object' && typeof source.uri === 'string');

export default function AnimatedDeck({
  remainingCount,
  entryAnim,
  pulseAnim,
  flyOutAnim,
  pan,
  panResponder,
  logoSource,
  emptyTitle,
  emptySubtitle,
}) {
  return (
    <View style={styles.deckContainer}>
      {remainingCount > 0 ? (
        <View style={styles.cardStackWrapper}>
          {DECK_LAYERS.map((layer, index) => {
            const isVisible = remainingCount >= 3 - index;
            if (!isVisible && remainingCount < 3) return null;

            const isTopCard = index === 2;

            const animatedRotate = entryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', layer.rotate],
            });

            const spreadTranslateY = entryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, layer.translate],
            });

            const entrySlideUp = entryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            });

            const spreadScale = entryAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, layer.scale],
            });

            const breathTranslate = pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -5],
            });

            const flyTranslateY = isTopCard
              ? flyOutAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -180],
                })
              : 0;

            const flyRotate = isTopCard
              ? flyOutAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '20deg'],
                })
              : '0deg';

            const flyOpacity = isTopCard
              ? flyOutAnim.interpolate({
                  inputRange: [0, 0.6],
                  outputRange: [1, 0],
                })
              : 1;

            const baseTransforms = [
              {
                rotate:
                  isTopCard && flyOutAnim._value > 0
                    ? flyRotate
                    : animatedRotate,
              },
              { translateY: entrySlideUp },
              { translateY: spreadTranslateY },
              { translateY: breathTranslate },
              { translateY: flyTranslateY },
              { scale: spreadScale },
            ];

            const finalTransforms = isTopCard
              ? [...baseTransforms, { translateX: pan.x }, { translateY: pan.y }]
              : baseTransforms;

            return (
              <Animated.View
                key={index}
                {...(isTopCard ? panResponder.panHandlers : {})}
                style={[
                  styles.premiumCardBack,
                  {
                    zIndex: layer.zIndex,
                    opacity: isTopCard ? flyOpacity : layer.opacity,
                    transform: finalTransforms,
                  },
                ]}
              >
                <View style={styles.innerBorder}>
                  {isValidImageSource(logoSource) && (
                    <Image
                      source={logoSource}
                      style={styles.cardLogo}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </Animated.View>
            );
          })}

          <Animated.View
            style={[
              styles.countBadge,
              {
                transform: [
                  { scale: entryAnim },
                  {
                    translateY: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -3],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.countText}>{remainingCount}</Text>
          </Animated.View>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptySub}>{emptySubtitle}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  deckContainer: {
    height: W * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  cardStackWrapper: {
    position: 'relative',
    width: W * 0.65,
    height: W * 0.95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCardBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#2c3e50',
    borderWidth: 2,
    borderColor: '#E91E63',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34495e',
    overflow: 'hidden',
  },
  cardLogo: {
    width: '80%',
    height: '80%',
    opacity: 0.9,
  },
  countBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF4081',
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  countText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyBox: {
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySub: {
    fontSize: 15,
    color: '#666',
    marginTop: 5,
  },
});
