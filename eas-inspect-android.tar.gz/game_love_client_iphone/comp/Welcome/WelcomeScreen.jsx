// comp/Welcome/WelcomeScreen.jsx
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';
import LanguageSwitcher from '../../src/localization/components/LanguageSwitcher';

// ייבוא הלוגו המונפש שלך (ודא שהנתיב נכון)
import FlowerRoulette from '../Settings/FlowerRoulette'; 

const LiveBackground = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 10000, 
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#0b1020', '#1a1a2e', '#0b1020'], // צבעים כהים משתנים
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]}>
      <LinearGradient
        colors={['rgba(11, 16, 32, 0.8)', 'rgba(26, 26, 46, 0.8)', 'rgba(11, 16, 32, 0.8)']}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};


export default function WelcomeScreen({ navigation }) {
  const { lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isCompactHeight = height < 720;
  const t = (key, vars) => i18n.t(key, vars);

  const slideAnim = useRef(new Animated.Value(50)).current; 
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LiveBackground />

      <View style={[styles.langWrap, { top: insets.top + 12 }]}>
        <LanguageSwitcher />
      </View>

      <View
        style={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top + 48, 64),
            paddingBottom: Math.max(insets.bottom + 24, 36),
          },
        ]}
      >
        
        <View style={styles.headerSection}>
          <View style={styles.logoWrapper}>
            <FlowerRoulette
              style={[styles.logo, isCompactHeight && styles.logoCompact]}
              tapToSpin
            />
          </View>
          
          <Text style={[styles.appName, isCompactHeight && styles.appNameCompact]}>
            {t('welcomeScreen.title')}
          </Text>
          <Text style={styles.tagline}>{t('welcomeScreen.subtitle')}</Text>
        </View>

        <Animated.View 
          style={[
            styles.buttonsContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={styles.chooseText}>
            {t('welcomeScreen.chooseText') === 'welcomeScreen.chooseText'
              ? 'ברוכים הבאים, איך נתחיל?'
              : t('welcomeScreen.chooseText')}
          </Text>

          <View style={styles.cardsRow}>
            
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.cardWrapper}
              onPress={() => navigation.navigate('Login')}
            >
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)']}
                style={styles.cardGradient}
              >
                <View style={[styles.iconCircle, { borderColor: '#4ade80' }]}>
                  <MaterialCommunityIcons name="login-variant" size={32} color="#4ade80" />
                </View>
                <Text style={styles.cardTitle}>{t('welcomeScreen.buttons.login')}</Text>

                <Text style={styles.cardSubtitle}>
                  {t('welcomeScreen.loginSubtitle') === 'welcomeScreen.loginSubtitle'
                    ? 'יש לי כבר חשבון'
                    : t('welcomeScreen.loginSubtitle')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.cardWrapper}
              onPress={() => navigation.navigate('Registration')}
            >
              <LinearGradient
                colors={['rgba(236, 72, 153, 0.15)', 'rgba(236, 72, 153, 0.05)']} 
                style={styles.cardGradient}
              >
                <View style={[styles.iconCircle, { borderColor: '#f472b6' }]}>
                  <MaterialCommunityIcons name="account-plus-outline" size={32} color="#f472b6" />
                </View>
                <Text style={styles.cardTitle}>{t('welcomeScreen.buttons.register')}</Text>

                <Text style={styles.cardSubtitle}>
                  {t('welcomeScreen.registerSubtitle') === 'welcomeScreen.registerSubtitle'
                    ? 'משתמש חדש'
                    : t('welcomeScreen.registerSubtitle')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  langWrap: {
    position: 'absolute',
    left: 12,
    zIndex: 9999,
  },

  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  headerSection: {
    flex: 1,                 
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  logo: {
    width: 150,
    height: 150,
  },
  logoCompact: {
    width: 122,
    height: 122,
  },
  appName: {
    fontSize: 52,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 15,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  appNameCompact: {
    fontSize: 44,
    marginTop: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#cbd5e1',
    marginTop: 5,
    fontWeight: '500',
    letterSpacing: 1,
    opacity: 0.9,
  },
  
  buttonsContainer: {
    width: '100%',
    marginBottom: 10,    
  },
  chooseText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 15,
    fontWeight: '500',
  },
  cardsRow: {
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    aspectRatio: 0.8,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    opacity: 0.8,
    textAlign: 'center',
  },
});
