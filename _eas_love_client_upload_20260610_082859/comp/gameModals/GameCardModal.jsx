// comp/gameModals/GameCardModal.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import i18n from '../../src/localization/i18n';
import { GameTimer } from '../Settings/GameTimer';
import CardStatusBar from './CardStatusBar';

const CAT_COLORS = { 1: '#1976D2', 2: '#009688', 3: '#E91E63' };
const heartsByCat = { 1: '💙', 2: '💙💙', 3: '💙💙💙' };
const stars = (n) => '⭐'.repeat(Math.max(1, Math.min(3, n)));
const isValidImageSource = (source) =>
  typeof source === 'number' ||
  !!(source && typeof source === 'object' && typeof source.uri === 'string');

export default function GameCardModal({
  visible,
  currentCard,
  currentCardId,
  currentCategoryId,
  currentTheme,
  currentPlayerName,
  categoryName,
  levelName,
  onSkip,
  onFinish,
  onFeedback,
  onShare,
  turnText,
  labels,
  categoryColors = CAT_COLORS,
  footerIconsByCategory = heartsByCat,
  showShare = true,
  showCardStatusBar = false,
  cardStatusBarProps,
  researchMode = false,
  researchLabel = 'מחקר',
}) {
  const [showTimer, setShowTimer] = useState(false);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  useEffect(() => {
    setShowTimer(false);
  }, [visible, currentCardId]);

  const currentLikeStatus =
    currentCard?.likeStatus ??
    currentCard?.LikeStatus ??
    0;
  const isLikedCard = Number(currentLikeStatus) > 0;
  const likedFlagLabel = i18n.t('indexGame.card.reactions.like', {
    defaultValue: 'Liked',
  });
  const resolvedLabels = {
    done: i18n.t('indexGame.card.actions.done'),
    skip: i18n.t('indexGame.card.actions.skip'),
    feedback: i18n.t('indexGame.card.actions.feedback'),
    share: i18n.t('indexGame.card.actions.share', {
      defaultValue: 'Share',
    }),
    ...labels,
  };

  const verticalPaddingTop = Math.max(insets.top + 8, 16);
  const verticalPaddingBottom = Math.max(insets.bottom + 12, 24);
  const availableHeight = screenHeight - verticalPaddingTop - verticalPaddingBottom;
  const cardShellMaxHeight = Math.max(360, availableHeight - 150);
  const cardInnerMinHeight = Math.min(screenHeight * 0.68, cardShellMaxHeight - 20);
  const cardInnerMaxHeight = Math.max(cardInnerMinHeight, cardShellMaxHeight - 20);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <Pressable style={styles.backdrop} onPress={onSkip}>
        <View
          style={[
            styles.modalCenterWrapper,
            {
              paddingTop: verticalPaddingTop,
              paddingBottom: verticalPaddingBottom,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {!!currentCard && (
            <>
              <View style={styles.modalCardWrapper}>
                <View
                  style={[
                    styles.modalCardPhysicalBase,
                    { maxHeight: cardShellMaxHeight },
                  ]}
                >
                  <View
                    style={[
                      styles.modalCardInnerContent,
                      { backgroundColor: currentTheme?.bgColor || '#F97373' },
                      {
                        minHeight: cardInnerMinHeight,
                        maxHeight: cardInnerMaxHeight,
                      },
                      isLikedCard && styles.likedCardFrame,
                    ]}
                  >
                    {researchMode && (
                      <View style={styles.researchCardBadge}>
                        <MaterialCommunityIcons name="book-open-page-variant" size={13} color="#0F766E" />
                        <Text style={styles.researchCardBadgeText}>{researchLabel}</Text>
                      </View>
                    )}

                    {isLikedCard && (
                      <View style={styles.likedFlag}>
                        <Text style={styles.likedFlagText}>{likedFlagLabel}</Text>
                      </View>
                    )}

                    {isValidImageSource(currentTheme?.icon) && (
                      <Image
                        source={currentTheme.icon}
                        style={styles.modalCardIconBg}
                        resizeMode="contain"
                      />
                    )}

                    <View style={styles.modalCardHeader}>
                      <Text
                        style={[
                          styles.modalCategoryText,
                          {
                            color: categoryColors[currentCategoryId] || '#333',
                          },
                        ]}
                      >
                        {categoryName(currentCategoryId)}
                      </Text>

                      <Text style={styles.modalLevelText}>
                        {levelName(
                          currentCard.LevelID ?? currentCard.levelID
                        )}
                      </Text>
                    </View>

                    <Text style={styles.turnBadge}>
                      {turnText || i18n.t('indexGame.card.turnOf', { player: currentPlayerName })}
                    </Text>

                    <View style={styles.cardDivider} />

                    <ScrollView
                      style={styles.modalCardBodyScroll}
                      contentContainerStyle={styles.modalScrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      <Text style={styles.modalCardBodyText}>
                        {currentCard.cardDescription ??
                          currentCard.CardDescription ??
                          currentCard.description}
                      </Text>
                    </ScrollView>

                    <TouchableOpacity
                      style={[
                        styles.timerToggleButton,
                        showTimer && styles.timerToggleButtonActive,
                      ]}
                      onPress={() => setShowTimer((prev) => !prev)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.timerToggleIcon}>⏱</Text>
                      <Text style={styles.timerToggleText}>
                        {i18n.t('gameTimer.tabs.timer')}
                      </Text>
                    </TouchableOpacity>

                    {showTimer && (
                      <GameTimer
                        key={currentCardId}
                        initialMode="timer"
                        defaultTime={60}
                        compact
                      />
                    )}

                    <View style={styles.modalCardFooter}>
                      <Text style={styles.footerIcons}>
                        {footerIconsByCategory[currentCategoryId]}{' '}
                        {stars(currentCard.LevelID ?? currentCard.levelID)}
                      </Text>
                    </View>

                    {showCardStatusBar && (
                      <CardStatusBar
                        currentCard={currentCard}
                        initialLikeStatus={currentLikeStatus}
                        {...cardStatusBarProps}
                      />
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.modalActionsWrap}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#22C55E' }]}
                  onPress={onFinish}
                >
                  <Text style={styles.primaryActionText}>
                    {resolvedLabels.done}
                  </Text>
                </TouchableOpacity>

                <View style={styles.secondaryActionsRow}>
                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    onPress={onSkip}
                  >
                    <Text style={styles.secondaryActionText}>
                      {resolvedLabels.skip}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    onPress={onFeedback}
                  >
                    <Text style={styles.secondaryActionText}>
                      {resolvedLabels.feedback}
                    </Text>
                  </TouchableOpacity>

                  {showShare && (
                    <TouchableOpacity
                      style={styles.secondaryActionBtn}
                      onPress={onShare}
                    >
                      <Text style={styles.secondaryActionText}>
                        {resolvedLabels.share}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 62, 80, 0.85)',
  },
  modalCenterWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modalCardWrapper: {
    width: '85%',
    maxWidth: 340,
    marginBottom: 10,
  },
  modalCardPhysicalBase: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 10,
    elevation: 25,
    flexShrink: 1,
  },
  modalCardInnerContent: {
    width: '100%',
    borderRadius: 22,
    padding: 25,
    justifyContent: 'space-between',
  },
  researchCardBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    minHeight: 28,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(240,253,250,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.28)',
    zIndex: 3,
  },
  researchCardBadgeText: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '900',
  },
  likedCardFrame: {
    borderWidth: 3,
    borderColor: '#C2410C',
    shadowColor: '#FDBA74',
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  likedFlag: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: 'rgba(194,65,12,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    zIndex: 2,
    minWidth: 84,
    alignItems: 'center',
  },
  likedFlagText: {
    color: '#FFF7ED',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalCardIconBg: {
    position: 'absolute',
    width: 200,
    height: 200,
    bottom: -20,
    right: -20,
    opacity: 0.15,
  },
  modalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalCategoryText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#333',
    letterSpacing: 1,
  },
  modalLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  turnBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    overflow: 'hidden',
  },
  cardDivider: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 20,
    width: '40%',
    alignSelf: 'center',
  },
  modalCardBodyScroll: {
    flex: 1,
    minHeight: 120,
  },
  modalScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  timerToggleButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  timerToggleButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  timerToggleIcon: {
    fontSize: 16,
  },
  timerToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCardBodyText: {
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  modalCardFooter: {
    marginTop: 4,
    alignItems: 'center',
    paddingBottom: 30,
  },
  footerIcons: {
    fontSize: 18,
  },
  modalActionsWrap: {
    marginTop: 0,
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  primaryActionBtn: {
    width: '100%',
    minHeight: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  primaryActionText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryActionText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#334155',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
