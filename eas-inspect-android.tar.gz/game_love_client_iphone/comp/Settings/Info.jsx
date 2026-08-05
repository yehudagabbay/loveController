import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import TopMenu from './TopMenu';
import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

export default function Info({ navigation }) {
  const { lang } = useLanguage();
  const isRTL = lang === 'he' || lang === 'ar';
  const sections = [
    {
      title: i18n.t('infoScreen.sections.engine.title'),
      body: i18n.t('infoScreen.sections.engine.body'),
    },
    {
      title: i18n.t('infoScreen.sections.research.title'),
      body: i18n.t('infoScreen.sections.research.body'),
    },
    {
      title: i18n.t('infoScreen.sections.aiSoul.title'),
      body: i18n.t('infoScreen.sections.aiSoul.body'),
    },
    {
      title: i18n.t('infoScreen.sections.transparency.title'),
      body: i18n.t('infoScreen.sections.transparency.body'),
    },
  ];

  return (
    <View style={styles.container}>
      <TopMenu navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>LIBA</Text>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {i18n.t('infoScreen.title')}
          </Text>
          <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {i18n.t('infoScreen.subtitle')}
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {section.title}
            </Text>
            <Text style={[styles.cardBody, { textAlign: isRTL ? 'right' : 'left' }]}>
              {section.body}
            </Text>
          </View>
        ))}

        <View style={styles.footerBox}>
          <Text style={styles.footerText}>
            {i18n.t('infoScreen.footer')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingTop: 96,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  eyebrow: {
    color: '#fda4af',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  cardBody: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 26,
  },
  footerBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  footerText: {
    color: '#9f1239',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center',
  },
});
