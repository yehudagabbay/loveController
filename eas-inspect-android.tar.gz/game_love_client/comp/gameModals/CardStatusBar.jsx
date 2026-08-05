import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { updateCardStatus } from '../../assets/utils/ApiTools';
import CustomAlert from '../../assets/utils/CustomAlert';
import LikeBurst from '../animations/LikeBurst';
import LoveBurst from '../animations/LoveBurst';
import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

export default function CardStatusBar({
  userId,
  currentCard,
  initialLikeStatus = 0,
  onStatusChanged,
  disabled = false,
}) {
  const { lang } = useLanguage();
  const cardId = useMemo(() => {
    if (!currentCard) return null;

    return (
      currentCard.cardID ??
      currentCard.CardID ??
      currentCard.id ??
      currentCard.ID ??
      null
    );
  }, [currentCard]);

  const [likeStatus, setLikeStatus] = useState(initialLikeStatus || 0);
  const [loadingKey, setLoadingKey] = useState(null);
  const [likeBurstKey, setLikeBurstKey] = useState(0);
  const [loveBurstKey, setLoveBurstKey] = useState(0);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  useEffect(() => {
    setLikeStatus(initialLikeStatus || 0);
  }, [initialLikeStatus, cardId]);

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const handleAlertClose = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const saveReaction = async (nextLikeStatus, actionKey) => {
    if (disabled || !userId || !cardId) return;

    const prevLikeStatus = likeStatus;
    setLikeStatus(nextLikeStatus);
    setLoadingKey(actionKey);

    try {
      await updateCardStatus({
        userId,
        cardId,
        likeStatus: nextLikeStatus,
      });

      onStatusChanged?.({
        cardId,
        userId,
        isCompleted: false,
        likeStatus: nextLikeStatus,
      });
    } catch (error) {
      setLikeStatus(prevLikeStatus);
      showAlert(
        'error',
        i18n.t('alerts.errorTitle', { locale: lang }),
        error?.message ||
          i18n.t('indexGame.card.reactions.updateFailed', {
            locale: lang,
            defaultValue: 'Could not update card status',
          })
      );
    } finally {
      setLoadingKey(null);
    }
  };

  const handleLike = () => {
    const nextLikeStatus = likeStatus === 1 ? 0 : 1;
    if (nextLikeStatus === 1) {
      setLikeBurstKey((prev) => prev + 1);
    }
    saveReaction(nextLikeStatus, 'like');
  };

  const handleLove = () => {
    const nextLikeStatus = likeStatus === 2 ? 0 : 2;
    if (nextLikeStatus === 2) {
      setLoveBurstKey((prev) => prev + 1);
    }
    saveReaction(nextLikeStatus, 'love');
  };

  if (!currentCard || !cardId) return null;

  return (
    <>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />

      <View style={styles.wrapper}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            likeStatus === 1 && styles.actionButtonActive,
            disabled && styles.actionButtonDisabled,
          ]}
          onPress={handleLike}
          activeOpacity={0.85}
          disabled={disabled || loadingKey !== null}
        >
          <LikeBurst
            triggerKey={likeBurstKey}
            icon={'\u2661'}
            iconStyle={[styles.icon, likeStatus === 1 && styles.iconActive]}
          />
          <Text style={styles.label}>
            {i18n.t('indexGame.card.reactions.like', { locale: lang })}
          </Text>
          {loadingKey === 'like' && (
            <ActivityIndicator size="small" color="#fff" style={styles.loader} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            likeStatus === 2 && styles.specialButtonActive,
            disabled && styles.actionButtonDisabled,
          ]}
          onPress={handleLove}
          activeOpacity={0.85}
          disabled={disabled || loadingKey !== null}
        >
          <LoveBurst
            triggerKey={loveBurstKey}
            icon={'\u2661\u2661'}
            iconStyle={[
              styles.icon,
              styles.specialIcon,
              likeStatus === 2 && styles.iconActive,
            ]}
          />
          <Text style={styles.label}>
            {i18n.t('indexGame.card.reactions.love', { locale: lang })}
          </Text>
          {loadingKey === 'love' && (
            <ActivityIndicator size="small" color="#fff" style={styles.loader} />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
    zIndex: 5,
  },
  actionButton: {
    width: 58,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(20,20,20,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(229,9,20,0.28)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  specialButtonActive: {
    backgroundColor: 'rgba(229,9,20,0.4)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.96)',
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 1,
  },
  specialIcon: {
    fontSize: 10,
    letterSpacing: -1,
  },
  label: {
    fontSize: 8,
    lineHeight: 10,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 3,
    textTransform: 'uppercase',
  },
  iconActive: {
    color: '#fff',
  },
  loader: {
    position: 'absolute',
    bottom: -14,
  },
});
