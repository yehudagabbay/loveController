import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(252, Math.max(218, SCREEN_WIDTH - 126));
const CENTER = WHEEL_SIZE / 2;
const WHEEL_TOP = 9;
const ORBIT_RADIUS = CENTER - 42;
const FULL_SPINS = 6;
const POINTER_ANGLE = -90;

const SEGMENT_COLORS = [
  '#4F46E5',
  '#0F766E',
  '#F97316',
  '#DB2777',
  '#16A34A',
  '#6366F1',
  '#D97706',
  '#0284C7',
  '#DC2626',
  '#65A30D',
  '#7C3AED',
  '#14B8A6',
];

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

export default function PlayerRouletteOverlay({
  visible,
  players,
  selectedIndex,
  onContinue,
  title,
  idleLabel,
  spinningLabel,
  selectedLabel,
  spinLabel,
  continueLabel,
  disableLabel,
  addPlayerLabel,
  maxPlayersReachedLabel,
  playerPlaceholder,
  onPlayersChange,
  onDisable,
  maxPlayers,
}) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pointerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const spinLoopsRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinTargetIndex, setSpinTargetIndex] = useState(null);

  const editablePlayers = useMemo(
    () => (Array.isArray(players) ? players : []),
    [players],
  );
  const activeSelectedIndex =
    Number.isInteger(spinTargetIndex) && spinTargetIndex >= 0 && spinTargetIndex < editablePlayers.length
      ? spinTargetIndex
      : Math.max(0, Math.min(selectedIndex || 0, Math.max(editablePlayers.length - 1, 0)));
  const selectedName =
    String(editablePlayers[activeSelectedIndex] || '').trim() ||
    `${playerPlaceholder} ${activeSelectedIndex + 1}`;
  const segmentAngle = editablePlayers.length ? 360 / editablePlayers.length : 360;
  const playerLimit =
    Number.isFinite(maxPlayers) && maxPlayers > 0 ? Math.floor(maxPlayers) : null;
  const reachedPlayerLimit = Boolean(playerLimit && editablePlayers.length >= playerLimit);
  const canAddPlayer = Boolean(onPlayersChange && !spinning && !reachedPlayerLimit);
  const addPlayerButtonLabel =
    reachedPlayerLimit && maxPlayersReachedLabel ? maxPlayersReachedLabel : addPlayerLabel;

  const chipPositions = useMemo(
    () =>
      editablePlayers.map((name, index) => {
        const angle = POINTER_ANGLE + index * segmentAngle + segmentAngle / 2;
        const point = polarToCartesian(CENTER, CENTER, ORBIT_RADIUS, angle);
        return { name, index, x: point.x, y: point.y };
      }),
    [editablePlayers, segmentAngle],
  );

  useEffect(() => {
    if (!visible || !editablePlayers.length) {
      spinLoopsRef.current.forEach((animation) => animation.stop());
      spinLoopsRef.current = [];
      spinAnim.stopAnimation();
      pointerAnim.stopAnimation();
      pulseAnim.stopAnimation();
      revealAnim.stopAnimation();
      spinAnim.setValue(0);
      pointerAnim.setValue(0);
      pulseAnim.setValue(0);
      revealAnim.setValue(0);
      setSpinTargetIndex(null);
      setReady(false);
      setSpinning(false);
      return;
    }

    setReady(false);
    setSpinning(false);
    spinAnim.setValue(0);
    pointerAnim.setValue(0);
    pulseAnim.setValue(0);
    revealAnim.setValue(0);
    setSpinTargetIndex(null);

    return () => {
      spinLoopsRef.current.forEach((animation) => animation.stop());
      spinLoopsRef.current = [];
      spinAnim.stopAnimation();
      pointerAnim.stopAnimation();
      pulseAnim.stopAnimation();
      revealAnim.stopAnimation();
    };
  }, [editablePlayers.length, pointerAnim, pulseAnim, revealAnim, spinAnim, visible]);

  const startSpin = (direction = 1) => {
    if (!visible || spinning || ready || !editablePlayers.length) return;

    const spinDirection = direction >= 0 ? 1 : -1;
    const targetIndex = Math.floor(Math.random() * editablePlayers.length);
    const selectedOffset = (targetIndex + 0.5) * segmentAngle;
    const spinTurns = FULL_SPINS + Math.floor(Math.random() * 2);
    const finalRotation = spinDirection * spinTurns * 360 - selectedOffset;
    const suspenseRotation = finalRotation - spinDirection * Math.min(64, segmentAngle * 0.72);
    const overshootRotation = finalRotation + spinDirection * Math.min(15, segmentAngle * 0.22);

    setReady(false);
    setSpinning(true);
    setSpinTargetIndex(targetIndex);
    revealAnim.setValue(0);
    Haptics.selectionAsync().catch(() => {});

    const pointerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pointerAnim, {
          toValue: 1,
          duration: 105,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pointerAnim, {
          toValue: 0,
          duration: 105,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 360,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 360,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    pointerLoop.start();
    pulseLoop.start();
    spinLoopsRef.current = [pointerLoop, pulseLoop];

    Animated.sequence([
      Animated.timing(spinAnim, {
        toValue: suspenseRotation,
        duration: 2500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(spinAnim, {
        toValue: overshootRotation,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(spinAnim, {
        toValue: finalRotation,
        friction: 5,
        tension: 72,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      pointerLoop.stop();
      pulseLoop.stop();
      spinLoopsRef.current = [];
      pointerAnim.setValue(0);
      pulseAnim.setValue(0);
      if (!finished) return;
      setSpinning(false);
      setReady(true);
      Animated.sequence([
        Animated.timing(pointerAnim, {
          toValue: 1,
          duration: 130,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pointerAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      Animated.spring(revealAnim, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !spinning && !ready && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 6,
        onPanResponderGrant: () => {
          if (spinning || ready) return;
          spinAnim.stopAnimation();
          spinAnim.setValue(0);
        },
        onPanResponderMove: (_, gesture) => {
          if (spinning || ready) return;
          const previewRotation = Math.max(-44, Math.min(44, gesture.dx * 0.65));
          spinAnim.setValue(previewRotation);
        },
        onPanResponderRelease: (_, gesture) => {
          if (spinning || ready) return;

          const movement = Math.abs(gesture.dx);
          if (movement > 18 || Math.abs(gesture.vx) > 0.15) {
            startSpin(gesture.dx || gesture.vx);
            return;
          }

          startSpin(1);
        },
        onPanResponderTerminate: () => {
          if (spinning || ready) return;
          Animated.spring(spinAnim, {
            toValue: 0,
            friction: 6,
            tension: 70,
            useNativeDriver: true,
          }).start();
        },
      }),
    [ready, segmentAngle, selectedIndex, editablePlayers.length, spinning, spinAnim, visible],
  );

  const rotation = spinAnim.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['-360deg', '0deg', '360deg'],
    extrapolate: 'extend',
  });

  const counterRotation = spinAnim.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['360deg', '0deg', '-360deg'],
    extrapolate: 'extend',
  });

  const pointerKick = pointerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-13deg'],
  });

  const pointerLift = pointerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const wheelScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.035],
  });

  const spinHaloOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.42],
  });

  const revealScale = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const revealOpacity = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  const handleContinue = () => {
    if (!ready) return;
    Haptics.selectionAsync().catch(() => {});
    onContinue?.(activeSelectedIndex);
  };

  const updatePlayerName = (index, value) => {
    if (spinning) return;
    const nextPlayers = [...editablePlayers];
    nextPlayers[index] = value;
    setReady(false);
    spinAnim.setValue(0);
    onPlayersChange?.(nextPlayers);
  };

  const addPlayer = () => {
    if (!canAddPlayer) {
      if (reachedPlayerLimit) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    setReady(false);
    spinAnim.setValue(0);
    onPlayersChange?.([...editablePlayers, '']);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        if (ready) handleContinue();
      }}
    >
      <View style={styles.backdrop}>
        <LinearGradient
          colors={['#FFF7ED', '#FFFFFF', '#EEF2FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.panel}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <Text style={styles.kicker}>LIBA</Text>
            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={styles.stage} {...panResponder.panHandlers}>
            <Animated.View
              style={[
                styles.selectionMarker,
                spinning && styles.selectionMarkerSpinning,
                ready && styles.selectionMarkerReady,
                {
                  transform: [
                    { translateY: pointerLift },
                    { rotate: pointerKick },
                  ],
                },
              ]}
            >
                <View style={styles.selectionMarkerLine} />
                <View style={styles.selectionMarkerDot} />
            </Animated.View>
            <Animated.View
              style={[
                styles.stageGlow,
                {
                  opacity: spinning ? spinHaloOpacity : 1,
                  transform: [{ scale: spinning ? wheelScale : 1 }],
                },
              ]}
            />
            {spinning && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.speedHalo,
                  {
                    opacity: spinHaloOpacity,
                    transform: [{ rotate: rotation }, { scale: wheelScale }],
                  },
                ]}
              />
            )}
            <View style={styles.orbitTrack} />
            <View style={styles.innerTrack} />

            <Animated.View style={[styles.accentOrbit, { transform: [{ rotate: rotation }, { scale: wheelScale }] }]}>
              {SEGMENT_COLORS.slice(0, Math.max(4, Math.min(8, editablePlayers.length + 2))).map((color, index, dots) => {
                const angle = POINTER_ANGLE + (360 / dots.length) * index;
                const point = polarToCartesian(CENTER, CENTER, CENTER - 17, angle);
                return (
                  <View
                    key={`${color}-${index}`}
                    style={[
                      styles.accentDot,
                      {
                        left: point.x - 4,
                        top: point.y - 4,
                        backgroundColor: color,
                      },
                    ]}
                  />
                );
              })}
            </Animated.View>

            <Animated.View style={[styles.chipOrbit, { transform: [{ rotate: rotation }, { scale: wheelScale }] }]}>
              {chipPositions.map(({ name, index, x, y }) => (
                <Animated.View
                  key={`player-${index}`}
                  style={[
                    styles.nameChip,
                    {
                      left: x - 38,
                      top: y - 17,
                      transform: [{ rotate: counterRotation }],
                      borderColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
                    },
                    index === activeSelectedIndex && ready && styles.nameChipSelected,
                  ]}
                >
                  <TextInput
                    style={[
                      styles.nameChipInput,
                      !String(name || '').trim() && styles.nameChipInputEmpty,
                      index === activeSelectedIndex && ready && styles.nameChipInputSelected,
                    ]}
                    value={String(name || '')}
                    placeholder={`${playerPlaceholder} ${index + 1}`}
                    placeholderTextColor={index === activeSelectedIndex && ready ? '#FFFFFF' : '#94A3B8'}
                    onChangeText={(value) => updatePlayerName(index, value)}
                    editable={!spinning}
                    maxLength={14}
                    selectTextOnFocus
                    textAlign="center"
                    returnKeyType="done"
                  />
                </Animated.View>
              ))}
            </Animated.View>

            <TouchableOpacity
              style={styles.centerHub}
              onPress={() => startSpin(1)}
              disabled={spinning || ready}
              activeOpacity={0.86}
            >
              <Text style={styles.centerHubText}>{spinning ? '...' : 'GO'}</Text>
            </TouchableOpacity>

            {onPlayersChange && (
              <TouchableOpacity
                style={[
                  styles.addPlayerButton,
                  !canAddPlayer && styles.addPlayerButtonDisabled,
                  reachedPlayerLimit && styles.addPlayerButtonLimit,
                ]}
                onPress={addPlayer}
                disabled={spinning}
                activeOpacity={0.8}
              >
                <Text style={[styles.addPlayerPlus, reachedPlayerLimit && styles.addPlayerPlusLimit]}>
                  {reachedPlayerLimit ? '!' : '+'}
                </Text>
                <Text
                  style={[styles.addPlayerText, reachedPlayerLimit && styles.addPlayerTextLimit]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.76}
                >
                  {addPlayerButtonLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Animated.View
            style={[
              styles.resultPanel,
              ready && styles.resultPanelReady,
              ready && {
                opacity: revealOpacity,
                transform: [{ scale: revealScale }],
              },
            ]}
          >
            <Text style={styles.resultLabel}>
              {ready ? selectedLabel : spinning ? spinningLabel : idleLabel}
            </Text>
            <Text style={[styles.resultName, !ready && styles.resultNameIdle]}>
              {ready ? selectedName : spinning ? '...' : spinLabel}
            </Text>
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              ready ? styles.continueButton : styles.spinButton,
              spinning && styles.disabledButton,
            ]}
            onPress={ready ? handleContinue : () => startSpin(1)}
            disabled={spinning}
            activeOpacity={0.86}
          >
            <Text style={styles.actionText}>{ready ? continueLabel : spinLabel}</Text>
          </TouchableOpacity>

          {onDisable && (
            <TouchableOpacity
              style={[styles.disableButton, spinning && styles.disableButtonDisabled]}
              onPress={onDisable}
              disabled={spinning}
              activeOpacity={0.75}
            >
              <Text style={styles.disableButtonText}>{disableLabel}</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.56)',
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 30,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  kicker: {
    color: '#F97316',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 3,
  },
  title: {
    color: '#111827',
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },
  stage: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE + 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  selectionMarker: {
    position: 'absolute',
    top: 14,
    zIndex: 18,
    alignItems: 'center',
    justifyContent: 'center',
    transformOrigin: '50% 0%',
  },
  selectionMarkerSpinning: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 9,
    elevation: 7,
  },
  selectionMarkerReady: {
    top: 12,
  },
  selectionMarkerLine: {
    width: 3,
    height: 33,
    borderRadius: 2,
    backgroundColor: '#111827',
    opacity: 0.92,
  },
  selectionMarkerDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    marginTop: -2,
    backgroundColor: '#F97316',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  stageGlow: {
    position: 'absolute',
    top: WHEEL_TOP + 10,
    left: 10,
    width: WHEEL_SIZE - 20,
    height: WHEEL_SIZE - 20,
    borderRadius: (WHEEL_SIZE - 20) / 2,
    backgroundColor: 'rgba(79,70,229,0.08)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 5,
  },
  speedHalo: {
    position: 'absolute',
    top: WHEEL_TOP + 7,
    left: 7,
    width: WHEEL_SIZE - 14,
    height: WHEEL_SIZE - 14,
    borderRadius: (WHEEL_SIZE - 14) / 2,
    borderWidth: 3,
    borderColor: 'rgba(249,115,22,0.12)',
    borderTopColor: '#F97316',
    borderRightColor: '#6366F1',
    zIndex: 2,
  },
  orbitTrack: {
    position: 'absolute',
    top: WHEEL_TOP + 18,
    left: 18,
    width: WHEEL_SIZE - 36,
    height: WHEEL_SIZE - 36,
    borderRadius: (WHEEL_SIZE - 36) / 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(99,102,241,0.30)',
    backgroundColor: 'rgba(255,255,255,0.54)',
  },
  innerTrack: {
    position: 'absolute',
    top: WHEEL_TOP + 57,
    left: 57,
    width: WHEEL_SIZE - 114,
    height: WHEEL_SIZE - 114,
    borderRadius: (WHEEL_SIZE - 114) / 2,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  accentOrbit: {
    position: 'absolute',
    top: WHEEL_TOP,
    left: 0,
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
  },
  accentDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.85,
  },
  chipOrbit: {
    position: 'absolute',
    top: WHEEL_TOP,
    left: 0,
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
  },
  nameChip: {
    position: 'absolute',
    width: 76,
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  nameChipSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  nameChipInput: {
    width: '100%',
    minHeight: 30,
    paddingVertical: 0,
    paddingHorizontal: 2,
    color: '#111827',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  nameChipInputEmpty: {
    color: '#94A3B8',
    fontWeight: '800',
  },
  nameChipInputSelected: {
    color: '#FFFFFF',
  },
  addPlayerButton: {
    position: 'absolute',
    right: -2,
    bottom: -3,
    minHeight: 28,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.72)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    zIndex: 12,
  },
  addPlayerButtonDisabled: {
    opacity: 0.45,
  },
  addPlayerButtonLimit: {
    backgroundColor: 'rgba(248,250,252,0.92)',
    borderColor: 'rgba(148,163,184,0.55)',
  },
  addPlayerPlus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F97316',
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  addPlayerPlusLimit: {
    backgroundColor: '#94A3B8',
  },
  addPlayerText: {
    color: '#C2410C',
    fontSize: 10,
    fontWeight: '900',
    maxWidth: 112,
    flexShrink: 1,
  },
  addPlayerTextLimit: {
    color: '#64748B',
  },
  centerHub: {
    position: 'absolute',
    top: WHEEL_TOP + (WHEEL_SIZE - 74) / 2,
    left: (WHEEL_SIZE - 74) / 2,
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 6,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 9,
    elevation: 8,
  },
  centerHubText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  resultPanel: {
    width: '100%',
    minHeight: 72,
    marginTop: 4,
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.95)',
  },
  resultPanelReady: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  resultLabel: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultName: {
    marginTop: 2,
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  resultNameIdle: {
    color: '#94A3B8',
    fontSize: 18,
  },
  actionButton: {
    width: '100%',
    minHeight: 52,
    marginTop: 13,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  spinButton: {
    backgroundColor: '#111827',
    shadowColor: '#111827',
  },
  continueButton: {
    backgroundColor: '#F97316',
    shadowColor: '#F97316',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.62,
    shadowOpacity: 0,
  },
  disableButton: {
    minHeight: 36,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disableButtonDisabled: {
    opacity: 0.45,
  },
  disableButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
});
