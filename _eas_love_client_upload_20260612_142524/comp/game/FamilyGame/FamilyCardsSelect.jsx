import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import FlowerRoulette from '../../Settings/FlowerRoulette';
import TopMenu from '../../Settings/TopMenu';
import InstructionsFamily from '../../Settings/InstructionsFamily';
import PlayersSection from '../PlayersSection';
import CustomAlert from '../../../assets/utils/CustomAlert';
import LikeStatus from '../../gameModals/Likestatus';
import { getSelectedCards, getSpecialCards } from '../../../assets/utils/ApiTools';

// âœ… i18n
import i18n from '../../../src/localization/i18n';
import { useLanguage } from '../../../src/localization/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ×”×’×“×¨×•×ª ×ž×–×”×™×
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CATEGORY_IDS = {
  intro: 1,
  fun: 2,
  team: 3,
};

const DEFAULT_COUNT_PER_CAT = 5;
const CURRENT_MODE_ID = 3; // ×ž×©×¤×—×”

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SpecialFilterButton = ({ active, label, onPress }) => (
  <TouchableOpacity
    style={[
      styles.specialFilterButton,
      active && styles.specialFilterButtonActive,
    ]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text
      style={[
        styles.specialFilterButtonText,
        active && styles.specialFilterButtonTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const getSpecialEmptyMessage = (filters, t) => {
  const activeKeys = Object.entries(filters)
    .filter(([, isActive]) => isActive)
    .map(([key]) => key);

  if (activeKeys.length === 1) {
    if (activeKeys[0] === 'favorite') {
      return t('familyCardsSelect.specialDraw.empty.favorite');
    }

    if (activeKeys[0] === 'feedback') {
      return t('familyCardsSelect.specialDraw.empty.feedback');
    }

    if (activeKeys[0] === 'shared') {
      return t('familyCardsSelect.specialDraw.empty.shared');
    }
  }

  return t('familyCardsSelect.specialDraw.empty.combined');
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ×‘×§×©×ª ×›×¨×˜×™×¡×™× ×ž×”×©×¨×ª
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Stars = ({ selectedLevels, onChange, color, t }) => {
  const toggleLevel = (lvl) => {
    if (selectedLevels.includes(lvl)) {
      onChange(selectedLevels.filter((x) => x !== lvl));
    } else {
      onChange([...selectedLevels, lvl].sort());
    }
  };

  const selectAll = () => onChange([1, 2, 3]);
  const clearAll = () => onChange([]);

  return (
    <View style={styles.starsContainer}>
      <View style={styles.levelHintCard}>
        <Text style={styles.levelHintTitle}>{t('familyCardsSelect.levels.title')}</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3].map((i) => {
            const active = selectedLevels.includes(i);
            return (
              <TouchableOpacity
                key={i}
                onPress={() => toggleLevel(i)}
                activeOpacity={0.7}
                style={[
                  styles.starBtn,
                  active && {
                    backgroundColor: color + '20',
                    borderColor: color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.starText,
                    active ? { color: color } : { color: '#C4C4C4' },
                  ]}
                >
                  {active ? '★' : '☆'}
                </Text>
                <Text
                  style={[
                    styles.levelNum,
                    { color: active ? color : '#999' },
                  ]}
                >
                  {i}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={selectedLevels.length > 0 ? clearAll : selectAll}
          style={styles.miniActionBtn}
        >
          <Text style={styles.miniActionText}>
            {selectedLevels.length > 0
              ? t('familyCardsSelect.levels.clear', { defaultValue: 'Clear' })
              : t('familyCardsSelect.levels.selectAll', { defaultValue: 'Select all' })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CategoryCard = ({
  title,
  icon,
  selectedLevels,
  onChange,
  color,
  description,
  t,
  rowWidth,
}) => (
  <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 6, width: rowWidth }]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
    </View>

    <View style={styles.divider} />
    <Stars selectedLevels={selectedLevels} onChange={onChange} color={color} t={t} />
  </View>
);

export default function FamilyCardsSelect({ navigation, route }) {
  const isFocused = useIsFocused();
  const { lang } = useLanguage();
  const t = (key, vars) => i18n.t(key, vars);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const rowWidth = Math.min(520, Math.max(280, Math.round(windowWidth - 32)));

  const [userId, setUserId] = useState(route?.params?.userId ?? null);
  const [userIdResolved, setUserIdResolved] = useState(() => route?.params?.userId != null);
  const instructionsStorageKey = `lg_hideFamilyInstructions_${userId || 'guest'}`;

  // ×¨×ž×•×ª ×œ×›×œ ×§×˜×’×•×¨×™×”
  const [introLevels, setIntroLevels] = useState([]);
  const [funLevels, setFunLevels] = useState([]);
  const [teamLevels, setTeamLevels] = useState([]);
  const [specialFilters, setSpecialFilters] = useState({
    favorite: false,
    feedback: false,
    shared: false,
  });

  const [busy, setBusy] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const [instructionsChecked, setInstructionsChecked] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  // âœ… ×‘×ž×§×•× 6 ×©×“×•×ª ×§×©×™×—×™× - ×ž×¢×¨×š ×©×—×§× ×™× ×“×™× ×ž×™ ×©×ž×ª×—×™×œ ×‘-2 ×©×—×§× ×™×
  const [players, setPlayers] = useState(() => [
    {
      id: 1,
      name: '',
    },
    {
      id: 2,
      name: '',
    },
  ]);

  // ×˜×¢×™× ×ª userId
  useEffect(() => {
    (async () => {
      if (!userId) {
        const saved = await SecureStore.getItemAsync('lg_userId');
        if (saved) setUserId(saved);
      }
      setUserIdResolved(true);
    })();
  }, [userId]);

  useEffect(() => {
    if (!userIdResolved) return;
    setInstructionsChecked(false);
  }, [instructionsStorageKey, userIdResolved]);

  useEffect(() => {
    (async () => {
      if (!isFocused || instructionsChecked || !userIdResolved) return;
      const hidden = await SecureStore.getItemAsync(instructionsStorageKey);
      if (hidden !== 'true') {
        setInstructionsVisible(true);
      }
      setInstructionsChecked(true);
    })();
  }, [instructionsChecked, instructionsStorageKey, isFocused, userIdResolved]);

  useEffect(() => {
    if (!isFocused && instructionsVisible) {
      setInstructionsVisible(false);
    }
  }, [instructionsVisible, isFocused]);

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const handleAlertClose = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleCloseInstructions = async (dontShowAgain = false) => {
    if (dontShowAgain) {
      await SecureStore.setItemAsync(instructionsStorageKey, 'true');
    }
    setInstructionsVisible(false);
  };

  const startGame = async () => {
    if (!userId) {
      showAlert(
        'error',
        t('familyCardsSelect.alerts.missingUserTitle', { defaultValue: 'Error' }),
        t('familyCardsSelect.alerts.missingUserMessage', { defaultValue: 'Missing user id.' })
      );
      return;
    }

    const selections = [];

    const addCategory = (catId, levelsArr) => {
      levelsArr.forEach((lvl) =>
        selections.push({
          ModeID: CURRENT_MODE_ID,
          CategoryID: catId,
          LevelID: lvl,
          NumberOfCards: DEFAULT_COUNT_PER_CAT,
        }),
      );
    };

    if (introLevels.length) addCategory(CATEGORY_IDS.intro, introLevels);
    if (funLevels.length) addCategory(CATEGORY_IDS.fun, funLevels);
    if (teamLevels.length) addCategory(CATEGORY_IDS.team, teamLevels);

    const hasSpecialFilters =
      specialFilters.favorite || specialFilters.feedback || specialFilters.shared;

    if (hasSpecialFilters && selections.length === 0) {
      Object.values(CATEGORY_IDS).forEach((categoryId) => {
        [1, 2, 3].forEach((levelId) => {
          selections.push({
            ModeID: CURRENT_MODE_ID,
            CategoryID: categoryId,
            LevelID: levelId,
            NumberOfCards: DEFAULT_COUNT_PER_CAT,
          });
        });
      });
    }

    if (selections.length === 0) {
      showAlert(
        'warning',
        t('familyCardsSelect.alerts.selectAtLeastOneTitle', { defaultValue: 'Hold on' }),
        t('familyCardsSelect.alerts.selectAtLeastOneMessage', {
          defaultValue: 'Please select at least one card type (choose stars).',
        })
      );
      return;
    }

    // âœ… × ×™×§×•×™ ×©×ž×•×ª ×”×©×—×§× ×™× ×ž×ª×•×š ×”×ž×¢×¨×š ×”×“×™× ×ž×™
    const cleanPlayers = players.map((player, index) => {
      const name = player.name?.trim();
      if (name) {
        return name;
      }

      return t('familyCardsSelect.players.dynamicLabel', {
        defaultValue: `Player ${index + 1}`,
        num: index + 1,
        number: index + 1,
      });
    });

    setBusy(true);

    try {
      const cards = hasSpecialFilters
        ? await getSpecialCards({
            selections,
            lang,
            userId,
            includeFavoriteCards: specialFilters.favorite,
            includeFeedbackCards: specialFilters.feedback,
            includeSharedCards: specialFilters.shared,
            returnNotFoundObject: true,
          })
        : await getSelectedCards({
            selections,
            lang,
            userId,
            returnNotFoundObject: true,
          });

      if (cards && cards.notFound) {
        showAlert(
          'info',
          t('familyCardsSelect.alerts.notFoundTitle', { defaultValue: 'Oops' }),
          hasSpecialFilters
            ? getSpecialEmptyMessage(specialFilters, t)
            : t('familyCardsSelect.alerts.notFoundMessage', {
                defaultValue:
                  'No matching cards were found for this selection.\nTry changing category or difficulty.',
              })
        );
        return;
      }

      if (!Array.isArray(cards) || cards.length === 0) {
        showAlert(
          'info',
          t('familyCardsSelect.alerts.noCardsTitle', { defaultValue: 'Oops' }),
          hasSpecialFilters
            ? getSpecialEmptyMessage(specialFilters, t)
            : t('familyCardsSelect.alerts.noCardsMessage', { defaultValue: 'No cards were found.' })
        );
        return;
      }

      navigation.navigate('FamilyCardsGame', {
        userId,
        gameMode: 'family',
        selection: {
          intro: introLevels,
          fun: funLevels,
          team: teamLevels,
        },
        cards,
        players: cleanPlayers,
      });
    } catch (e) {
      showAlert(
        'error',
        t('familyCardsSelect.alerts.errorTitle', { defaultValue: 'Error' }),
        e?.message || t('familyCardsSelect.alerts.errorMessage', { defaultValue: 'Connection error' })
      );
    } finally {
      setBusy(false);
    }
  };

  const handleMenuLogout = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const showInfo = (msgKey) =>
    showAlert(
      'info',
      t('alerts.infoTitle', { defaultValue: 'Info' }),
      t(msgKey, { defaultValue: 'Coming soon' })
    );

  return (
    <View style={styles.mainContainer} key={lang}>
      <StatusBar style="dark" />
      <InstructionsFamily
        visible={isFocused && instructionsVisible}
        onClose={handleCloseInstructions}
      />
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />

      <TopMenu
        navigation={navigation}
        onSelectCoupleCards={() => navigation.navigate('GameModeSelect')}
        onSelectFamilyCards={() => {}}
        onSelectFriendsCards={() =>
          navigation.navigate('FriendsCardsSelect', { userId })
        }
        onContact={() => showInfo('familyCardsSelect.topMenu.contactSoon')}
        onFeedback={() => showInfo('familyCardsSelect.topMenu.feedbackSoon')}
        onHelp={() => showInfo('familyCardsSelect.topMenu.helpSoon')}
        onLogout={handleMenuLogout}
      />

      <FlowerRoulette style={styles.backgroundLogo} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentWrapper}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 56,
              paddingBottom: Math.max(insets.bottom + 96, 120),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.mainTitle}>
              {t('familyCardsSelect.header.title', { defaultValue: 'Choose game - Family' })}
            </Text>
            <Text style={styles.subTitle}>
              {t('familyCardsSelect.header.subtitle', {
                defaultValue: 'Pick card types for a family game and enter participant names',
              })}
            </Text>
          </View>

          {/* âœ… ×§×•×ž×¤×•× × ×˜×ª ×©×—×§× ×™× ×ž×©×•×ª×¤×ª */}
          <PlayersSection
            players={players}
            setPlayers={setPlayers}
            t={t}
            lang={lang}
            minPlayers={2}
            titleKey="familyCardsSelect.players.title"
            addButtonKey="familyCardsSelect.players.addButton"
            placeholderKey="familyCardsSelect.players.placeholder"
            playerLabelPrefixKey="familyCardsSelect.players.dynamicLabel"
            containerStyle={[styles.playersSectionWrapper, { width: rowWidth }]}
            showRemoveButton={true}
          />

          <View style={[styles.cardsContainer, { width: rowWidth }]}>
            <CategoryCard
              title={t('familyCardsSelect.categories.intro.title', { defaultValue: 'Family Intro' })}
              description={t('familyCardsSelect.categories.intro.description', {
                defaultValue: 'Ice-breaker questions that connect everyone at home',
              })}
              icon={t('familyCardsSelect.categories.intro.icon', { defaultValue: '👨‍👩‍👧‍👦' })}
              color="#10B981"
              selectedLevels={introLevels}
              onChange={setIntroLevels}
              t={t}
              rowWidth={rowWidth}
            />

            <CategoryCard
              title={t('familyCardsSelect.categories.fun.title', { defaultValue: 'Fun & Laughs' })}
              description={t('familyCardsSelect.categories.fun.description', {
                defaultValue: 'Light challenges that will make kids and adults laugh',
              })}
              icon={t('familyCardsSelect.categories.fun.icon', { defaultValue: '😄' })}
              color="#F59E0B"
              selectedLevels={funLevels}
              onChange={setFunLevels}
              t={t}
              rowWidth={rowWidth}
            />

            <CategoryCard
              title={t('familyCardsSelect.categories.team.title', { defaultValue: 'Family Bonding' })}
              description={t('familyCardsSelect.categories.team.description', {
                defaultValue: 'Cards that strengthen teamwork and togetherness',
              })}
              icon={t('familyCardsSelect.categories.team.icon', { defaultValue: '🏠' })}
              color="#6366F1"
              selectedLevels={teamLevels}
              onChange={setTeamLevels}
              t={t}
              rowWidth={rowWidth}
            />

            <View style={styles.specialDrawCard}>
              <Text style={styles.specialDrawTitle}>{t('familyCardsSelect.specialDraw.title')}</Text>
              <Text style={styles.specialDrawSubtitle}>
                {t('familyCardsSelect.specialDraw.subtitle')}
              </Text>

              <LikeStatus
                active={specialFilters.favorite}
                onToggle={() =>
                  setSpecialFilters((prev) => ({
                    ...prev,
                    favorite: !prev.favorite,
                  }))
                }
                title={t('familyCardsSelect.specialDraw.favoriteTitle')}
                subtitle={t('familyCardsSelect.specialDraw.favoriteSubtitle')}
              />

              <View style={styles.specialFiltersRow}>
                <SpecialFilterButton
                  active={specialFilters.feedback}
                  label={t('familyCardsSelect.specialDraw.feedbackLabel')}
                  onPress={() =>
                    setSpecialFilters((prev) => ({
                      ...prev,
                      feedback: !prev.feedback,
                    }))
                  }
                />
                <SpecialFilterButton
                  active={specialFilters.shared}
                  label={t('familyCardsSelect.specialDraw.sharedLabel')}
                  onPress={() =>
                    setSpecialFilters((prev) => ({
                      ...prev,
                      shared: !prev.shared,
                    }))
                  }
                />
              </View>

              <Text style={styles.specialDrawHint}>
                {t('familyCardsSelect.specialDraw.hint')}
              </Text>
            </View>
          </View>
        </ScrollView>
        <View style={[styles.footerRow, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.playButton, busy && styles.playButtonDisabled]}
            onPress={startGame}
            disabled={busy}
            activeOpacity={0.8}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.playButtonText}>
                {t('familyCardsSelect.buttons.start', { defaultValue: 'Start playing' })}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  backgroundLogo: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    opacity: 0.1,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingTop: 85,
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '90%',
  },

  // âœ… ×”-wrapper ×”×—×™×¦×•× ×™ ×‘×œ×‘×“, ×›×™ ×”×¢×™×¦×•×‘ ×”×¤× ×™×ž×™ × ×ž×¦× ×‘×ª×•×š PlayersSection
  playersSectionWrapper: {
    marginBottom: 24,
  },

  cardsContainer: {
    width: '100%',
  },
  specialDrawCard: {
    marginTop: 4,
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#F8FAFF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  specialDrawTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#312E81',
    textAlign: 'right',
  },
  specialDrawSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4C1D95',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 14,
  },
  specialFiltersRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  specialFilterButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  specialFilterButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  specialFilterButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  specialFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  specialDrawHint: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#4338CA',
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'right',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },

  starsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  levelHintCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  levelHintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  starText: {
    fontSize: 22,
    lineHeight: 26,
  },
  levelNum: {
    fontSize: 10,
    marginTop: -2,
    fontWeight: '700',
  },
  miniActionBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  miniActionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },

  playButton: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
