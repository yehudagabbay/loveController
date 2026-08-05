// comp/game/FriendGame/FriendsCardsGame.jsx

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  Image,
  PanResponder,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import logo1 from '../../../assets/images/logo1.png';
import CustomAlert from '../../../assets/utils/CustomAlert';

// אייקון רקע קבוע למסך חברים
import iconRelations from '../../../assets/images/icons/relations.png';

// ✅ i18n + Language Context (כמו אצלך)
import i18n from '../../../src/localization/i18n';
import { useLanguage } from '../../../src/localization/LanguageContext';
import DeckCompleteBurst from '../../animations/DeckCompleteBurst';
import SoftBloom from '../../animations/SoftBloom';
import GameCardModal from '../../gameModals/GameCardModal';
import FeedbackRatingStars from '../../gameModals/FeedbackRatingStars';
import ShareCardModal from '../../gameModals/ShareCardModal';
import PlayerRouletteOverlay from '../PlayerRouletteOverlay';
import { submitFeedback as submitFeedbackRequest } from '../../../assets/utils/ApiTools';
import useDeckCompleteSound from '../../../assets/utils/useDeckCompleteSound';

// --- חישוב רוחב וגובה מסך ---
const W = Math.min(520, Math.max(320, Math.round(Dimensions.get('window').width - 40)));
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_CARD_FEEDBACK_RATING = 5;

// ================== כתובת API למשוב ==================
const getCurrentUserId = (route) =>
  route?.params?.userId ?? route?.params?.user?.UserID ?? 0;

// --- קבועים ועזרים ---
const CAT_COLORS = { 1: '#059669', 2: '#F59E0B', 3: '#6366F1' };
const heartsByCat = { 1: '🫂', 2: '🤣', 3: '🤝' };
const stars = (n) => '⭐'.repeat(Math.max(1, Math.min(3, n)));

const CATEGORY_THEME = {
  1: { name: 'Friends Intro', bgColor: '#DCFCE7', icon: iconRelations },
  2: { name: 'Friends Fun', bgColor: '#FEF3C7', icon: iconRelations },
  3: { name: 'Friends Bond', bgColor: '#E0E7FF', icon: iconRelations },
};

const DEFAULT_THEME = { name: 'Default', bgColor: '#F97373', icon: null };
const FRIEND_ROULETTE_MAX_PLAYERS = 15;

// שכבות החפיסה
const DECK_LAYERS = [
  { rotate: '-6deg', translate: -4, zIndex: 1, opacity: 0.85, scale: 0.92 },
  { rotate: '4deg', translate: -2, zIndex: 2, opacity: 0.95, scale: 0.96 },
  { rotate: '0deg', translate: 0, zIndex: 3, opacity: 1.0, scale: 1.0 },
];

export default function FriendsCardsGame({ route, navigation }) {
  // ✅ חשוב: rerender כששפה משתנה
  const { lang } = useLanguage();
  const t = (key, vars) => i18n.t(key, vars);

  const { cards = [], players: routePlayers = [], selection } = route?.params || {};
  const initialRouletteEnabled = Boolean(route?.params?.rouletteEnabled || selection?.rouletteEnabled);
  const isResearchGame = Boolean(selection?.research);
  const currentUserId = getCurrentUserId(route);
  const [cardsState, setCardsState] = useState(cards);

  const initialPlayers = useMemo(
    () =>
      Array.isArray(routePlayers)
        ? routePlayers
            .filter((p) => p && p.trim().length > 0)
            .slice(0, FRIEND_ROULETTE_MAX_PLAYERS)
        : [],
    [routePlayers],
  );
  const [players, setPlayers] = useState(initialPlayers);

  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  // ✅ פונקציות טקסטים (במקום strings קשיחים)
  const categoryName = (id) =>
    id === 1
      ? t('friendsCardsGame.categories.intro')
      : id === 2
      ? t('friendsCardsGame.categories.fun')
      : t('friendsCardsGame.categories.team');

  const levelName = (id) =>
    id === 1 ? t('friendsCardsGame.levels.easy') : id === 2 ? t('friendsCardsGame.levels.medium') : t('friendsCardsGame.levels.hard');

  const getPlayerDisplayName = (index) =>
    players[index]?.trim() ||
    `${t('common.playerRoulette.playerPlaceholder', { defaultValue: 'Player' })} ${index + 1}`;

  // אם אין שחקנים – מחזירים למסך בחירה
  if (!players.length) {
    return (
      <View style={styles.emptyContainer} key={lang}>
        <Text style={styles.emptyText}>{t('friendsCardsGame.empty.noPlayers')}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.navigate('FriendsCardsSelect', {
              userId: getCurrentUserId(route),
            })
          }
        >
          <Text style={styles.backButtonText}>{t('friendsCardsGame.empty.backToSelect')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [rouletteVisible, setRouletteVisible] = useState(false);
  const [rouletteSelectedIndex, setRouletteSelectedIndex] = useState(0);
  const [rouletteEnabledForSession, setRouletteEnabledForSession] = useState(initialRouletteEnabled);
  const [rouletteDisabledForSession, setRouletteDisabledForSession] = useState(false);
  const rouletteActive = rouletteEnabledForSession && !rouletteDisabledForSession && players.length > 1;
  const [turnReady, setTurnReady] = useState(() => !rouletteActive);

  // --- אנימציות ---
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;
  const flyOutAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.spring(entryAnim, {
        toValue: 1,
        friction: 5,
        tension: 30,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [entryAnim, pulseAnim]);

  useEffect(() => {
    setCardsState(cards);
    setRemaining(new Set(cards.map((c) => c.cardID ?? c.CardID ?? c.id)));
    setTurnReady(!rouletteActive);
  }, [cards, rouletteActive]);

  // --- לוגיקה של קלפים ---
  const mapById = useMemo(() => {
    const m = new Map();
    for (const c of cardsState) {
      const id = c.cardID ?? c.CardID ?? c.id;
      m.set(id, c);
    }
    return m;
  }, [cardsState]);

  const [remaining, setRemaining] = useState(
    () => new Set(cards.map((c) => c.cardID ?? c.CardID ?? c.id)),
  );
  const [currentCardId, setCurrentCardId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [lastCombo, setLastCombo] = useState(null);
  const [deckCompleteBurstKey, setDeckCompleteBurstKey] = useState(0);
  useDeckCompleteSound(deckCompleteBurstKey);

  // משוב
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(null);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSuccessBloomKey, setFeedbackSuccessBloomKey] = useState(0);
  const [shareVisible, setShareVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    onOk: null,
  });

  const remainingCount = remaining.size;
  const totalCount = cardsState.length;

  const showAlert = (type, title, message, onOk = null) => {
    setAlertConfig({ visible: true, type, title, message, onOk });
  };

  const handleAlertClose = () => {
    const callback = alertConfig.onOk;
    setAlertConfig((prev) => ({ ...prev, visible: false, onOk: null }));
    if (typeof callback === 'function') callback();
  };

  const advanceTurn = () => {
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
  };

  const openRoulette = () => {
    setRouletteSelectedIndex((prev) => Math.max(0, Math.min(prev, players.length - 1)));
    setRouletteVisible(true);
  };

  useEffect(() => {
    if (!rouletteActive) {
      setTurnReady(true);
      return;
    }

    if (remainingCount > 0 && !showModal && !rouletteVisible && !turnReady) {
      openRoulette();
    }
  }, [remainingCount, rouletteActive, rouletteVisible, showModal, turnReady]);

  const revealRandomCard = () => {
    if (remaining.size === 0) return;
    const ids = Array.from(remaining);
    const randIdx = Math.floor(Math.random() * ids.length);
    const id = ids[randIdx];
    const chosen = mapById.get(id);
    if (!chosen) return;

    setCurrentCardId(id);
    setShowModal(true);
  };

  const drawCardForPlayer = (playerIndex = currentPlayerIndex) => {
    setCurrentPlayerIndex(playerIndex);
    if (remainingCount === 0) {
      showAlert(
        'info',
        t('friendsCardsGame.alerts.deckEmptyTitle'),
        t('friendsCardsGame.alerts.deckEmptyMessage'),
        () =>
          navigation.navigate('FriendsCardsSelect', {
            userId: getCurrentUserId(route),
          })
      );
      return;
    }

    Animated.timing(flyOutAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start(() => {
      flyOutAnim.setValue(0);
      revealRandomCard();
    });
  };

  const handleDrawPress = () => {
    if (remainingCount === 0) {
      drawCardForPlayer();
      return;
    }

    if (rouletteActive && !turnReady) {
      openRoulette();
      return;
    }

    drawCardForPlayer();
  };

  const handleRouletteContinue = (playerIndex) => {
    setCurrentPlayerIndex(playerIndex);
    setTurnReady(true);
    setRouletteVisible(false);
  };

  const disableRouletteForSession = () => {
    setRouletteDisabledForSession(true);
    setRouletteVisible(false);
    setTurnReady(true);
  };

  const enableRouletteForSession = () => {
    setRouletteEnabledForSession(true);
    setRouletteDisabledForSession(false);
    if (remainingCount > 0 && !showModal) {
      setTurnReady(false);
    }
  };

  const closeCardModal = () => setShowModal(false);

  const finishCard = () => {
    const shouldCelebrateDeckComplete = remainingCount === 1 && !!currentCardId;
    if (currentCardId) {
      const card = mapById.get(currentCardId);
      if (card) {
        setLastCombo({
          categoryID: card.CategoryID ?? card.categoryID,
          levelID: card.LevelID ?? card.levelID,
        });
        setRemaining((prev) => {
          const n = new Set(prev);
          n.delete(currentCardId);
          return n;
        });
        setRevealedCount((n) => n + 1);
      }
    }
    if (shouldCelebrateDeckComplete) {
      setDeckCompleteBurstKey((prev) => prev + 1);
    }
    if (rouletteActive) {
      setTurnReady(remainingCount <= 1);
    } else {
      advanceTurn();
    }
    setCurrentCardId(null);
    closeCardModal();
  };

  const skipCard = () => {
    const shouldCelebrateDeckComplete = remainingCount === 1 && !!currentCardId;
    if (currentCardId) {
      const card = mapById.get(currentCardId);
      if (card) {
        setLastCombo({
          categoryID: card.CategoryID ?? card.categoryID,
          levelID: card.LevelID ?? card.levelID,
        });
        setRemaining((prev) => {
          const n = new Set(prev);
          n.delete(currentCardId);
          return n;
        });
      }
    }
    if (shouldCelebrateDeckComplete) {
      setDeckCompleteBurstKey((prev) => prev + 1);
    }
    if (rouletteActive) {
      setTurnReady(remainingCount <= 1);
    } else {
      advanceTurn();
    }
    setCurrentCardId(null);
    closeCardModal();
  };

  const openFeedbackModal = () => {
    if (!currentCardId) return;
    const userId = getCurrentUserId(route);
    if (!userId || userId <= 0) {
      showAlert(
        'error',
        t('friendsCardsGame.alerts.errorTitle'),
        t('friendsCardsGame.alerts.noUserForFeedback')
      );
      return;
    }
    setFeedbackText('');
    setFeedbackRating(null);
    setFeedbackModalVisible(true);
  };

  const closeFeedbackModal = () => {
    setFeedbackModalVisible(false);
    setFeedbackText('');
    setFeedbackRating(null);
  };

  const submitFeedback = async () => {
    if (!currentCardId) return;
    const card = mapById.get(currentCardId);
    if (!card) return;

    const userId = getCurrentUserId(route);
    if (!userId || userId <= 0) {
      showAlert(
        'error',
        t('friendsCardsGame.alerts.errorTitle'),
        t('friendsCardsGame.alerts.noUserLogged')
      );
      return;
    }

    if (!feedbackText.trim()) {
      showAlert(
        'warning',
        t('friendsCardsGame.alerts.feedbackMissingTitle'),
        t('friendsCardsGame.alerts.feedbackMissingMessage')
      );
      return;
    }

    const payload = {
      UserID: userId,
      CardID: card.CardID ?? card.cardID ?? card.id ?? 0,
      Rating: feedbackRating ?? DEFAULT_CARD_FEEDBACK_RATING,
      Comment: feedbackText.trim(),
    };

    try {
      setSendingFeedback(true);
      await submitFeedbackRequest({
        userId: payload.UserID,
        cardId: payload.CardID,
        rating: payload.Rating,
        comment: payload.Comment,
      });

      setFeedbackSuccessBloomKey((prev) => prev + 1);
      await new Promise((resolve) => setTimeout(resolve, 700));
      showAlert(
        'success',
        t('friendsCardsGame.alerts.thanksTitle'),
        t('friendsCardsGame.alerts.feedbackSent')
      );
      closeFeedbackModal();
    } catch (err) {
      showAlert(
        'error',
        t('friendsCardsGame.alerts.errorTitle'),
        t('friendsCardsGame.alerts.feedbackFailed')
      );
    } finally {
      setSendingFeedback(false);
    }
  };

  const currentCard = currentCardId != null ? mapById.get(currentCardId) : null;

  const handleCardStatusChanged = ({ cardId, likeStatus }) => {
    setCardsState((prev) =>
      prev.map((card) => {
        const id = card.cardID ?? card.CardID ?? card.id;
        if (id !== cardId) {
          return card;
        }

        return {
          ...card,
          LikeStatus: likeStatus,
          likeStatus,
        };
      }),
    );
  };

  const handleFeedbackSubmitPress = () => {
    submitFeedback();
  };

  const openShareModal = () => {
    if (!currentCard) return;
    setShareVisible(true);
  };

  const closeShareModal = () => {
    setShareVisible(false);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () =>
      !showModal && !rouletteVisible && turnReady && remainingCount > 0,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (e, gesture) => {
      const threshold = 80;
      if (Math.abs(gesture.dx) > threshold) {
        Animated.timing(pan.x, {
          toValue: gesture.dx > 0 ? 400 : -400,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          pan.setValue({ x: 0, y: 0 });
          if (!showModal && remainingCount > 0) {
            if (rouletteActive && !turnReady) {
              openRoulette();
            } else {
              revealRandomCard();
            }
          }
        });
      } else {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const rawCategoryId = currentCard?.CategoryID ?? currentCard?.categoryID ?? null;
  const currentCategoryId = rawCategoryId !== null ? Number(rawCategoryId) : null;
  const currentTheme = (currentCategoryId && CATEGORY_THEME[currentCategoryId]) || DEFAULT_THEME;
  const currentPlayerDisplayName = getPlayerDisplayName(currentPlayerIndex);

  return (
    <View style={[styles.screen, isResearchGame && styles.screenResearch]} key={lang}>
      <View pointerEvents="none" style={styles.deckCompleteOverlay}>
        <DeckCompleteBurst triggerKey={deckCompleteBurstKey} />
      </View>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />
      {/* כותרת עליונה */}
      <View style={styles.header}>
        <Text style={styles.gameTitle}>{t('friendsCardsGame.header.title')}</Text>
        <Text style={styles.gameSubTitle}>{t('friendsCardsGame.header.subtitle')}</Text>
        {isResearchGame && (
          <View style={styles.researchBadge}>
            <MaterialCommunityIcons name="book-open-page-variant" size={14} color="#0F766E" />
            <Text style={styles.researchBadgeText}>מחקר</Text>
          </View>
        )}
      </View>

      {/* חצי עליון: חפיסת הקלפים */}
      <View style={styles.topHalf}>
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
                  ? flyOutAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -180] })
                  : 0;
                const flyRotate = isTopCard
                  ? flyOutAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] })
                  : '0deg';
                const flyOpacity = isTopCard
                  ? flyOutAnim.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0] })
                  : 1;

                const baseTransforms = [
                  { rotate: animatedRotate },
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
                      <Image source={logo1} style={styles.cardLogo} resizeMode="contain" />
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
              <Text style={styles.emptyTitle}>{t('friendsCardsGame.deck.emptyTitle')}</Text>
              <Text style={styles.emptySub}>{t('friendsCardsGame.deck.emptySubtitle')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* חצי תחתון */}
      <View style={styles.bottomHalf}>
        <View style={styles.controlsBox}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.drawBtn,
                (remainingCount === 0 || showModal || rouletteVisible || !turnReady) && styles.btnDisabled,
              ]}
              onPress={handleDrawPress}
              disabled={remainingCount === 0 || showModal || rouletteVisible || !turnReady}
            >
              <Text style={styles.btnText}>{t('friendsCardsGame.buttons.draw')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.backBtn]}
              onPress={() =>
                navigation.navigate('FriendsCardsSelect', {
                  userId: getCurrentUserId(route),
                })
              }
            >
              <Text style={styles.btnTextDark}>{t('friendsCardsGame.buttons.selectCards')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.title}>{t('friendsCardsGame.status.title')}</Text>
          <Text style={styles.subTitle}>
            {t('friendsCardsGame.status.done', { revealedCount, totalCount })}
          </Text>

          <View style={styles.playerTurnBadge}>
            <Text style={styles.playerTurnLabel}>{t('friendsCardsGame.status.nowTurn')}</Text>
            <Text style={styles.playerTurnName}>{currentPlayerDisplayName}</Text>
          </View>

          {!rouletteActive && players.length > 1 && remainingCount > 0 && !showModal && (
            <TouchableOpacity
              style={styles.enableRouletteButton}
              onPress={enableRouletteForSession}
              activeOpacity={0.82}
            >
              <Text style={styles.enableRouletteText}>
                {t('common.playerRoulette.enableButton', { defaultValue: 'Play with roulette' })}
              </Text>
            </TouchableOpacity>
          )}

          {lastCombo ? (
            <View
              style={[
                styles.lastCardBox,
                { borderColor: CAT_COLORS[lastCombo.categoryID] || '#3F51B5' },
              ]}
            >
              <Text
                style={[
                  styles.lastCardTitle,
                  { color: CAT_COLORS[lastCombo.categoryID] || '#3F51B5' },
                ]}
              >
                {t('friendsCardsGame.status.lastCardTitle')}
              </Text>
              <Text style={styles.lastCardText}>
                {categoryName(lastCombo.categoryID)} ({heartsByCat[lastCombo.categoryID]}) •{' '}
                {levelName(lastCombo.levelID)} ({stars(lastCombo.levelID)})
              </Text>
            </View>
          ) : (
            <Text style={styles.hint}>{t('friendsCardsGame.status.hint')}</Text>
          )}
        </View>
      </View>

      <PlayerRouletteOverlay
        visible={rouletteVisible}
        players={players}
        selectedIndex={rouletteSelectedIndex}
        onContinue={handleRouletteContinue}
        title={t('common.playerRoulette.title', { defaultValue: 'Who draws the card?' })}
        idleLabel={t('common.playerRoulette.idle', { defaultValue: 'Spin the wheel with your finger, or tap the button.' })}
        spinningLabel={t('common.playerRoulette.spinning', { defaultValue: 'The wheel is choosing...' })}
        selectedLabel={t('common.playerRoulette.selected', { defaultValue: 'The turn goes to' })}
        spinLabel={t('common.playerRoulette.spinButton', { defaultValue: 'Spin' })}
        continueLabel={t('common.playerRoulette.continueButton', { defaultValue: 'Go to the card' })}
        disableLabel={t('common.playerRoulette.disableButton', { defaultValue: 'Play without roulette' })}
        addPlayerLabel={t('common.playerRoulette.addPlayerButton', { defaultValue: 'Add player' })}
        maxPlayersReachedLabel={t('common.playerRoulette.maxPlayersReached', {
          defaultValue: `Max ${FRIEND_ROULETTE_MAX_PLAYERS} players`,
          count: FRIEND_ROULETTE_MAX_PLAYERS,
        })}
        playerPlaceholder={t('common.playerRoulette.playerPlaceholder', { defaultValue: 'Player' })}
        onPlayersChange={setPlayers}
        onDisable={disableRouletteForSession}
        maxPlayers={FRIEND_ROULETTE_MAX_PLAYERS}
      />

      <GameCardModal
        visible={showModal}
        currentCard={currentCard}
        currentCardId={currentCardId}
        currentCategoryId={currentCategoryId}
        currentTheme={currentTheme}
        currentPlayerName={currentPlayerDisplayName}
        categoryName={categoryName}
        levelName={levelName}
        onSkip={skipCard}
        onFinish={finishCard}
        onFeedback={openFeedbackModal}
        onShare={openShareModal}
        turnText={t('friendsCardsGame.card.turnOf', { name: currentPlayerDisplayName })}
        showCardStatusBar
        researchMode={isResearchGame}
        cardStatusBarProps={{
          userId: currentUserId,
          onStatusChanged: handleCardStatusChanged,
        }}
        categoryColors={CAT_COLORS}
        footerIconsByCategory={heartsByCat}
      />

      <ShareCardModal
        visible={shareVisible}
        onClose={closeShareModal}
        currentCard={currentCard}
        userId={currentUserId}
        gameType="friends"
        lang={lang}
      />

      {/* --- מודאל משוב --- */}
      <Modal visible={feedbackModalVisible} transparent animationType="fade" onRequestClose={closeFeedbackModal}>
        <Pressable style={styles.backdrop} onPress={closeFeedbackModal}>
          <View style={styles.feedbackModalWrapper} onStartShouldSetResponder={() => true}>
            <Text style={styles.feedbackTitle}>{t('friendsCardsGame.feedback.title')}</Text>
            <Text style={styles.feedbackSubtitle}>{t('friendsCardsGame.feedback.subtitle')}</Text>

            <ScrollView>
              <Text style={styles.feedbackInfoText}>
                {t('friendsCardsGame.feedback.info')}
              </Text>
            </ScrollView>

            <FeedbackRatingStars
              selectedRating={feedbackRating}
              onRatingChange={setFeedbackRating}
              onClearRating={() => setFeedbackRating(null)}
            />

            <View style={{ marginTop: 10 }}>
              <TextInput
                style={styles.feedbackInput}
                placeholder={t('friendsCardsGame.feedback.placeholder')}
                placeholderTextColor="rgba(0,0,0,0.35)"
                multiline
                maxLength={300}
                value={feedbackText}
                onChangeText={setFeedbackText}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.feedbackButtonsRow}>
              <TouchableOpacity
                style={[styles.feedbackBtn, { backgroundColor: '#9CA3AF' }]}
                onPress={closeFeedbackModal}
                disabled={sendingFeedback}
              >
                <Text style={styles.feedbackBtnText}>{t('friendsCardsGame.feedback.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feedbackBtn,
                  { backgroundColor: '#2563EB', opacity: sendingFeedback ? 0.6 : 1 },
                ]}
                onPress={handleFeedbackSubmitPress}
                disabled={sendingFeedback}
              >
                <SoftBloom triggerKey={feedbackSuccessBloomKey} scale={2.2} />
                <Text style={styles.feedbackBtnText}>
                  {sendingFeedback ? t('friendsCardsGame.feedback.sending') : t('friendsCardsGame.feedback.send')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ================= עיצוב ======================
const styles = StyleSheet.create({
  // (הסטיילים שלך נשארים אותו דבר)
  // רק הוספתי style קטן לטקסט מידע במודאל משוב:
  feedbackInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'right',
  },

  // --- כל השאר 그대로 מהקובץ שלך ---
  screen: { flex: 1, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'space-between' },
  screenResearch: { backgroundColor: '#F0FDFA' },
  deckCompleteOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 60,
    elevation: 30,
  },
  header: { paddingTop: 40, paddingBottom: 10, alignItems: 'center' },
  gameTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  gameSubTitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  researchBadge: {
    minHeight: 28,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.22)',
    marginTop: 8,
  },
  researchBadgeText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '900',
  },
  topHalf: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
  bottomHalf: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 16, paddingBottom: 10 },
  deckContainer: { height: W * 0.7, justifyContent: 'center', alignItems: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  cardStackWrapper: { position: 'relative', width: W * 0.65, height: W * 0.95, alignItems: 'center', justifyContent: 'center' },
  premiumCardBack: { position: 'absolute', width: '100%', height: '100%', borderRadius: 24, backgroundColor: '#1E293B', borderWidth: 2, borderColor: '#6366F1', padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 8 },
  innerBorder: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', overflow: 'hidden' },
  cardLogo: { width: '80%', height: '80%', opacity: 0.9 },
  countBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#F97316', minWidth: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 20, elevation: 10, borderWidth: 2, borderColor: '#fff' },
  countText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  emptyBox: { padding: 30, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', elevation: 5 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptySub: { fontSize: 15, color: '#666', marginTop: 5 },
  controlsBox: { width: W, marginBottom: 16 },
  controlsRow: { flexDirection: 'row', gap: 15, justifyContent: 'space-between' },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 50, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: 1 },
  btnTextDark: { color: '#555', fontWeight: '700', fontSize: 15 },
  drawBtn: { backgroundColor: '#F97316', flex: 1.5 },
  backBtn: { backgroundColor: '#fff', flex: 1, borderWidth: 1, borderColor: '#eee' },
  btnDisabled: { opacity: 0.6, backgroundColor: '#ccc' },
  statusBox: { width: W, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#fff' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  subTitle: { fontSize: 14, color: '#666', marginBottom: 15 },
  playerTurnBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#22C55E' },
  playerTurnLabel: { fontSize: 14, color: '#555', marginRight: 6 },
  playerTurnName: { fontSize: 18, fontWeight: 'bold', color: '#15803D' },
  enableRouletteButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    marginTop: -6,
    marginBottom: 13,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  enableRouletteText: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  hint: { marginTop: 10, fontSize: 14, color: '#888', fontStyle: 'italic', textAlign: 'center' },
  lastCardBox: { marginTop: 5, padding: 15, backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: '#eee' },
  lastCardTitle: { fontSize: 12, color: '#999', marginBottom: 4 },
  lastCardText: { fontSize: 16, fontWeight: '600', color: '#333' },
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.85)' },
  modalCenterWrapper: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  modalCardWrapper: { width: '85%', maxWidth: 340 },
  modalCardPhysicalBase: { backgroundColor: '#fff', borderRadius: 30, padding: 10, elevation: 25, maxHeight: SCREEN_HEIGHT * 0.9 },
  modalCardInnerContent: { width: '100%', minHeight: SCREEN_HEIGHT * 0.75, maxHeight: SCREEN_HEIGHT * 0.88, borderRadius: 22, padding: 25, justifyContent: 'space-between' },
  modalCardIconBg: { position: 'absolute', width: 200, height: 200, bottom: -20, right: -20, opacity: 0.15 },
  modalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalCategoryText: { fontSize: 22, fontWeight: '900', color: '#333', letterSpacing: 1 },
  modalLevelText: { fontSize: 12, fontWeight: 'bold', color: '#555', backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  turnBadge: { backgroundColor: 'rgba(255,255,255,0.9)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 10, fontSize: 14, fontWeight: 'bold', color: '#333', overflow: 'hidden' },
  cardDivider: { height: 2, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20, width: '40%', alignSelf: 'center' },
  modalCardBodyScroll: { flex: 1, maxHeight: SCREEN_HEIGHT * 0.45 },
  modalScrollContent: { justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  modalCardBodyText: { fontSize: 24, lineHeight: 36, fontWeight: '600', color: '#1F2937', textAlign: 'center' },
  modalCardFooter: { marginTop: 10, alignItems: 'center' },
  footerIcons: { fontSize: 18 },
  modalActionsRow: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-evenly', width: '100%' },
  actionBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4 },
  actionText: { fontSize: 10, color: '#fff', fontWeight: 'bold', marginTop: 2, textAlign: 'center' },
  feedbackModalWrapper: { width: '85%', backgroundColor: '#fff', borderRadius: 25, padding: 25 },
  feedbackTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  feedbackSubtitle: { textAlign: 'center', color: '#777', marginBottom: 20 },
  feedbackInput: { backgroundColor: '#f9f9f9', borderRadius: 15, padding: 15, height: 120, textAlignVertical: 'top', fontSize: 16 },
  feedbackButtonsRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
  feedbackBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', position: 'relative', overflow: 'visible' },
  feedbackBtnText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { flex: 1, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', padding: 16 },
  emptyText: { fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 16 },
  backButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#4F46E5' },
  backButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
