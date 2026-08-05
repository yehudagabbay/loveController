// comp/game/GameHome.jsx
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
import CustomAlert from '../../Settings/CustomAlert';
import InstructionsCouple from '../../Settings/InstructionsCouple';
import PlayersSection from '../PlayersSection';
import LikeStatus from '../../gameModals/Likestatus';
import { getSelectedCards, getSpecialCards } from '../../../assets/utils/ApiTools';
import {
  CardCategoryChoice,
  RegularGameSetupFlow,
  SpecialOptionsDisclosure,
} from '../RegularCardSelectionUI';
import LibaCardsLoadingOverlay from '../LibaCardsLoadingOverlay';

// âœ… i18n (×œ×œ× react-i18next)
import i18n from '../../../src/localization/i18n';
import { useLanguage } from '../../../src/localization/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const CATEGORY_IDS = { intro: 1, fun: 2, passion: 3 };
const DEFAULT_COUNT_PER_CAT = 5;
const CURRENT_MODE_ID = 1; 

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
      return t('gameHome.specialDraw.empty.favorite');
    }

    if (activeKeys[0] === 'feedback') {
      return t('gameHome.specialDraw.empty.feedback');
    }

    if (activeKeys[0] === 'shared') {
      return t('gameHome.specialDraw.empty.shared');
    }
  }

  return t('gameHome.specialDraw.empty.combined');
};

export default function CoupleCardsSelect({ navigation, route }) {
  const isFocused = useIsFocused();
  const { lang } = useLanguage();
  const t = (key, vars) => i18n.t(key, vars);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const rowWidth = Math.min(520, Math.max(280, Math.round(windowWidth - 32)));

  const [userId, setUserId] = useState(route?.params?.userId ?? null);
  const [userIdResolved, setUserIdResolved] = useState(() => route?.params?.userId != null);
  const instructionsStorageKey = `lg_hideCoupleInstructions_${userId || 'guest'}`;

  const [introLevels, setIntroLevels] = useState([]);
  const [funLevels, setFunLevels] = useState([]);
  const [passionLevels, setPassionLevels] = useState([]);

  const [busy, setBusy] = useState(false);
  const [players, setPlayers] = useState(() => [
    { id: 1, name: '' },
    { id: 2, name: '' },
  ]);
  const [specialFilters, setSpecialFilters] = useState({
    favorite: false,
    feedback: false,
    shared: false,
  });
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const [instructionsChecked, setInstructionsChecked] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info', // success | error | info | warning
    title: '',
    message: '',
    onOk: null,
  });

  const showAlert = (type, title, message, onOk = null) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onOk,
    });
  };

  const handleAlertClose = () => {
    const cb = alertConfig.onOk;
    setAlertConfig((prev) => ({ ...prev, visible: false }));
    if (cb) cb();
  };

  useEffect(() => {
    (async () => {
      if (!userId) {
        const saved = await SecureStore.getItemAsync('lg_userId');
        if (saved) {
          setUserId(saved);
        }
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

  const handleCloseInstructions = async (dontShowAgain = false) => {
    if (dontShowAgain) {
      await SecureStore.setItemAsync(instructionsStorageKey, 'true');
    }
    setInstructionsVisible(false);
  };


  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ×›×¨×˜×™×¡ ×§×˜×’×•×¨×™×”
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const CategoryCard = ({
    title,
    icon,
    selectedLevels,
    onChange,
    color,
    description,
  }) => (
    <CardCategoryChoice
      title={title}
      icon={icon}
      selectedLevels={selectedLevels}
      onChange={onChange}
      color={color}
      description={description}
      t={t}
      rtl={lang === 'he' || lang === 'ar'}
    />
  );

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // "×ž×ª×—×™×œ×™× ×œ×©×—×§"
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const goNext = async () => {
    if (!userId) {
      // ××–×”×¨×” / ×©×’×™××” â€“ ××“×•×
      showAlert(
        'warning',
        t('gameHome.alerts.errorTitle'),
        t('gameHome.alerts.missingUserId'),
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
    if (passionLevels.length) addCategory(CATEGORY_IDS.passion, passionLevels);

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
      // ×‘×—×™×¨×ª ×ž×©×—×§ ×‘×œ×™ ×§×œ×¤×™× â†’ ××–×”×¨×” ××“×•×ž×”
      showAlert(
        'warning',
        t('gameHome.alerts.waitTitle'),
        t('gameHome.alerts.selectAtLeastOne'),
      );
      return;
    }

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
          })
        : await getSelectedCards({ selections, lang, userId });

      if (!Array.isArray(cards) || cards.length === 0) {
        // ×ž×™×“×¢ â€“ ×™×¨×•×§
        showAlert(
          'info',
          t('gameHome.alerts.oopsTitle'),
          hasSpecialFilters
            ? getSpecialEmptyMessage(specialFilters, t)
            : t('gameHome.alerts.noCardsFound'),
        );
        return;
      }

      navigation.navigate('IndexGame', {
        userId,
        selection: {
          intro: introLevels,
          fun: funLevels,
          passion: passionLevels,
        },
        cards,
        players: [
          players[0]?.name?.trim() || t('gameHome.players.default1'),
          players[1]?.name?.trim() || t('gameHome.players.default2'),
        ],
      });
      didNavigate = true;
    } catch (e) {
      showAlert(
        'warning',
        t('gameHome.alerts.errorTitle'),
        e?.message || t('gameHome.alerts.serverError'),
      );
    } finally {
      if (!didNavigate) {
        setBusy(false);
      }
    }
  };

  // --- ×ª×¤×¨×™×˜ ×¢×œ×™×•×Ÿ ---
  const handleMenuLogout = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const showInfo = (msg) => {
    showAlert('info', t('gameHome.alerts.infoTitle'), msg);
  };

  const selectedGameLabels = [
    introLevels.length ? t('gameHome.categories.intro.title') : null,
    funLevels.length ? t('gameHome.categories.fun.title') : null,
    passionLevels.length ? t('gameHome.categories.passion.title') : null,
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

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // UI
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <View style={styles.mainContainer}>
      <StatusBar style="dark" />

      <InstructionsCouple
        visible={isFocused && instructionsVisible}
        onClose={handleCloseInstructions}
      />

      {/* ðŸ”” ×”×ª×¨××” ×ž×¢×•×¦×‘×ª ×’×œ×•×‘×œ×™×ª */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />

      <TopMenu
        navigation={navigation}
        onSelectCoupleCards={() => { }}
        onSelectFamilyCards={() =>
          navigation.navigate('FamilyCardsSelect', { userId })
        }
        onSelectFriendsCards={() =>
          navigation.navigate('FriendsCardsSelect', { userId })
        }
        onContact={() => showInfo(t('gameHome.menu.contactSoon'))}
        onFeedback={() => showInfo(t('gameHome.menu.feedbackSoon'))}
        onHelp={() => showInfo(t('gameHome.menu.helpSoon'))}
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
          {/* key={lang} ×›×“×™ ×œ×”×‘×˜×™×— ×¨×¢× ×•×Ÿ ×˜×§×¡×˜×™× ×‘×©×™× ×•×™ ×©×¤×” */}
          <View key={lang} style={styles.headerContainer}>
            <Text style={styles.mainTitle}>{t('gameHome.header.title')}</Text>
            <Text style={styles.subTitle}>{t('gameHome.header.subtitle')}</Text>
          </View>

          <View style={{ width: rowWidth }}>
            <RegularGameSetupFlow
              gameTitle={t('common.cardSelection.whatPlaying')}
              gameSummary={gameSummary}
              playersTitle={t('common.cardSelection.whoPlaying')}
              playersSummary={playersSummary}
              accentColor="#E91E63"
              rtl={lang === 'he' || lang === 'ar'}
              gameContent={
                <View style={styles.questionBody}>
                  <CategoryCard
                    title={t('gameHome.categories.intro.title')}
                    description={t('gameHome.categories.intro.desc')}
                    icon="🥂"
                    color="#2196F3"
                    selectedLevels={introLevels}
                    onChange={setIntroLevels}
                  />
                  <CategoryCard
                    title={t('gameHome.categories.fun.title')}
                    description={t('gameHome.categories.fun.desc')}
                    icon="😜"
                    color="#FF9800"
                    selectedLevels={funLevels}
                    onChange={setFunLevels}
                  />
                  <CategoryCard
                    title={t('gameHome.categories.passion.title')}
                    description={t('gameHome.categories.passion.desc')}
                    icon="🔥"
                    color="#E91E63"
                    selectedLevels={passionLevels}
                    onChange={setPassionLevels}
                  />
                  <SpecialOptionsDisclosure
                    title={t('gameHome.specialDraw.title')}
                    subtitle={t('gameHome.specialDraw.subtitle')}
                    accentColor="#E91E63"
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
                      title={t('gameHome.specialDraw.favoriteTitle')}
                      subtitle={t('gameHome.specialDraw.favoriteSubtitle')}
                    />
                    <View style={styles.specialFiltersRow}>
                      <SpecialFilterButton
                        active={specialFilters.feedback}
                        label={t('gameHome.specialDraw.feedbackLabel')}
                        onPress={() =>
                          setSpecialFilters((prev) => ({
                            ...prev,
                            feedback: !prev.feedback,
                          }))
                        }
                      />
                      <SpecialFilterButton
                        active={specialFilters.shared}
                        label={t('gameHome.specialDraw.sharedLabel')}
                        onPress={() =>
                          setSpecialFilters((prev) => ({
                            ...prev,
                            shared: !prev.shared,
                          }))
                        }
                      />
                    </View>
                    <Text style={styles.specialDrawHint}>
                      {t('gameHome.specialDraw.hint')}
                    </Text>
                  </SpecialOptionsDisclosure>
                </View>
              }
              playersContent={
                <PlayersSection
                  players={players}
                  setPlayers={setPlayers}
                  t={t}
                  lang={lang}
                  minPlayers={2}
                  maxPlayers={2}
                  playerLabelPrefixKey="friendsCardsSelect.players.playerLabel"
                  placeholderKey="gameHome.players.placeholder"
                  showRemoveButton={false}
                  showAddButton={false}
                  hideTitle
                  accentColor="#E91E63"
                  containerStyle={styles.questionPlayers}
                />
              }
            />
          </View>
        </ScrollView>

        <View style={[styles.footerRow, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[
              styles.playButton,
              introLevels.length + funLevels.length + passionLevels.length === 0 &&
                !Object.values(specialFilters).some(Boolean) &&
                styles.playButtonWaiting,
              busy && styles.playButtonDisabled,
            ]}
            onPress={goNext}
            disabled={busy}
            activeOpacity={0.8}
          >
            <Text style={styles.playButtonText}>
              {t('gameHome.buttons.start')}
            </Text>
            <Text style={styles.playButtonIcon}>🚀</Text>
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
    backgroundColor: '#FFF8FA',
  },
  backgroundLogo: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    opacity: 0.3,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 85,
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginBottom: 28,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171717',
    marginBottom: 6,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
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
    borderColor: '#F3B3C9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  specialFilterButtonActive: {
    backgroundColor: '#FF4D8D',
    borderColor: '#FF4D8D',
  },
  specialFilterButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A33D67',
  },
  specialFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  specialDrawHint: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#A33D67',
    textAlign: 'right',
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFF8FA',
  },
  playButton: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  playButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#999',
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
    marginRight: 8,
  },
  playButtonIcon: {
    fontSize: 20,
  },
});
