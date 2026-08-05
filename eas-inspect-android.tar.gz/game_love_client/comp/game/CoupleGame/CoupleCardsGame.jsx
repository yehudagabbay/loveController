import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import logo1 from '../../../assets/images/logo1.png';

import i18n from '../../../src/localization/i18n';
import { useLanguage } from '../../../src/localization/LanguageContext';
import DeckCompleteBurst from '../../animations/DeckCompleteBurst';

import iconLove from '../../../assets/images/icons/love.png';

import CustomAlert from '../../Settings/CustomAlert';
import FeedbackModal from '../../gameModals/FeedbackModal';
import AnimatedDeck from '../../gameModals/AnimatedDeck';
import GameCardModal from '../../gameModals/GameCardModal';
import ShareCardModal from '../../gameModals/ShareCardModal';
import { submitFeedback as submitFeedbackRequest } from '../../../assets/utils/ApiTools';

const W = Math.min(
  520,
  Math.max(320, Math.round(Dimensions.get('window').width - 40)),
);

const getCurrentUserId = (route) =>
  route?.params?.userId ??
  route?.params?.user?.UserID ??
  0;

const CAT_COLORS = { 1: '#1976D2', 2: '#009688', 3: '#E91E63' };
const heartsByCat = { 1: '🥂', 2: '🤩', 3: '🔥' };
const stars = (n) => '⭐'.repeat(Math.max(1, Math.min(3, n)));

const CATEGORY_THEME = {
  1: { name: 'Relations', bgColor: '#FDB4A4', icon: iconLove },
  2: { name: 'Fun', bgColor: '#FBB6E1', icon: iconLove },
  3: { name: 'Love', bgColor: '#FCD29F', icon: iconLove },
};

const DEFAULT_THEME = {
  name: 'Default',
  bgColor: '#F97373',
  icon: null,
};

export default function CoupleCardsGame({ route, navigation }) {
  const { cards = [], players: routePlayers = [], selection } = route?.params || {};
  const isResearchGame = Boolean(selection?.research);
  const currentUserId = getCurrentUserId(route);
  const [cardsState, setCardsState] = useState(cards);

  useEffect(() => {
    setCardsState(cards);
    setRemaining(new Set(cards.map((c) => c.cardID ?? c.CardID ?? c.id)));
  }, [cards]);

  const { lang } = useLanguage();
  const categoryName = (id) => i18n.t(`indexGame.category.name.${String(id)}`);
  const levelName = (id) => i18n.t(`indexGame.level.name.${String(id)}`);

  const players = useMemo(() => {
    if (
      Array.isArray(routePlayers) &&
      routePlayers.filter((p) => p && p.trim().length > 0).length >= 2
    ) {
      return routePlayers.filter((p) => p && p.trim().length > 0);
    }
    return ['שחקן 1', 'שחקן 2'];
  }, [routePlayers]);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

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

  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSuccessBloomKey, setFeedbackSuccessBloomKey] = useState(0);

  const [shareVisible, setShareVisible] = useState(false);
  // מצב זמני של כפתור "אהבתי במיוחד".
  // כרגע זה רק מצב תצוגה במסך הזוגות.
  // בהמשך אפשר להשתמש בערך הזה כדי לשנות את שליפת הכרטיסים מהשרת.

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'success',
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

  const remainingCount = remaining.size;
  const totalCount = cardsState.length;

  const advanceTurn = () => {
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
  };

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

  const handleDrawPress = () => {
    if (remainingCount === 0) {
      showAlert(
        'error',
        i18n.t('indexGame.alerts.noCardsTitle'),
        i18n.t('indexGame.alerts.noCardsMessage'),
        () => navigation.navigate('GameHome')
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

  const closeCardModal = () => {
    setShowModal(false);
  };

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

    advanceTurn();
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

    advanceTurn();
    setCurrentCardId(null);
    closeCardModal();
  };

  const openFeedbackModal = () => {
    if (!currentCardId) return;

    const userId = getCurrentUserId(route);
    if (!userId || userId <= 0) {
      showAlert(
        'error',
        i18n.t('indexGame.alerts.noUserTitle'),
        i18n.t('indexGame.alerts.noUserMessage')
      );
      return;
    }

    setFeedbackText('');
    setFeedbackModalVisible(true);
  };

  const closeFeedbackModal = () => {
    setFeedbackModalVisible(false);
    setFeedbackText('');
  };

  const submitFeedback = async () => {
    if (!currentCardId) return;

    const card = mapById.get(currentCardId);
    if (!card) return;

    const userId = getCurrentUserId(route);
    if (!userId || userId <= 0) {
      showAlert(
        'error',
        i18n.t('indexGame.alerts.noUserTitle'),
        i18n.t('indexGame.alerts.noUserMessage')
      );
      return;
    }

    if (!feedbackText.trim()) {
      showAlert(
        'error',
        i18n.t('indexGame.alerts.feedbackMissingTitle'),
        i18n.t('indexGame.alerts.feedbackMissingMessage')
      );
      return;
    }

    const payload = {
      UserID: userId,
      CardID: card.CardID ?? card.cardID ?? card.id ?? 0,
      Rating: 5,
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
      closeFeedbackModal();

      showAlert(
        'success',
        i18n.t('indexGame.alerts.thanksTitle'),
        i18n.t('indexGame.alerts.thanksMessage')
      );
    } catch (err) {
      showAlert(
        'error',
        i18n.t('indexGame.alerts.feedbackErrorTitle'),
        i18n.t('indexGame.alerts.feedbackErrorMessage')
      );
    } finally {
      setSendingFeedback(false);
    }
  };

  const currentCard =
    currentCardId != null ? mapById.get(currentCardId) : null;

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

  const openShareModal = () => {
    if (!currentCard) return;
    setShareVisible(true);
  };

  const closeShareModal = () => {
    setShareVisible(false);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !showModal && remainingCount > 0,
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
            revealRandomCard();
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

  const rawCategoryId =
    currentCard?.CategoryID ?? currentCard?.categoryID ?? null;
  const currentCategoryId =
    rawCategoryId !== null ? Number(rawCategoryId) : null;
  const currentTheme =
    (currentCategoryId && CATEGORY_THEME[currentCategoryId]) ||
    DEFAULT_THEME;

  return (
    <View style={[styles.screen, isResearchGame && styles.screenResearch]}>
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

      <View style={styles.header}>
        <Text style={styles.gameTitle}>{i18n.t('indexGame.title')}</Text>
        <Text style={styles.gameSubTitle}>{i18n.t('indexGame.subtitle')}</Text>
        {isResearchGame && (
          <View style={styles.researchBadge}>
            <MaterialCommunityIcons name="book-open-page-variant" size={14} color="#0F766E" />
            <Text style={styles.researchBadgeText}>מחקר</Text>
          </View>
        )}
      </View>

      <View style={styles.topHalf}>
        <AnimatedDeck
          remainingCount={remainingCount}
          entryAnim={entryAnim}
          pulseAnim={pulseAnim}
          flyOutAnim={flyOutAnim}
          pan={pan}
          panResponder={panResponder}
          logoSource={logo1}
          emptyTitle={i18n.t('indexGame.empty.title')}
          emptySubtitle={i18n.t('indexGame.empty.subtitle')}
        />
      </View>

      <View style={styles.bottomHalf}>
        <View style={styles.controlsBox}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.drawBtn,
                (remainingCount === 0 || showModal) && styles.btnDisabled,
              ]}
              onPress={handleDrawPress}
              disabled={remainingCount === 0 || showModal}
            >
              <Text style={styles.btnText}>
                {i18n.t('indexGame.buttons.draw')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.backBtn]}
              onPress={() => navigation.navigate('GameHome')}
            >
              <Text style={styles.btnTextDark}>
                {i18n.t('indexGame.buttons.settings')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.title}>{i18n.t('indexGame.status.title')}</Text>
          {/*

            title="אהבתי במיוחד"
            subtitle="בחרו אם להציג בעתיד רק כרטיסים שסומנו כאהבתי במיוחד"
          />

          */}
          <Text style={styles.subTitle}>
            {i18n.t('indexGame.status.doneCards', { revealedCount, totalCount })}
          </Text>

          <View style={styles.playerTurnBadge}>
            <Text style={styles.playerTurnLabel}>
              {i18n.t('indexGame.status.turnNow')}
            </Text>
            <Text style={styles.playerTurnName}>
              {players[currentPlayerIndex]}
            </Text>
          </View>

          {lastCombo ? (
            <View
              style={[
                styles.lastCardBox,
                {
                  borderColor: CAT_COLORS[lastCombo.categoryID] || '#3F51B5',
                },
              ]}
            >
              <Text
                style={[
                  styles.lastCardTitle,
                  {
                    color: CAT_COLORS[lastCombo.categoryID] || '#3F51B5',
                  },
                ]}
              >
                {i18n.t('indexGame.status.lastCardTitle')}
              </Text>

              <Text style={styles.lastCardText}>
                {categoryName(lastCombo.categoryID)} (
                {heartsByCat[lastCombo.categoryID]}) •{' '}
                {levelName(lastCombo.levelID)} ({stars(lastCombo.levelID)})
              </Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              {i18n.t('indexGame.status.hint')}
            </Text>
          )}
        </View>
      </View>

      <GameCardModal
        visible={showModal}
        currentCard={currentCard}
        currentCardId={currentCardId}
        currentCategoryId={currentCategoryId}
        currentTheme={currentTheme}
        currentPlayerName={players[currentPlayerIndex]}
        categoryName={categoryName}
        levelName={levelName}
        onSkip={skipCard}
        onFinish={finishCard}
        onFeedback={openFeedbackModal}
        onShare={openShareModal}
        showCardStatusBar
        researchMode={isResearchGame}
        cardStatusBarProps={{
          userId: currentUserId,
          onStatusChanged: handleCardStatusChanged,
        }}
      />

      <ShareCardModal
        visible={shareVisible}
        onClose={closeShareModal}
        currentCard={currentCard}
        userId={currentUserId}
        gameType="couples"
        lang={lang}
      />

      <FeedbackModal
        visible={feedbackModalVisible}
        feedbackText={feedbackText}
        onChangeText={setFeedbackText}
        onClose={closeFeedbackModal}
        onSubmit={submitFeedback}
        successBloomKey={feedbackSuccessBloomKey}
        sendingFeedback={sendingFeedback}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenResearch: {
    backgroundColor: '#F0FDFA',
  },
  deckCompleteOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 60,
    elevation: 30,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  gameSubTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
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
  topHalf: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  bottomHalf: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  controlsBox: {
    width: W,
    marginBottom: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 1,
  },
  btnTextDark: {
    color: '#555',
    fontWeight: '700',
    fontSize: 15,
  },
  drawBtn: {
    backgroundColor: '#FF4081',
    flex: 1.5,
  },
  backBtn: {
    backgroundColor: '#fff',
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
  },
  btnDisabled: {
    opacity: 0.6,
    backgroundColor: '#ccc',
  },
  statusBox: {
    width: W,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  playerTurnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  playerTurnLabel: {
    fontSize: 14,
    color: '#555',
    marginRight: 6,
  },
  playerTurnName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  hint: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  lastCardBox: {
    marginTop: 5,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  lastCardTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  lastCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
