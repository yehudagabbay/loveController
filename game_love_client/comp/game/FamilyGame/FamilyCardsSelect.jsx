import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
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
import {
  CardCategoryChoice,
  RegularGameSetupFlow,
  SpecialOptionsDisclosure,
} from '../RegularCardSelectionUI';
import LibaCardsLoadingOverlay from '../LibaCardsLoadingOverlay';


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
const FAMILY_ROULETTE_MAX_PLAYERS = 10;

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

const RouletteToggle = ({ active, onPress, t, rtl }) => (
  <TouchableOpacity
    style={[styles.rouletteToggle, active && styles.rouletteToggleActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.rouletteIcon, active && styles.rouletteIconActive]}>
      <Text style={[styles.rouletteIconText, active && styles.rouletteIconTextActive]}>?</Text>
    </View>
    <View style={styles.rouletteTextBox}>
      <Text style={[styles.rouletteTitle, { textAlign: rtl ? 'right' : 'left' }]}>
        {t('common.playerRoulette.toggleTitle', { defaultValue: 'Player roulette' })}
      </Text>
      <Text style={[styles.rouletteSubtitle, { textAlign: rtl ? 'right' : 'left' }]}>
        {t('common.playerRoulette.toggleSubtitle', {
          defaultValue: 'Spin before each card and let chance pick the turn.',
        })}
      </Text>
    </View>
    <View style={[styles.rouletteSwitch, active && styles.rouletteSwitchActive]}>
      <View style={[styles.rouletteKnob, active && styles.rouletteKnobActive]} />
    </View>
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

const CategoryCard = ({
  title,
  icon,
  selectedLevels,
  onChange,
  color,
  description,
  t,
  rtl,
}) => (
  <CardCategoryChoice
    title={title}
    icon={icon}
    selectedLevels={selectedLevels}
    onChange={onChange}
    color={color}
    description={description}
    t={t}
    rtl={rtl}
  />
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
  const [rouletteEnabled, setRouletteEnabled] = useState(false);

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

  useEffect(() => {
    if (isFocused) {
      setBusy(false);
    }
  }, [isFocused]);

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
        t('gameHome.alerts.selectAtLeastOne')
      );
      return;
    }

    // âœ… × ×™×§×•×™ ×©×ž×•×ª ×”×©×—×§× ×™× ×ž×ª×•×š ×”×ž×¢×¨×š ×”×“×™× ×ž×™
    const cleanPlayers = players.slice(0, FAMILY_ROULETTE_MAX_PLAYERS).map((player, index) => {
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
    let didNavigate = false;

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
          rouletteEnabled,
        },
        cards,
        players: cleanPlayers,
        rouletteEnabled,
      });
      didNavigate = true;
    } catch (e) {
      showAlert(
        'error',
        t('familyCardsSelect.alerts.errorTitle', { defaultValue: 'Error' }),
        e?.message || t('familyCardsSelect.alerts.errorMessage', { defaultValue: 'Connection error' })
      );
    } finally {
      if (!didNavigate) {
        setBusy(false);
      }
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

  const selectedGameLabels = [
    introLevels.length ? t('familyCardsSelect.categories.intro.title') : null,
    funLevels.length ? t('familyCardsSelect.categories.fun.title') : null,
    teamLevels.length ? t('familyCardsSelect.categories.team.title') : null,
  ].filter(Boolean);
  const enteredPlayerNames = players
    .map((player) => player.name?.trim())
    .filter(Boolean);
  const gameSummary = selectedGameLabels.length
    ? selectedGameLabels.join(' · ')
    : t('common.cardSelection.tapToChooseGame');
  const playersSummary = enteredPlayerNames.length
    ? enteredPlayerNames.join(' · ')
    : t('common.cardSelection.participantsCount', { count: players.length });

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
              {t('familyCardsSelect.header.title', { defaultValue: 'Choose game: Family' })}
            </Text>
            <Text style={styles.subTitle}>
              {t('familyCardsSelect.header.subtitle', {
                defaultValue: 'Pick card types for a family game and enter participant names',
              })}
            </Text>
          </View>

          <View style={[styles.cardsContainer, { width: rowWidth }]}>
            <RegularGameSetupFlow
              gameTitle={t('common.cardSelection.whatPlaying')}
              gameSummary={gameSummary}
              playersTitle={t('common.cardSelection.whoPlaying')}
              playersSummary={playersSummary}
              accentColor="#6366F1"
              rtl={lang === 'he' || lang === 'ar'}
              gameContent={
                <View style={styles.questionBody}>
                  <CategoryCard
                    title={t('familyCardsSelect.categories.intro.title', { defaultValue: 'Family Intro' })}
                    description={t('familyCardsSelect.categories.intro.description', {
                      defaultValue: 'Icebreaker questions that connect everyone at home',
                    })}
                    icon={t('familyCardsSelect.categories.intro.icon', { defaultValue: '👨‍👩‍👧‍👦' })}
                    color="#10B981"
                    selectedLevels={introLevels}
                    onChange={setIntroLevels}
                    t={t}
                    rtl={lang === 'he' || lang === 'ar'}
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
                    rtl={lang === 'he' || lang === 'ar'}
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
                    rtl={lang === 'he' || lang === 'ar'}
                  />
                  <SpecialOptionsDisclosure
                    title={t('familyCardsSelect.specialDraw.title')}
                    subtitle={t('familyCardsSelect.specialDraw.subtitle')}
                    accentColor="#6366F1"
                    activeCount={Object.values(specialFilters).filter(Boolean).length}
                    rtl={lang === 'he' || lang === 'ar'}
                  >
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
                  </SpecialOptionsDisclosure>
                </View>
              }
              playersContent={
                <>
                  <PlayersSection
                    players={players}
                    setPlayers={setPlayers}
                    t={t}
                    lang={lang}
                    minPlayers={2}
                    maxPlayers={FAMILY_ROULETTE_MAX_PLAYERS}
                    titleKey="familyCardsSelect.players.title"
                    addButtonKey="familyCardsSelect.players.addButton"
                    placeholderKey="familyCardsSelect.players.placeholder"
                    playerLabelPrefixKey="familyCardsSelect.players.dynamicLabel"
                    showRemoveButton
                    hideTitle
                    accentColor="#6366F1"
                    containerStyle={styles.questionPlayers}
                  />
                  <RouletteToggle
                    active={rouletteEnabled}
                    onPress={() => setRouletteEnabled((prev) => !prev)}
                    t={t}
                    rtl={lang === 'he' || lang === 'ar'}
                  />
                </>
              }
            />
          </View>
        </ScrollView>
        <View style={[styles.footerRow, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[
              styles.playButton,
              introLevels.length + funLevels.length + teamLevels.length === 0 &&
                !Object.values(specialFilters).some(Boolean) &&
                styles.playButtonWaiting,
              busy && styles.playButtonDisabled,
            ]}
            onPress={startGame}
            disabled={busy}
            activeOpacity={0.8}
          >
            <Text style={styles.playButtonText}>
              {t('familyCardsSelect.buttons.start', { defaultValue: 'Start playing' })}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <LibaCardsLoadingOverlay visible={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFF',
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
    marginBottom: 28,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
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
  questionBody: {
    marginTop: 12,
  },
  questionPlayers: {
    marginTop: 12,
    marginBottom: 0,
    padding: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  rouletteToggle: {
    minHeight: 76,
    marginTop: 12,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rouletteToggleActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  rouletteIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  rouletteIconActive: {
    backgroundColor: '#6366F1',
  },
  rouletteIconText: {
    color: '#64748B',
    fontSize: 22,
    fontWeight: '900',
  },
  rouletteIconTextActive: {
    color: '#FFFFFF',
  },
  rouletteTextBox: {
    flex: 1,
  },
  rouletteTitle: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '900',
  },
  rouletteSubtitle: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  rouletteSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    alignItems: 'flex-start',
    backgroundColor: '#CBD5E1',
  },
  rouletteSwitchActive: {
    alignItems: 'flex-end',
    backgroundColor: '#6366F1',
  },
  rouletteKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  rouletteKnobActive: {
    backgroundColor: '#FFFFFF',
  },

  cardsContainer: {
    width: '100%',
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
  footerRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
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
  playButtonWaiting: {
    backgroundColor: '#94A3B8',
    shadowColor: '#94A3B8',
    shadowOpacity: 0.16,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
