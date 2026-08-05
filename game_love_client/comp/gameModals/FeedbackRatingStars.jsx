import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import i18n from '../../src/localization/i18n';

const STAR_VALUES = [1, 2, 3, 4, 5];

export default function FeedbackRatingStars({
  selectedRating,
  onRatingChange,
  onClearRating,
}) {
  return (
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
              onPress={() => onRatingChange(value)}
              activeOpacity={0.78}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('feedbackScreen.rating.starAccessibility', {
                count: value,
                defaultValue: `${value} stars`,
              })}
            >
              <MaterialCommunityIcons
                name={selected ? 'star' : 'star-outline'}
                size={27}
                color={selected ? '#FBBF24' : '#94A3B8'}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedRating != null && (
        <TouchableOpacity
          style={styles.clearRatingButton}
          onPress={onClearRating}
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
  );
}

const styles = StyleSheet.create({
  ratingBox: {
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  ratingTextBlock: {
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  ratingHint: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  starButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearRatingButton: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  clearRatingText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
