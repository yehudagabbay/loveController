// comp/Feedback/FeedbackScreen.jsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import TopMenu from '../Settings/TopMenu';
import SoftBloom from '../animations/SoftBloom';
import { submitFeedback as submitFeedbackRequest } from '../../assets/utils/ApiTools';

import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

const GENERAL_FEEDBACK_CARD_ID = 300;
const DEFAULT_FEEDBACK_RATING = 3;
const STAR_VALUES = [1, 2, 3, 4, 5];

export default function FeedbackScreen({ navigation }) {
  const { ready } = useLanguage();

  const [userId, setUserId] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedRating, setSelectedRating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successBloomKey, setSuccessBloomKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync('lg_user');
        if (!raw) return;

        const parsed = JSON.parse(raw);
        const idFromStorage =
          parsed?.userId ||
          parsed?.UserId ||
          parsed?.userID ||
          parsed?.UserID ||
          parsed?.id ||
          parsed?.Id ||
          null;

        if (idFromStorage) {
          setUserId(idFromStorage);
        }
      } catch {
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert(
        i18n.t('feedbackScreen.alerts.missingUserTitle'),
        i18n.t('feedbackScreen.alerts.missingUserMessage')
      );
      return;
    }

    if (!feedbackText.trim()) {
      Alert.alert(
        i18n.t('feedbackScreen.alerts.emptyFeedbackTitle'),
        i18n.t('feedbackScreen.alerts.emptyFeedbackMessage')
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        UserID: userId,
        CardID: GENERAL_FEEDBACK_CARD_ID,
        Rating: selectedRating ?? DEFAULT_FEEDBACK_RATING,
        Comment: feedbackText.trim(),
      };

      await submitFeedbackRequest({
        userId: payload.UserID,
        cardId: payload.CardID,
        rating: payload.Rating,
        comment: payload.Comment,
      });

      setSuccessBloomKey((prev) => prev + 1);
      await new Promise((resolve) => setTimeout(resolve, 650));
      Alert.alert(
        i18n.t('feedbackScreen.alerts.thanksTitle'),
        i18n.t('feedbackScreen.alerts.thanksMessage'),
        [
          {
            text: i18n.t('feedbackScreen.alerts.backButton'),
            onPress: () => navigation.goBack(),
          },
        ]
      );

      setFeedbackText('');
      setSelectedRating(null);
    } catch {
      Alert.alert(
        i18n.t('feedbackScreen.alerts.sendErrorTitle'),
        i18n.t('feedbackScreen.alerts.sendErrorMessage')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmail = () => {
    const email = 'liba.supp@gmail.com';
    const subject = encodeURIComponent(i18n.t('feedbackScreen.email.subject'));
    const body = encodeURIComponent('');
    const url = `mailto:${email}?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() => {});
  };

  if (!ready) return null;

  return (
    <LinearGradient
      colors={['#0f172a', '#020617']}
      style={styles.container}
    >
      <TopMenu navigation={navigation} />

      <View style={styles.card}>
        <Text style={styles.title}>{i18n.t('feedbackScreen.title')}</Text>
        <Text style={styles.subtitle}>{i18n.t('feedbackScreen.subtitle')}</Text>

        <View style={styles.ratingBox}>
          <View style={styles.ratingTextBlock}>
            <Text style={styles.ratingLabel}>
              {i18n.t('feedbackScreen.rating.label', {
                defaultValue: 'Star rating',
              })}
            </Text>
            <Text style={styles.ratingHint}>
              {i18n.t('feedbackScreen.rating.optional', {
                defaultValue: 'Optional',
              })}
            </Text>
          </View>

          <View style={styles.starsRow}>
            {STAR_VALUES.map((value) => {
              const selected = selectedRating != null && value <= selectedRating;

              return (
                <TouchableOpacity
                  key={value}
                  style={styles.starButton}
                  onPress={() => setSelectedRating(value)}
                  activeOpacity={0.78}
                  accessibilityRole="button"
                  accessibilityLabel={i18n.t('feedbackScreen.rating.starAccessibility', {
                    count: value,
                    defaultValue: `${value} stars`,
                  })}
                >
                  <MaterialCommunityIcons
                    name={selected ? 'star' : 'star-outline'}
                    size={28}
                    color={selected ? '#FBBF24' : '#64748B'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedRating != null && (
            <TouchableOpacity
              style={styles.clearRatingButton}
              onPress={() => setSelectedRating(null)}
              activeOpacity={0.78}
            >
              <Text style={styles.clearRatingText}>
                {i18n.t('feedbackScreen.rating.clear', {
                  defaultValue: 'Clear rating',
                })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder={i18n.t('feedbackScreen.placeholder')}
          placeholderTextColor="rgba(148, 163, 184, 0.9)"
          maxLength={300}
          value={feedbackText}
          onChangeText={setFeedbackText}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <SoftBloom triggerKey={successBloomKey} scale={2.2} />
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{i18n.t('feedbackScreen.buttons.send')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>{i18n.t('feedbackScreen.buttons.cancel')}</Text>
        </TouchableOpacity>

        <View style={styles.emailBox}>
          <Text style={styles.emailText}>
            {i18n.t('feedbackScreen.email.label')}
          </Text>
          <TouchableOpacity onPress={handleOpenEmail}>
            <Text style={styles.emailLink}>liba.supp@gmail.com</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: 20,
    padding: 16,
    paddingTop: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    color: '#e5e7eb',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  ratingBox: {
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.72)',
    alignItems: 'center',
  },
  ratingTextBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  ratingHint: {
    marginTop: 2,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  starButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearRatingButton: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  clearRatingText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.9)',
    padding: 10,
    color: '#e5e7eb',
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    overflow: 'visible',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  cancelText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  emailBox: {
    marginTop: 16,
    alignItems: 'center',
  },
  emailText: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 4,
  },
  emailLink: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
