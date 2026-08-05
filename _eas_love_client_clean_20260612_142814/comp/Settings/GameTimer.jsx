// comp/game/common/GameTimer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';

import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

export const GameTimer = ({
  initialMode = 'timer',
  defaultTime = 60,
  compact = false,
}) => {
  const { lang } = useLanguage();

  const [mode, setMode] = useState(initialMode);
  const [seconds, setSeconds] = useState(initialMode === 'timer' ? defaultTime : 0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(mode === 'timer' ? defaultTime : 0);
  }, [mode, defaultTime]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (mode === 'stopwatch') return prev + 1;
          if (prev <= 0) {
            clearInterval(intervalRef.current);
            setIsActive(false);
            Vibration.vibrate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, mode]);

  const toggleTimer = () => setIsActive((prev) => !prev);

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(mode === 'timer' ? defaultTime : 0);
  };

  const adjustTime = (amount) => {
    if (mode === 'timer' && !isActive) {
      setSeconds((prev) => Math.max(10, prev + amount));
    }
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isTimer = mode === 'timer';

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.tabContainer, compact && styles.tabContainerCompact]}>
        <TouchableOpacity
          style={[styles.tab, compact && styles.tabCompact, isTimer && styles.activeTab]}
          onPress={() => setMode('timer')}
        >
          <Text style={[styles.tabText, compact && styles.tabTextCompact, isTimer && styles.activeTabText]}>
            {i18n.t('gameTimer.tabs.timer')}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.tab, compact && styles.tabCompact, !isTimer && styles.activeTab]}
          onPress={() => setMode('stopwatch')}
        >
          <Text style={[styles.tabText, compact && styles.tabTextCompact, !isTimer && styles.activeTabText]}>
            {i18n.t('gameTimer.tabs.stopwatch')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.mainDisplay, compact && styles.mainDisplayCompact]}>
        <TouchableOpacity
          disabled={!isTimer || isActive}
          onPress={() => adjustTime(-10)}
          style={[styles.adjustBtn, compact && styles.adjustBtnCompact, (!isTimer || isActive) && styles.hidden]}
        >
          <Text style={[styles.adjustText, compact && styles.adjustTextCompact]}>-10</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleTimer} activeOpacity={0.7}>
          <Text
            style={[
              styles.timeText,
              compact && styles.timeTextCompact,
              isActive && styles.timeTextActive,
              isTimer && seconds === 0 && styles.timeTextDone,
            ]}
          >
            {formatTime(seconds)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!isTimer || isActive}
          onPress={() => adjustTime(10)}
          style={[styles.adjustBtn, compact && styles.adjustBtnCompact, (!isTimer || isActive) && styles.hidden]}
        >
          <Text style={[styles.adjustText, compact && styles.adjustTextCompact]}>+10</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.actionRow, compact && styles.actionRowCompact]}>
        <TouchableOpacity
          style={[styles.iconBtn, compact && styles.iconBtnCompact]}
          onPress={resetTimer}
        >
          <Text style={[styles.iconBtnText, compact && styles.iconBtnTextCompact]}>↻</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.playPauseBtn,
            compact && styles.playPauseBtnCompact,
            isActive ? styles.bgPause : styles.bgPlay,
          ]}
          onPress={toggleTimer}
        >
          <Text style={[styles.playPauseIcon, compact && styles.playPauseIconCompact]}>
            {isActive ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.iconBtn, compact && styles.iconBtnCompact, { opacity: 0 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 24,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    alignSelf: 'center',
  },
  containerCompact: {
    width: '74%',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    padding: 2,
    marginBottom: 10,
    width: 140,
    justifyContent: 'space-between',
  },
  tabContainerCompact: {
    width: 116,
    marginBottom: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 18,
    alignItems: 'center',
  },
  tabCompact: {
    paddingVertical: 3,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  tabTextCompact: {
    fontSize: 10,
  },
  activeTabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  mainDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 15,
  },
  mainDisplayCompact: {
    gap: 8,
  },
  timeText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#374151',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timeTextCompact: {
    fontSize: 32,
    letterSpacing: 1,
  },
  timeTextActive: {
    color: '#2563EB',
  },
  timeTextDone: {
    color: '#EF4444',
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  adjustBtnCompact: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  adjustText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  adjustTextCompact: {
    fontSize: 9,
  },
  hidden: {
    opacity: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 5,
  },
  actionRowCompact: {
    gap: 12,
    marginTop: 2,
  },
  playPauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  playPauseBtnCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  bgPlay: {
    backgroundColor: '#10B981',
  },
  bgPause: {
    backgroundColor: '#F59E0B',
  },
  playPauseIcon: {
    fontSize: 24,
    color: '#fff',
    marginTop: 2,
  },
  playPauseIconCompact: {
    fontSize: 18,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  iconBtnText: {
    fontSize: 16,
  },
  iconBtnTextCompact: {
    fontSize: 13,
  },
});
