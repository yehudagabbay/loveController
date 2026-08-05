import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomAlert from '../../../assets/utils/CustomAlert';
import { getResearchCards } from '../../../assets/utils/ApiTools';
import { useLanguage } from '../../../src/localization/LanguageContext';
import i18n from '../../../src/localization/i18n';

const STEP_KEYS = [
  'researchCardsSelect.steps.gameType',
  'researchCardsSelect.steps.book',
  'researchCardsSelect.steps.style',
  'researchCardsSelect.steps.levels',
  'researchCardsSelect.steps.summary',
];

const BOOKS = [
  {
    id: 'seven-principles',
    bookId: 1,
    title: 'The Seven Principles for Making Marriage Work',
    descriptionKey: 'researchCardsSelect.books.sevenPrinciples.description',
    coverImage: require('../../../assets/images/books/seven-principles.jpg'),
  },
  {
    id: 'supercommunicators',
    bookId: 2,
    title: 'Supercommunicators',
    descriptionKey: 'researchCardsSelect.books.supercommunicators.description',
    coverImage: require('../../../assets/images/books/supercommunicators.jpg'),
  },
  {
    id: 'art-of-gathering',
    bookId: 3,
    title: 'The Art of Gathering',
    descriptionKey: 'researchCardsSelect.books.artOfGathering.description',
    coverImage: require('../../../assets/images/books/art-of-gathering.jpg'),
  },
  {
    id: 'mars-venus',
    bookId: 4,
    title: 'Men Are From Mars and Women Are From Venus',
    descriptionKey: 'researchCardsSelect.books.marsVenus.description',
    coverImage: require('../../../assets/images/books/mars-venus.jpg'),
  },
  {
    id: 'come-as-you-are',
    bookId: 10,
    title: 'Come As You Are',
    descriptionKey: 'researchCardsSelect.books.comeAsYouAre.description',
    coverImage: require('../../../assets/images/books/come-as-you-are.jpeg'),
  },
  {
    id: 'love-languages',
    bookId: 20,
    title: 'The Five Love Languages',
    descriptionKey: 'researchCardsSelect.books.loveLanguages.description',
    coverImage: require('../../../assets/images/books/love-languages.jpg'),
  },
];

const GAME_TYPES = [
  {
    id: 'couple',
    modeId: 1,
    titleKey: 'researchCardsSelect.gameTypes.couple.title',
    descriptionKey: 'researchCardsSelect.gameTypes.couple.description',
    routeName: 'IndexGame',
    playerKeys: ['researchCardsSelect.players.player1', 'researchCardsSelect.players.player2'],
    styles: [
      {
        id: 'fun',
        titleKey: 'researchCardsSelect.styles.couple.fun.title',
        descriptionKey: 'researchCardsSelect.styles.couple.fun.description',
        categoryId: 2,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'intro',
        titleKey: 'researchCardsSelect.styles.couple.intro.title',
        descriptionKey: 'researchCardsSelect.styles.couple.intro.description',
        categoryId: 1,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'passion',
        titleKey: 'researchCardsSelect.styles.couple.passion.title',
        descriptionKey: 'researchCardsSelect.styles.couple.passion.description',
        categoryId: 3,
        subCategoryIds: [1, 2, 3],
      },
    ],
  },
  {
    id: 'family',
    modeId: 3,
    titleKey: 'researchCardsSelect.gameTypes.family.title',
    descriptionKey: 'researchCardsSelect.gameTypes.family.description',
    routeName: 'FamilyCardsGame',
    playerKeys: ['researchCardsSelect.players.participant1', 'researchCardsSelect.players.participant2'],
    styles: [
      {
        id: 'family-stories',
        titleKey: 'researchCardsSelect.styles.family.stories.title',
        descriptionKey: 'researchCardsSelect.styles.family.stories.description',
        categoryId: 1,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'family-fun',
        titleKey: 'researchCardsSelect.styles.family.fun.title',
        descriptionKey: 'researchCardsSelect.styles.family.fun.description',
        categoryId: 2,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'family-closeness',
        titleKey: 'researchCardsSelect.styles.family.closeness.title',
        descriptionKey: 'researchCardsSelect.styles.family.closeness.description',
        categoryId: 3,
        subCategoryIds: [1, 2, 3],
      },
    ],
  },
  {
    id: 'friends',
    modeId: 2,
    titleKey: 'researchCardsSelect.gameTypes.friends.title',
    descriptionKey: 'researchCardsSelect.gameTypes.friends.description',
    routeName: 'FriendsCardsGame',
    playerKeys: ['researchCardsSelect.players.participant1', 'researchCardsSelect.players.participant2'],
    styles: [
      {
        id: 'friends-intro',
        titleKey: 'researchCardsSelect.styles.friends.intro.title',
        descriptionKey: 'researchCardsSelect.styles.friends.intro.description',
        categoryId: 1,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'friends-fun',
        titleKey: 'researchCardsSelect.styles.friends.fun.title',
        descriptionKey: 'researchCardsSelect.styles.friends.fun.description',
        categoryId: 2,
        subCategoryIds: [1, 2, 3],
      },
      {
        id: 'friends-trust',
        titleKey: 'researchCardsSelect.styles.friends.trust.title',
        descriptionKey: 'researchCardsSelect.styles.friends.trust.description',
        categoryId: 3,
        subCategoryIds: [1, 2, 3],
      },
    ],
  },
];

const LEVEL_OPTIONS = [
  { value: 1, label: '1', descriptionKey: 'researchCardsSelect.levelOptions.1' },
  { value: 2, label: '2', descriptionKey: 'researchCardsSelect.levelOptions.2' },
  { value: 3, label: '3', descriptionKey: 'researchCardsSelect.levelOptions.3' },
  { value: 4, label: '4', descriptionKey: 'researchCardsSelect.levelOptions.4' },
  { value: 5, label: '5', descriptionKey: 'researchCardsSelect.levelOptions.5' },
];

const getById = (items, id) => items.find((item) => item.id === id) || null;

const mapScaleLevelToServerLevel = (level) => {
  const numericLevel = Number(level);
  if (numericLevel <= 2) return 1;
  if (numericLevel === 3) return 2;
  return 3;
};

function ResearchTopBar({ width, onBack, t }) {
  return (
    <View style={[styles.topBar, { width }]}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.85}>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#E5E7EB" />
        <Text style={styles.backButtonText}>{t('researchCardsSelect.actions.back')}</Text>
      </TouchableOpacity>
      <View style={styles.premiumBadge}>
        <MaterialCommunityIcons name="crown" size={16} color="#FDE68A" />
        <Text style={styles.premiumBadgeText}>{t('researchCardsSelect.premiumBadge')}</Text>
      </View>
    </View>
  );
}

function ResearchHeader({ width, t }) {
  return (
    <View style={[styles.header, { width }]}>
      <Text style={styles.headerKicker}>LIBA</Text>
      <Text style={styles.headerTitle}>{t('researchCardsSelect.title')}</Text>
    </View>
  );
}

function ResearchProgress({ width, currentStep, totalSteps, stepTitle, percent, availableStepCount, onStepPress, t }) {
  return (
    <View style={[styles.progressCard, { width }]}>
      <View style={styles.progressHeader}>
        <View style={styles.progressTitleBox}>
          <Text style={styles.progressStepCounter}>
            {t('researchCardsSelect.stepMeta', { current: currentStep, total: totalSteps })}
          </Text>
          <Text style={styles.progressTitle}>{stepTitle}</Text>
        </View>
        <Text style={styles.progressPercent}>{percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.stepDots}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index + 1 === currentStep;
          const isOpen = index < availableStepCount;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.stepDot, isOpen && styles.stepDotOpen, isActive && styles.stepDotActive]}
              activeOpacity={0.8}
              disabled={!isOpen}
              onPress={() => onStepPress(index)}
            />
          );
        })}
      </View>
    </View>
  );
}

function ResearchSelectionChips({ chips, width }) {
  const activeChips = chips.filter((chip) => chip.active);

  if (!activeChips.length) {
    return null;
  }

  return (
    <View style={[styles.chipSummary, { width }]}>
      {activeChips.map((chip) => (
        <View key={chip.key} style={[styles.summaryChip, styles.summaryChipActive]}>
          <Text style={[styles.summaryChipText, styles.summaryChipTextActive]} numberOfLines={1}>
            {chip.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ResearchChoiceButton({ item, selected, onPress, icon }) {
  return (
    <TouchableOpacity
      style={[styles.choiceButton, selected && styles.choiceButtonSelected]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
        <MaterialCommunityIcons name={icon} size={22} color={selected ? '#0F172A' : '#67E8F9'} />
      </View>
      <View style={styles.choiceTextBox}>
        <Text style={styles.choiceTitle}>{item.title}</Text>
        <Text style={styles.choiceDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ResearchBookPicker({ books, selectedBookId, onToggleBook }) {
  return (
    <View style={styles.bookPicker}>
      {books.map((book) => {
        const isSelected = selectedBookId === book.id;

        return (
          <TouchableOpacity
            key={book.id}
            style={[styles.bookCard, isSelected && styles.bookCardSelected]}
            activeOpacity={0.88}
            onPress={() => onToggleBook(book.id)}
          >
            <View style={styles.bookCoverWrap}>
              <Image source={book.coverImage} style={styles.bookCover} resizeMode="cover" />
              {isSelected ? (
                <View style={styles.bookSelectedBadge}>
                  <MaterialCommunityIcons name="check" size={15} color="#0F172A" />
                </View>
              ) : null}
            </View>
            <View style={styles.bookCopy}>
              <Text style={styles.bookTitle} numberOfLines={2}>
                {book.title}
              </Text>
              <Text style={styles.bookDescription} numberOfLines={2}>
                {book.description}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ResearchLevelPicker({ stylesList, styleLevels, levelOptions, setStyleLevels, t }) {
  return (
    <View style={styles.levelStack}>
      {stylesList.map((style) => {
        const selectedLevel = styleLevels[style.id];

        return (
          <View key={style.id} style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelTitle}>{style.title}</Text>
              <Text style={styles.selectedLevelText}>
                {selectedLevel
                  ? t('researchCardsSelect.levelSelected', { level: selectedLevel })
                  : t('researchCardsSelect.chooseLevel')}
              </Text>
            </View>
            <View style={styles.levelRow}>
              {levelOptions.map((level) => {
                const isSelected = selectedLevel === level.value;
                return (
                  <TouchableOpacity
                    key={level.value}
                    style={[styles.levelButton, isSelected && styles.levelButtonSelected]}
                    activeOpacity={0.85}
                    onPress={() =>
                      setStyleLevels((current) => ({
                        ...current,
                        [style.id]: level.value,
                      }))
                    }
                  >
                    <Text style={[styles.levelNumber, isSelected && styles.levelTextSelected]}>
                      {level.label}
                    </Text>
                    <Text style={[styles.levelDescription, isSelected && styles.levelTextSelected]}>
                      {level.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ResearchSummary({ items, title }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <View style={styles.summaryGrid}>
        {items.map((item) => (
          <View key={item.key} style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons name={item.icon} size={17} color="#0891B2" />
            </View>
            <Text style={styles.summaryLabel}>{item.label}</Text>
            <Text style={styles.summaryValue} numberOfLines={2}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ResearchStepCard({ width, eyebrow, title, text, children }) {
  return (
    <View style={[styles.stepCard, { width }]}>
      <Text style={styles.stepEyebrow}>{eyebrow}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepText}>{text}</Text>
      {children}
    </View>
  );
}

function ResearchFooterActions({ width, canContinue, onBack, onContinue, t }) {
  return (
    <View style={[styles.footerActions, { width }]}>
      <TouchableOpacity style={styles.secondaryAction} onPress={onBack}>
        <Text style={styles.secondaryActionText}>{t('researchCardsSelect.actions.back')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.primaryAction, !canContinue && styles.primaryActionDisabled]}
        disabled={!canContinue}
        onPress={onContinue}
      >
        <Text style={styles.primaryActionText}>{t('researchCardsSelect.actions.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ResearchCardsSelect({ navigation, route }) {
  const { lang } = useLanguage();
  const t = (key, vars = {}) => i18n.t(key, { ...vars, locale: lang });
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const rowWidth = Math.min(520, Math.max(280, Math.round(width - 32)));
  const steps = useMemo(() => STEP_KEYS.map((key) => t(key)), [lang]);
  const books = useMemo(
    () => BOOKS.map((book) => ({ ...book, description: t(book.descriptionKey) })),
    [lang],
  );
  const gameTypes = useMemo(
    () =>
      GAME_TYPES.map((gameType) => ({
        ...gameType,
        title: t(gameType.titleKey),
        description: t(gameType.descriptionKey),
        players: gameType.playerKeys.map((key) => t(key)),
        styles: gameType.styles.map((style) => ({
          ...style,
          title: t(style.titleKey),
          description: t(style.descriptionKey),
        })),
      })),
    [lang],
  );
  const levelOptions = useMemo(
    () => LEVEL_OPTIONS.map((level) => ({ ...level, description: t(level.descriptionKey) })),
    [lang],
  );

  const [userId, setUserId] = useState(route?.params?.userId ?? null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedGameTypeId, setSelectedGameTypeId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedStyleIds, setSelectedStyleIds] = useState([]);
  const [styleLevels, setStyleLevels] = useState({});
  const [busy, setBusy] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    (async () => {
      if (!userId) {
        const saved = await SecureStore.getItemAsync('lg_userId');
        if (saved) setUserId(saved);
      }
    })();
  }, [userId]);

  const selectedGameType = getById(gameTypes, selectedGameTypeId);
  const selectedBook = getById(books, selectedBookId);
  const selectedStyles = useMemo(
    () =>
      selectedGameType
        ? selectedStyleIds
            .map((styleId) => getById(selectedGameType.styles, styleId))
            .filter(Boolean)
        : [],
    [selectedGameType, selectedStyleIds],
  );

  const allLevelsSelected =
    selectedStyles.length > 0 &&
    selectedStyles.every((style) => Boolean(styleLevels[style.id]));

  const selections = useMemo(() => {
    if (!selectedGameType || !selectedBook || !allLevelsSelected) {
      return [];
    }

    return selectedStyles.flatMap((style) =>
      style.subCategoryIds.map((subCategoryId) => ({
        ModeID: selectedGameType.modeId,
        CategoryID: style.categoryId,
        BookID: selectedBook.bookId,
        SubCategoryID: subCategoryId,
        LevelID: mapScaleLevelToServerLevel(styleLevels[style.id]),
      })),
    );
  }, [allLevelsSelected, selectedBook, selectedGameType, selectedStyles, styleLevels]);

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const canOpenStep = (index) => {
    if (index === 0) return true;
    if (index === 1) return Boolean(selectedGameType);
    if (index === 2) return Boolean(selectedGameType && selectedBook);
    if (index === 3) return Boolean(selectedGameType && selectedBook && selectedStyles.length);
    return Boolean(selectedGameType && selectedBook && allLevelsSelected);
  };

  const goToStep = (index) => {
    if (index < 0 || index >= steps.length || !canOpenStep(index)) {
      return;
    }
    setStepIndex(index);
  };

  const selectGameType = (gameTypeId) => {
    if (gameTypeId === selectedGameTypeId) {
      return;
    }

    setSelectedGameTypeId(gameTypeId);
    setSelectedBookId('');
    setSelectedStyleIds([]);
    setStyleLevels({});
  };

  const toggleStyle = (styleId) => {
    setSelectedStyleIds((current) => {
      if (current.includes(styleId)) {
        setStyleLevels((levels) => {
          const nextLevels = { ...levels };
          delete nextLevels[styleId];
          return nextLevels;
        });
        return current.filter((currentStyleId) => currentStyleId !== styleId);
      }

      return [...current, styleId];
    });
  };

  const toggleBook = (bookId) => {
    setSelectedBookId((currentBookId) => (currentBookId === bookId ? '' : bookId));
  };

  const startGame = async () => {
    if (!userId) {
      showAlert('warning', t('researchCardsSelect.alerts.missingUserTitle'), t('researchCardsSelect.alerts.missingUserMessage'));
      return;
    }

    if (!selectedGameType || !selectedBook || selections.length === 0) {
      showAlert('warning', t('researchCardsSelect.alerts.waitTitle'), t('researchCardsSelect.alerts.completeSelection'));
      return;
    }

    setBusy(true);

    try {
      const result = await getResearchCards({
        selections,
        lang,
        userId,
        maxCards: 18,
      });

      if (!result.response.ok) {
        const message =
          result.response.status === 403
            ? t('researchCardsSelect.alerts.premiumOnly')
            : result.response.status === 404
            ? t('researchCardsSelect.alerts.noCards')
            : result.data?.message || result.raw || t('researchCardsSelect.alerts.fetchFailed');

        showAlert('warning', t('researchCardsSelect.title'), message);
        return;
      }

      const cards = Array.isArray(result.data) ? result.data : [];

      if (cards.length === 0) {
        showAlert('info', t('researchCardsSelect.title'), t('researchCardsSelect.alerts.noCards'));
        return;
      }

      navigation.navigate(selectedGameType.routeName, {
        userId,
        gameMode: selectedGameType.id,
        selection: {
          research: true,
          gameType: selectedGameType.id,
          bookId: selectedBook.bookId,
          styles: selectedStyleIds,
          levels: styleLevels,
        },
        cards,
        players: selectedGameType.players,
      });
    } catch (error) {
      showAlert(
        'error',
        t('alerts.networkErrorTitle'),
        error?.name === 'AbortError'
          ? t('researchCardsSelect.alerts.timeout')
          : error?.message || t('researchCardsSelect.alerts.fetchFailed'),
      );
    } finally {
      setBusy(false);
    }
  };

  const progressPercent = Math.round((stepIndex / (steps.length - 1)) * 100);
  const completedLevelCount = selectedStyles.filter((style) => Boolean(styleLevels[style.id])).length;
  const summaryChips = [
    {
      key: 'gameType',
      label: selectedGameType?.title || t('researchCardsSelect.summary.gameType'),
      active: Boolean(selectedGameType),
    },
    {
      key: 'book',
      label: selectedBook
        ? t('researchCardsSelect.summary.bookValue', { title: selectedBook.title })
        : t('researchCardsSelect.summary.book'),
      active: Boolean(selectedBook),
    },
    {
      key: 'styles',
      label: selectedStyles.length
        ? t('researchCardsSelect.summary.stylesCount', { count: selectedStyles.length })
        : t('researchCardsSelect.summary.styles'),
      active: selectedStyles.length > 0,
    },
    {
      key: 'levels',
      label: allLevelsSelected
        ? t('researchCardsSelect.summary.levelsComplete')
        : selectedStyles.length
        ? t('researchCardsSelect.summary.levelsCount', {
            completed: completedLevelCount,
            total: selectedStyles.length,
          })
        : t('researchCardsSelect.summary.levels'),
      active: allLevelsSelected,
    },
  ];

  const summaryItems = [
    {
      key: 'gameType',
      icon: 'heart-multiple',
      label: t('researchCardsSelect.summary.gameType'),
      value: selectedGameType?.title || t('researchCardsSelect.summary.notSelected'),
    },
    {
      key: 'book',
      icon: 'book-open-page-variant',
      label: t('researchCardsSelect.summary.book'),
      value: selectedBook?.title || t('researchCardsSelect.summary.notSelected'),
    },
    {
      key: 'styles',
      icon: 'cards-heart',
      label: t('researchCardsSelect.summary.styles'),
      value: selectedStyles.length
        ? selectedStyles.map((style) => style.title).join(' | ')
        : t('researchCardsSelect.summary.notSelected'),
    },
    {
      key: 'levels',
      icon: 'signal-cellular-3',
      label: t('researchCardsSelect.summary.levels'),
      value: selectedStyles.length
        ? selectedStyles
            .map((style) =>
              styleLevels[style.id]
                ? t('researchCardsSelect.levelSelected', { level: styleLevels[style.id] })
                : t('researchCardsSelect.chooseLevel'),
            )
            .join(' | ')
        : t('researchCardsSelect.summary.notSelected'),
    },
  ];

  const maxAvailableStep = useMemo(() => {
    let nextMax = 0;

    for (let index = 1; index < steps.length; index += 1) {
      if (!canOpenStep(index)) {
        break;
      }
      nextMax = index;
    }

    return nextMax;
  }, [allLevelsSelected, selectedBook, selectedGameType, selectedStyles.length, steps.length]);

  const availableSteps = steps.slice(0, maxAvailableStep + 1);

  useEffect(() => {
    if (stepIndex <= maxAvailableStep) {
      return;
    }

    setStepIndex(maxAvailableStep);
  }, [maxAvailableStep, stepIndex]);

  const renderStepContent = (index) => {
    if (index === 0) {
      return (
        <ResearchStepCard
          width={rowWidth}
          eyebrow={t('researchCardsSelect.stepMeta', { current: 1, total: steps.length })}
          title={t('researchCardsSelect.stepContent.gameType.title')}
          text={t('researchCardsSelect.stepContent.gameType.text')}
        >
          <View style={styles.choiceStack}>
            {gameTypes.map((gameType) => (
              <ResearchChoiceButton
                key={gameType.id}
                item={gameType}
                selected={selectedGameTypeId === gameType.id}
                onPress={() => selectGameType(gameType.id)}
                icon={gameType.id === 'couple' ? 'heart-multiple' : gameType.id === 'family' ? 'home-heart' : 'account-group'}
              />
            ))}
          </View>
        </ResearchStepCard>
      );
    }

    if (index === 1) {
      return (
        <ResearchStepCard
          width={rowWidth}
          eyebrow={t('researchCardsSelect.stepMeta', { current: 2, total: steps.length })}
          title={t('researchCardsSelect.stepContent.book.title')}
          text={t('researchCardsSelect.stepContent.book.text')}
        >
          <Text style={styles.tapHint}>{t('researchCardsSelect.bookTapHint')}</Text>
          <ResearchBookPicker books={books} selectedBookId={selectedBookId} onToggleBook={toggleBook} />
        </ResearchStepCard>
      );
    }

    if (index === 2) {
      return (
        <ResearchStepCard
          width={rowWidth}
          eyebrow={t('researchCardsSelect.stepMeta', { current: 3, total: steps.length })}
          title={t('researchCardsSelect.stepContent.style.title')}
          text={t('researchCardsSelect.stepContent.style.text')}
        >
          <View style={styles.choiceStack}>
            {selectedGameType?.styles.map((style) => (
              <ResearchChoiceButton
                key={style.id}
                item={style}
                selected={selectedStyleIds.includes(style.id)}
                onPress={() => toggleStyle(style.id)}
                icon="cards-heart"
              />
            ))}
          </View>
        </ResearchStepCard>
      );
    }

    if (index === 3) {
      return (
        <ResearchStepCard
          width={rowWidth}
          eyebrow={t('researchCardsSelect.stepMeta', { current: 4, total: steps.length })}
          title={t('researchCardsSelect.stepContent.levels.title')}
          text={t('researchCardsSelect.stepContent.levels.text')}
        >
          <ResearchLevelPicker
            stylesList={selectedStyles}
            styleLevels={styleLevels}
            levelOptions={levelOptions}
            setStyleLevels={setStyleLevels}
            t={t}
          />
        </ResearchStepCard>
      );
    }

    return (
      <ResearchStepCard
        width={rowWidth}
        eyebrow={t('researchCardsSelect.stepMeta', { current: 5, total: steps.length })}
        title={t('researchCardsSelect.stepContent.summary.title')}
        text={t('researchCardsSelect.stepContent.summary.text')}
      >
        <ResearchSummary items={summaryItems} title={t('researchCardsSelect.summary.title')} />
        <View style={styles.summaryActions}>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => goToStep(3)}>
            <Text style={styles.secondaryActionText}>{t('researchCardsSelect.actions.backToEdit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryAction, busy && styles.primaryActionDisabled]} onPress={startGame} disabled={busy}>
            {busy ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.primaryActionText}>{t('researchCardsSelect.actions.startGame')}</Text>}
          </TouchableOpacity>
        </View>
      </ResearchStepCard>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />

      <LinearGradient colors={['#0F172A', '#111827', '#172554']} style={StyleSheet.absoluteFill} />

      <View
        style={[
          styles.screenContent,
          {
            paddingTop: insets.top + 18,
            paddingBottom: Math.max(insets.bottom + 18, 28),
          },
        ]}
      >
        <ResearchTopBar width={rowWidth} onBack={() => navigation.goBack()} t={t} />
        <ResearchHeader width={rowWidth} t={t} />
        <ResearchProgress
          width={rowWidth}
          currentStep={stepIndex + 1}
          totalSteps={steps.length}
          stepTitle={steps[stepIndex]}
          percent={progressPercent}
          availableStepCount={availableSteps.length}
          onStepPress={goToStep}
          t={t}
        />
        {stepIndex < 4 ? <ResearchSelectionChips chips={summaryChips} width={rowWidth} /> : null}
        <ScrollView
          style={[styles.stepScroll, { width: rowWidth }]}
          contentContainerStyle={styles.stepScrollContent}
          showsVerticalScrollIndicator
          indicatorStyle="white"
        >
          {renderStepContent(stepIndex)}
        </ScrollView>
        {stepIndex < 4 ? (
          <ResearchFooterActions
            width={rowWidth}
            canContinue={canOpenStep(stepIndex + 1)}
            onBack={() => (stepIndex === 0 ? navigation.goBack() : goToStep(stepIndex - 1))}
            onContinue={() => goToStep(stepIndex + 1)}
            t={t}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  screenContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 19,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  backButtonText: {
    color: '#E5E7EB',
    fontWeight: '800',
    fontSize: 13,
  },
  premiumBadge: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 19,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(253,230,138,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.25)',
  },
  premiumBadgeText: {
    color: '#FDE68A',
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerKicker: {
    color: '#67E8F9',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  progressCard: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressTitleBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  progressStepCounter: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 2,
  },
  progressTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
  },
  progressPercent: {
    color: '#67E8F9',
    fontSize: 17,
    fontWeight: '900',
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#67E8F9',
  },
  stepDots: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 7,
    marginTop: 9,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(203,213,225,0.28)',
  },
  stepDotOpen: {
    backgroundColor: 'rgba(103,232,249,0.42)',
  },
  stepDotActive: {
    width: 23,
    backgroundColor: '#67E8F9',
  },
  chipSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  stepScroll: {
    flex: 1,
  },
  stepScrollContent: {
    alignItems: 'center',
    paddingBottom: 18,
  },
  summaryChip: {
    maxWidth: '100%',
    minHeight: 28,
    justifyContent: 'center',
    borderRadius: 17,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(15,23,42,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  summaryChipActive: {
    backgroundColor: 'rgba(103,232,249,0.18)',
    borderColor: 'rgba(103,232,249,0.42)',
  },
  summaryChipText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  summaryChipTextActive: {
    color: '#FFFFFF',
  },
  summaryBox: {
    width: '100%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  summaryGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  summaryItem: {
    width: '48%',
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFEFF',
    marginBottom: 6,
  },
  summaryLabel: {
    color: '#0891B2',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 3,
  },
  summaryValue: {
    color: '#111827',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  stepCard: {
    width: '100%',
    padding: 13,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  stepEyebrow: {
    color: '#0891B2',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  stepTitle: {
    color: '#111827',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    textAlign: 'center',
  },
  stepText: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
    maxWidth: 360,
  },
  tapHint: {
    alignSelf: 'center',
    color: '#0E7490',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#ECFEFF',
  },
  choiceStack: {
    width: '100%',
    gap: 8,
  },
  choiceButton: {
    minHeight: 78,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  choiceButtonSelected: {
    backgroundColor: '#ECFEFF',
    borderColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  choiceIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  choiceIconSelected: {
    backgroundColor: '#67E8F9',
  },
  choiceTextBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  choiceTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'right',
  },
  choiceDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
    marginTop: 2,
  },
  bookPicker: {
    width: '100%',
    gap: 8,
  },
  bookCard: {
    minHeight: 96,
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    borderRadius: 15,
    padding: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  bookCardSelected: {
    backgroundColor: '#ECFEFF',
    borderColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  bookCoverWrap: {
    position: 'relative',
    width: 52,
    height: 78,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  bookCover: {
    width: '100%',
    height: '100%',
  },
  bookSelectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#67E8F9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bookCopy: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  bookTitle: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    textAlign: 'right',
  },
  bookDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 5,
  },
  levelStack: {
    width: '100%',
  },
  levelCard: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 9,
    width: '100%',
  },
  levelHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginBottom: 8,
  },
  levelTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  selectedLevelText: {
    color: '#0891B2',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 4,
  },
  levelButton: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 4,
  },
  levelButtonSelected: {
    backgroundColor: '#67E8F9',
    borderColor: '#06B6D4',
  },
  levelNumber: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
  },
  levelDescription: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  levelTextSelected: {
    color: '#0F172A',
  },
  summaryActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  primaryAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#67E8F9',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryActionDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
  },
  primaryActionText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
