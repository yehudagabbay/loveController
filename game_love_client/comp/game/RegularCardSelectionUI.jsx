import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LEVELS = [
  { value: 1, icon: '🌱', key: 'common.cardSelection.levels.light' },
  { value: 2, icon: '💬', key: 'common.cardSelection.levels.personal' },
  { value: 3, icon: '❤️', key: 'common.cardSelection.levels.deep' },
];

const animateChange = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  Haptics.selectionAsync().catch(() => {});
};

function SetupQuestionCard({
  number,
  title,
  summary,
  expanded,
  onPress,
  accentColor,
  rtl,
  children,
}) {
  return (
    <View
      style={[
        styles.questionCard,
        {
          borderColor: expanded ? accentColor : `${accentColor}35`,
          backgroundColor: expanded ? '#FFFFFF' : `${accentColor}08`,
          shadowColor: accentColor,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.questionHeader, !rtl && styles.rowLtr]}
        onPress={onPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View
          style={[
            styles.questionNumber,
            { backgroundColor: accentColor },
          ]}
        >
          <Text style={styles.questionNumberText}>{number}</Text>
        </View>

        <View style={styles.questionCopy}>
          <Text style={[styles.questionTitle, !rtl && styles.textLtr]}>
            {title}
          </Text>
          <Text
            style={[
              styles.questionSummary,
              expanded && { color: accentColor },
              !rtl && styles.textLtr,
            ]}
            numberOfLines={2}
          >
            {summary}
          </Text>
        </View>

        <View
          style={[
            styles.questionAction,
            {
              backgroundColor: `${accentColor}14`,
              borderColor: `${accentColor}65`,
            },
            expanded && { backgroundColor: `${accentColor}20` },
          ]}
        >
          <Text
            style={[
              styles.questionChevron,
              { color: accentColor },
            ]}
          >
            {expanded ? '↑' : '↓'}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && <View style={styles.questionContent}>{children}</View>}
    </View>
  );
}

export function RegularGameSetupFlow({
  gameTitle,
  gameSummary,
  gameContent,
  playersTitle,
  playersSummary,
  playersContent,
  accentColor,
  rtl = false,
}) {
  const [activeQuestion, setActiveQuestion] = useState(null);

  const toggleQuestion = (question) => {
    animateChange();
    setActiveQuestion((current) => (current === question ? null : question));
  };

  return (
    <View style={styles.setupFlow}>
      <SetupQuestionCard
        number="1"
        title={gameTitle}
        summary={gameSummary}
        expanded={activeQuestion === 'game'}
        onPress={() => toggleQuestion('game')}
        accentColor="#149B8E"
        rtl={rtl}
      >
        {gameContent}
      </SetupQuestionCard>

      <SetupQuestionCard
        number="2"
        title={playersTitle}
        summary={playersSummary}
        expanded={activeQuestion === 'players'}
        onPress={() => toggleQuestion('players')}
        accentColor={accentColor}
        rtl={rtl}
      >
        {playersContent}
      </SetupQuestionCard>
    </View>
  );
}

export function CardCategoryChoice({
  title,
  description,
  icon,
  color,
  selectedLevels,
  onChange,
  t,
  rtl = false,
}) {
  const isSelected = selectedLevels.length > 0;

  const toggleCategory = () => {
    animateChange();
    onChange(isSelected ? [] : [1]);
  };

  const toggleLevel = (level) => {
    animateChange();
    onChange(
      selectedLevels.includes(level)
        ? selectedLevels.filter((item) => item !== level)
        : [...selectedLevels, level].sort(),
    );
  };

  return (
    <View
      style={[
        styles.categoryCard,
        isSelected && {
          borderColor: color,
          backgroundColor: `${color}0D`,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.categoryHeader, !rtl && styles.rowLtr]}
        onPress={toggleCategory}
        activeOpacity={0.82}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${title}. ${description}`}
      >
        <View style={[styles.categoryIconWrap, { backgroundColor: `${color}18` }]}>
          <Text style={styles.categoryIcon}>{icon}</Text>
        </View>

        <View style={styles.categoryCopy}>
          <Text style={[styles.categoryTitle, !rtl && styles.textLtr]}>{title}</Text>
          <Text style={[styles.categoryDescription, !rtl && styles.textLtr]}>
            {description}
          </Text>
        </View>

        <View
          style={[
            styles.checkCircle,
            { borderColor: isSelected ? color : '#CBD5E1' },
            isSelected && { backgroundColor: color },
          ]}
        >
          {isSelected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {isSelected && (
        <View style={styles.levelArea}>
          <Text style={[styles.levelPrompt, !rtl && styles.textLtr]}>
            {t('common.cardSelection.levelPrompt')}
          </Text>

          <View style={[styles.levelRow, !rtl && styles.rowLtr]}>
            {LEVELS.map((level) => {
              const active = selectedLevels.includes(level.value);

              return (
                <TouchableOpacity
                  key={level.value}
                  onPress={() => toggleLevel(level.value)}
                  activeOpacity={0.8}
                  style={[
                    styles.levelChoice,
                    active && {
                      backgroundColor: color,
                      borderColor: color,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <Text style={styles.levelIcon}>{level.icon}</Text>
                  <Text style={[styles.levelLabel, active && styles.levelLabelActive]}>
                    {t(level.key)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

export function SpecialOptionsDisclosure({
  title,
  subtitle,
  activeCount = 0,
  accentColor,
  children,
  rtl = false,
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    animateChange();
    setExpanded((current) => !current);
  };

  return (
    <View style={styles.specialWrap}>
      <TouchableOpacity
        style={[styles.specialHeader, !rtl && styles.rowLtr]}
        onPress={toggleExpanded}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={[styles.specialIcon, { backgroundColor: `${accentColor}18` }]}>
          <Text style={styles.specialIconText}>✨</Text>
        </View>

        <View style={styles.specialCopy}>
          <View style={[styles.specialTitleLine, !rtl && styles.rowLtr]}>
            <Text style={[styles.specialTitle, !rtl && styles.textLtr]}>{title}</Text>
            {activeCount > 0 && (
              <View style={[styles.activeBadge, { backgroundColor: accentColor }]}>
                <Text style={styles.activeBadgeText}>{activeCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.specialSubtitle, !rtl && styles.textLtr]}
            numberOfLines={expanded ? undefined : 1}
          >
            {subtitle}
          </Text>
        </View>

        <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>⌄</Text>
      </TouchableOpacity>

      {expanded && <View style={styles.specialContent}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  setupFlow: {
    width: '100%',
    gap: 20,
    paddingTop: 28,
  },
  questionCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 9,
    elevation: 2,
  },
  questionHeader: {
    minHeight: 124,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 15,
    paddingHorizontal: 19,
    paddingVertical: 19,
  },
  questionNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  questionCopy: {
    flex: 1,
  },
  questionTitle: {
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'right',
  },
  questionSummary: {
    color: '#64748B',
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
  },
  questionAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  questionChevron: {
    color: '#475569',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
  },
  questionContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rowLtr: {
    flexDirection: 'row',
  },
  textLtr: {
    textAlign: 'left',
  },
  categoryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    minHeight: 88,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  categoryIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryCopy: {
    flex: 1,
  },
  categoryTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  categoryDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
    textAlign: 'right',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 20,
  },
  levelArea: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  levelPrompt: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 9,
    textAlign: 'right',
  },
  levelRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  levelChoice: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  levelIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  levelLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  levelLabelActive: {
    color: '#FFFFFF',
  },
  specialWrap: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  specialHeader: {
    minHeight: 78,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  specialIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialIconText: {
    fontSize: 22,
  },
  specialCopy: {
    flex: 1,
  },
  specialTitleLine: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
  },
  specialTitle: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  specialSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
    textAlign: 'right',
  },
  activeBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  chevron: {
    color: '#64748B',
    fontSize: 26,
    lineHeight: 28,
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  specialContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});
