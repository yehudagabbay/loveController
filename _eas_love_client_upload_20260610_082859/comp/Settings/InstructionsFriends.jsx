import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

export default function InstructionsFriends({
  visible,
  onClose,
}) {
  useLanguage();
  const t = (key, vars) => i18n.t(key, vars);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const sections = [
    {
      emoji: '🤳',
      title: t('friendsCardsSelect.instructions.sections.fullPresence.title'),
      body: t('friendsCardsSelect.instructions.sections.fullPresence.body'),
    },
    {
      emoji: '🎭',
      title: t('friendsCardsSelect.instructions.sections.noWorkAnswers.title'),
      body: t('friendsCardsSelect.instructions.sections.noWorkAnswers.body'),
    },
    {
      emoji: '👂',
      title: t('friendsCardsSelect.instructions.sections.curiosityOverCriticism.title'),
      body: t('friendsCardsSelect.instructions.sections.curiosityOverCriticism.body'),
    },
    {
      emoji: '🔒',
      title: t('friendsCardsSelect.instructions.sections.trustAgreement.title'),
      body: t('friendsCardsSelect.instructions.sections.trustAgreement.body'),
    },
    {
      emoji: '✋',
      title: t('friendsCardsSelect.instructions.sections.rightToSkip.title'),
      body: t('friendsCardsSelect.instructions.sections.rightToSkip.body'),
    },
  ];

  const handleClose = () => {
    onClose?.(dontShowAgain);
    setDontShowAgain(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('friendsCardsSelect.instructions.title')}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.intro}>
              {t('friendsCardsSelect.instructions.intro')}
            </Text>

            {sections.map((section) => (
              <View key={section.title} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  {section.emoji} {section.title}
                </Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}

            <View style={styles.specialCard}>
              <Text style={styles.specialTitle}>
                {t('friendsCardsSelect.instructions.atYourOwnPace.title')}
              </Text>
              <Text style={styles.specialBody}>
                {t('friendsCardsSelect.instructions.atYourOwnPace.body')}
              </Text>
            </View>

            <Text style={styles.readyText}>
              {t('friendsCardsSelect.instructions.ready')}
            </Text>

            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.85}
              onPress={() => setDontShowAgain((prev) => !prev)}
            >
              <MaterialCommunityIcons
                name={dontShowAgain ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={dontShowAgain ? '#E11D48' : '#94A3B8'}
              />
              <Text style={styles.checkboxText}>
                {t('friendsCardsSelect.instructions.dontShowAgain')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={handleClose}>
              <LinearGradient
                colors={['#F43F5E', '#FB7185']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>{t('friendsCardsSelect.instructions.cta')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#FFF7FB',
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    paddingRight: 12,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  intro: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  specialCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 18,
    padding: 14,
    marginTop: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  specialTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9F1239',
    marginBottom: 6,
  },
  specialBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  readyText: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    color: '#BE123C',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkboxText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  ctaButton: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
