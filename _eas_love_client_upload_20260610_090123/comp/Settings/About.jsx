import React from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { Text, Card, Divider, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopMenu from '../Settings/TopMenu';
import { useLanguage } from '../../src/localization/LanguageContext';
import i18n from '../../src/localization/i18n';
import logo from '../../assets/images/logo1.png';

const { width } = Dimensions.get('window');

export default function About({ navigation }) {
  const { lang } = useLanguage();
  const isRTL = lang === 'he';
  const t = (key) => i18n.t(key);

  // צבע המותג המרכזי (ניתן לשנות לבורדו/ורוד המדויק שלך)
  const PRIMARY_COLOR = '#E85D8E';

  return (
    <View style={styles.container}>
      <TopMenu navigation={navigation} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header - Logo & Name */}
        <View style={styles.headerSection}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.title, { color: PRIMARY_COLOR }]}>LIBA</Text>
          <Text style={styles.subtitle}>{t('about_title')}</Text>
        </View>

        {/* Description Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={[styles.text, styles.mainDescription]}>
              {t('about_description')}
            </Text>
          </Card.Content>
        </Card>

        {/* Features Section */}
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('about_features_title')}
        </Text>
        
        <Card style={styles.card}>
          <Card.Content>
            {[1, 2, 3, 4].map((num) => (
              <View key={num} style={[styles.featureRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <MaterialCommunityIcons name="check-circle" size={20} color={PRIMARY_COLOR} />
                <Text style={[styles.featureText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t(`about_feature_${num}`)}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Goal Section */}
        <Card style={[styles.card, { backgroundColor: PRIMARY_COLOR }]}>
          <Card.Content>
            <View style={styles.goalHeader}>
                <MaterialCommunityIcons name="heart" size={24} color="#fff" />
                <Text style={[styles.goalTitle, { color: '#fff' }]}>{t('about_goal_title')}</Text>
            </View>
            <Text style={[styles.text, { color: '#fff', opacity: 0.9 }]}>
              {t('about_goal_text')}
            </Text>
          </Card.Content>
        </Card>

        {/* Version Footer */}
        <View style={styles.footer}>
          <Divider style={styles.divider} />
          <Text style={styles.versionLabel}>{t('about_version_title')}</Text>
          <Text style={styles.versionNumber}>1.0.0</Text>
          <Button
            mode="outlined"
            style={styles.privacyButton}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            {t('about_privacy_button')}
          </Button>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9', // רקע מעט אפרפר כדי שהכרטיסים הלבנים יבלטו
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginTop: -5,
  },
  card: {
    marginBottom: 20,
    borderRadius: 15,
    elevation: 2, // צל עדין באנדרואיד
    backgroundColor: '#fff',
  },
  mainDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#444',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 10,
    color: '#333',
    paddingHorizontal: 5,
  },
  featureRow: {
    alignItems: 'center',
    marginVertical: 8,
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
    color: '#444',
    fontWeight: '500',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  divider: {
    width: width * 0.5,
    height: 1,
    marginBottom: 15,
  },
  versionLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  versionNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  privacyButton: {
    marginTop: 16,
    borderRadius: 14,
    borderColor: '#D1D5DB',
  },
});
