// comp/game/GameHome.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TextInput,
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
import LikeStatus from '../../gameModals/Likestatus';
import { getSelectedCards, getSpecialCards } from '../../../assets/utils/ApiTools';

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
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
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

  const handleCloseInstructions = async (dontShowAgain = false) => {
    if (dontShowAgain) {
      await SecureStore.setItemAsync(instructionsStorageKey, 'true');
    }
    setInstructionsVisible(false);
  };


  const Stars = ({ selectedLevels, onChange, color }) => {
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
          <Text style={styles.levelHintTitle}>{t('gameHome.stars.title')}</Text>

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
                ? t('gameHome.stars.clear')
                : t('gameHome.stars.selectAll')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
  rowWidth,
}) => (
    <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 6, width: rowWidth }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{description}</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <Stars selectedLevels={selectedLevels} onChange={onChange} color={color} />
    </View>
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
          player1Name?.trim() || t('gameHome.players.default1'),
          player2Name?.trim() || t('gameHome.players.default2'),
        ],
      });
    } catch (e) {
      showAlert(
        'warning',
        t('gameHome.alerts.errorTitle'),
        e?.message || t('gameHome.alerts.serverError'),
      );
    } finally {
      setBusy(false);
    }
  };

  // --- ×ª×¤×¨×™×˜ ×¢×œ×™×•×Ÿ ---
  const handleMenuLogout = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const showInfo = (msg) => {
    showAlert('info', t('gameHome.alerts.infoTitle'), msg);
  };

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
        keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top - 8, 0) : 0}
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
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="always"
          showsVerticalScrollIndicator={false}
        >
          {/* key={lang} ×›×“×™ ×œ×”×‘×˜×™×— ×¨×¢× ×•×Ÿ ×˜×§×¡×˜×™× ×‘×©×™× ×•×™ ×©×¤×” */}
          <View key={lang} style={styles.headerContainer}>
            <Text style={styles.mainTitle}>{t('gameHome.header.title')}</Text>
            <Text style={styles.subTitle}>{t('gameHome.header.subtitle')}</Text>
          </View>

          <View style={[styles.playersSection, { width: rowWidth }]}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>
                {t('gameHome.players.label1')}
              </Text>
              <TextInput
                style={styles.modernInput}
                placeholder={t('gameHome.players.default1')}
                value={player1Name}
                onChangeText={setPlayer1Name}
                placeholderTextColor="#9CA3AF"
                textAlign="right"
              />
            </View>

            <View style={styles.vsBadge}>
              <Text style={styles.vsText}>&</Text>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>
                {t('gameHome.players.label2')}
              </Text>
              <TextInput
                style={styles.modernInput}
                placeholder={t('gameHome.players.default2')}
                value={player2Name}
                onChangeText={setPlayer2Name}
                placeholderTextColor="#9CA3AF"
                textAlign="right"
              />
            </View>
          </View>

          <CategoryCard
            title={t('gameHome.categories.intro.title')}
            description={t('gameHome.categories.intro.desc')}
            icon="🥂"
            color="#2196F3"
            selectedLevels={introLevels}
            onChange={setIntroLevels}
            rowWidth={rowWidth}
          />

          <CategoryCard
            title={t('gameHome.categories.fun.title')}
            description={t('gameHome.categories.fun.desc')}
            icon="😜"
            color="#FF9800"
            selectedLevels={funLevels}
            onChange={setFunLevels}
            rowWidth={rowWidth}
          />

          <CategoryCard
            title={t('gameHome.categories.passion.title')}
            description={t('gameHome.categories.passion.desc')}
            icon="🔥"
            color="#E91E63"
            selectedLevels={passionLevels}
            onChange={setPassionLevels}
            rowWidth={rowWidth}
          />

          <View style={[styles.specialDrawCard, { width: rowWidth }]}>
            <Text style={styles.specialDrawTitle}>{t('gameHome.specialDraw.title')}</Text>
            <Text style={styles.specialDrawSubtitle}>
              {t('gameHome.specialDraw.subtitle')}
            </Text>

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
          </View>
        </ScrollView>

        <View style={[styles.footerRow, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.playButton, busy && styles.playButtonDisabled]}
            onPress={goNext}
            disabled={busy}
            activeOpacity={0.8}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.playButtonText}>
                  {t('gameHome.buttons.start')}
                </Text>
                <Text style={styles.playButtonIcon}>🚀</Text>
              </>
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
    backgroundColor: '#FFF5F7',
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
    marginBottom: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  playersSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
    marginLeft: 4,
    textAlign: 'right',
  },
  modernInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
    textAlign: 'right',
  },
  vsBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFE4E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    marginTop: 16,
  },
  vsText: {
    color: '#E91E63',
    fontWeight: 'bold',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  specialDrawCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FFF8FB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD7E3',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  specialDrawTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7A1F44',
    textAlign: 'right',
  },
  specialDrawSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7A5064',
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
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'right',
  },
  cardDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
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
    width: 40,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  starText: {
    fontSize: 24,
    lineHeight: 28,
  },
  levelNum: {
    fontSize: 10,
    marginTop: -2,
    fontWeight: 'bold',
  },
  miniActionBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  miniActionText: {
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
