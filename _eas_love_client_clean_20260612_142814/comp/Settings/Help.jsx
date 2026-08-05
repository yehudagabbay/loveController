// comp/Help/HelpScreen.jsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopMenu from '../Settings/TopMenu';

const { width } = Dimensions.get('window');

// ✅ הוספה: i18n + שפה (להתאים נתיבים אם צריך)
import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

export default function HelpScreen({ navigation }) {
  // ✅ הוספה: מאזין לשינוי שפה כדי לגרום לרינדור מחדש
  const { lang } = useLanguage();

  const goToGameModes = () => {
    navigation.navigate('GameModeSelect');
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#020617']}
      style={styles.container}
    >
      {/* תפריט עליון */}
      <TopMenu navigation={navigation} />

      <View style={styles.contentWrapper}>
        {/* כותרת ראשית */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="help-circle-outline" size={40} color="#3b82f6" />
          <Text style={styles.title}>{i18n.t('helpScreen.title')}</Text>
          <Text style={styles.subtitle}>
            {i18n.t('helpScreen.subtitle')}
          </Text>
        </View>

        <View style={styles.card}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* מה זה Liba */}
            <Section
              title={i18n.t('helpScreen.sections.what.title')}
              icon="cards-playing-outline"
            >
              {i18n.t('helpScreen.sections.what.body')}
            </Section>

            {/* איך מתחילים */}
            <Section
              title={i18n.t('helpScreen.sections.howToStart.title')}
              icon="play-circle-outline"
            >
              {i18n.t('helpScreen.sections.howToStart.body')}
            </Section>

            {/* איך נראה תור */}
            <Section
              title={i18n.t('helpScreen.sections.turn.title')}
              icon="timer-outline"
            >
              {i18n.t('helpScreen.sections.turn.body')}
            </Section>

            {/* פידבק */}
            <Section
              title={i18n.t('helpScreen.sections.feedback.title')}
              icon="message-draw"
            >
              {i18n.t('helpScreen.sections.feedback.body')}
            </Section>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* כפתורים למטה */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryText}>
                {i18n.t('helpScreen.buttons.back')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={goToGameModes}
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.gradientBtn}
              >
                <Text style={styles.primaryText}>
                  {i18n.t('helpScreen.buttons.toGame')}
                </Text>
                <MaterialCommunityIcons name="arrow-left" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

// קומפוננטת עזר לפסקה
const Section = ({ title, icon, children }) => (
  <View style={styles.sectionContainer}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <MaterialCommunityIcons name={icon} size={20} color="#60a5fa" />
    </View>
    <Text style={styles.paragraph}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 85,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#f8fafc',
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 4,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '700',
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    textAlign: 'center',
    width: '100%',
  },
  buttonsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  primaryButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  secondaryText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
});
