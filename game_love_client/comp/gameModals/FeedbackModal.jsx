import React from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import i18n from '../../src/localization/i18n';
import SoftBloom from '../animations/SoftBloom';
import FeedbackRatingStars from './FeedbackRatingStars';

export default function FeedbackModal({
  visible,
  feedbackText,
  onChangeText,
  onClose,
  onSubmit,
  successBloomKey = 0,
  sendingFeedback = false,
  selectedRating = null,
  onRatingChange,
  onClearRating,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={styles.feedbackModalWrapper}
          onStartShouldSetResponder={() => true}
        >
          <Text style={styles.feedbackTitle}>
            {i18n.t('indexGame.feedback.title')}
          </Text>

          <Text style={styles.feedbackSubtitle}>
            {i18n.t('indexGame.feedback.subtitle')}
          </Text>

          <ScrollView>
            <Text style={styles.feedbackNote}>
              {i18n.t('indexGame.feedback.note')}
            </Text>
          </ScrollView>

          {onRatingChange && (
            <FeedbackRatingStars
              selectedRating={selectedRating}
              onRatingChange={onRatingChange}
              onClearRating={onClearRating}
            />
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.feedbackInput}
              placeholder={i18n.t('indexGame.feedback.placeholder')}
              placeholderTextColor="rgba(0,0,0,0.35)"
              multiline
              maxLength={300}
              value={feedbackText}
              onChangeText={onChangeText}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.feedbackButtonsRow}>
            <TouchableOpacity
              style={[styles.feedbackBtn, styles.cancelBtn]}
              onPress={onClose}
              disabled={sendingFeedback}
            >
              <Text style={styles.feedbackBtnText}>
                {i18n.t('indexGame.feedback.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.feedbackBtn,
                styles.submitBtn,
                sendingFeedback && styles.submitBtnDisabled,
              ]}
              onPress={onSubmit}
              disabled={sendingFeedback}
            >
              <SoftBloom triggerKey={successBloomKey} scale={2.2} />
              <Text style={styles.feedbackBtnText}>
                {sendingFeedback
                  ? i18n.t('general.sending')
                  : i18n.t('indexGame.feedback.send')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  feedbackModalWrapper: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  feedbackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  feedbackSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  feedbackNote: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    marginTop: 10,
  },
  feedbackInput: {
    minHeight: 130,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    textAlign: 'right',
  },
  feedbackButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  feedbackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  cancelBtn: {
    backgroundColor: '#9CA3AF',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  feedbackBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
