import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomAlert from '../../assets/utils/CustomAlert';
import { markCardShared } from '../../assets/utils/ApiTools';
import ShareCard from './ShareCard';

export default function ShareCardModal({
  visible,
  onClose,
  currentCard,
  userId = null,
  gameType = 'couples',
  lang = 'he',
}) {
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const cardSize = Math.min(380, Math.max(260, screenWidth - 72));
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  if (!currentCard) return null;

  const showAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const handleAlertClose = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showAlert(
          'error',
          lang === 'he' ? 'שגיאה' : 'Error',
          lang === 'he'
            ? 'השיתוף אינו זמין במכשיר זה'
            : 'Sharing is not available on this device',
        );
        return;
      }

      const uri = await cardRef.current?.capture?.();
      if (!uri) {
        throw new Error('capture_failed');
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: lang === 'he' ? 'שתף כרטיס LIBA' : 'Share LIBA card',
        UTI: 'public.png',
      });

      const cardId =
        currentCard?.cardID ??
        currentCard?.CardID ??
        currentCard?.id ??
        null;

      if (userId && cardId) {
        await markCardShared({ userId, cardId });
      }
    } catch (error) {
      console.error('Share error:', error);
      showAlert(
        'error',
        lang === 'he' ? 'שגיאה' : 'Error',
        lang === 'he'
          ? 'נכשלנו ביצירת התמונה לשיתוף'
          : 'Could not create the image for sharing',
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[
          styles.backdrop,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
        onPress={onClose}
      >
        <View style={styles.centerWrap} onStartShouldSetResponder={() => true}>
          <View
            style={[
              styles.modalBox,
              {
                maxWidth: Math.min(400, screenWidth - 24),
                maxHeight: screenHeight - insets.top - Math.max(insets.bottom, 12) - 24,
              },
            ]}
          >
            <CustomAlert
              visible={alertConfig.visible}
              type={alertConfig.type}
              title={alertConfig.title}
              message={alertConfig.message}
              onClose={handleAlertClose}
            />

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <ShareCard
                ref={cardRef}
                gameType={gameType}
                categoryId={currentCard.CategoryID ?? currentCard.categoryID ?? 1}
                levelId={currentCard.LevelID ?? currentCard.levelID ?? 1}
                cardText={
                  currentCard.cardDescription ??
                  currentCard.CardDescription ??
                  currentCard.description ??
                  ''
                }
                lang={lang}
                size={cardSize}
              />
            </ScrollView>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.closeBtn]}
                onPress={onClose}
                disabled={sharing}
              >
                <Text style={styles.actionText}>
                  {lang === 'he' ? 'סגור' : 'Close'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.shareBtn]}
                onPress={handleShare}
                disabled={sharing}
              >
                {sharing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionText}>
                    {lang === 'he' ? 'שתף כעת' : 'Share Now'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  centerWrap: {
    width: '100%',
    maxWidth: 400,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 12,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: '#E2E8F0',
  },
  shareBtn: {
    backgroundColor: '#F59E0B',
  },
  actionText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1E293B',
  },
});
