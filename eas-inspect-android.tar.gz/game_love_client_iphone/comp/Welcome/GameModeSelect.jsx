import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ i18n + Language Context
import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

// ייבוא הקומפוננטות שלך
import AgeGate from '../Settings/AgeGate';
import TopMenu from '../Settings/TopMenu';
import FlowerRoulette from '../Settings/FlowerRoulette';

// ======================================================
// 🔥 קומפוננטה: סלוגן מדורג - גרסה סימטרית מתוקנת
// ======================================================
const SloganAnimation = ({ line1, line2, line3 }) => {
  const opacity1 = useRef(new Animated.Value(0)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;
  const opacity3 = useRef(new Animated.Value(0)).current;

  const transY1 = useRef(new Animated.Value(20)).current;
  const transY2 = useRef(new Animated.Value(20)).current;
  const transY3 = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    startLoop();
  }, []);

  const startLoop = () => {
    opacity1.setValue(0); transY1.setValue(20);
    opacity2.setValue(0); transY2.setValue(20);
    opacity3.setValue(0); transY3.setValue(20);

    const animateIn = (op, tr) => Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
      Animated.timing(tr, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
    ]);

    const animateOut = (op) => Animated.timing(op, {
      toValue: 0, duration: 1000, useNativeDriver: true,
    });

    Animated.sequence([
      Animated.stagger(600, [
        animateIn(opacity1, transY1),
        animateIn(opacity2, transY2),
        animateIn(opacity3, transY3),
      ]),
      Animated.delay(2500),
      Animated.parallel([
        animateOut(opacity1), animateOut(opacity2), animateOut(opacity3),
      ]),
      Animated.delay(500),
    ]).start(({ finished }) => {
      if (finished) startLoop();
    });
  };

  const lineStyle = {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    textAlign: 'center',
  };

  return (
    <View style={styles.sloganContainer}>
      <Animated.View style={{
        opacity: opacity1,
        alignSelf: 'center',
        transform: [{ translateY: transY1 }],
      }}>
        <Text style={lineStyle}>{line1}</Text>
      </Animated.View>

      <Animated.View style={{
        opacity: opacity2,
        alignSelf: 'center',
        transform: [{ translateY: transY2 }],
      }}>
        <Text style={lineStyle}>{line2}</Text>
      </Animated.View>

      <Animated.View style={{
        opacity: opacity3,
        alignSelf: 'center',
        transform: [{ translateY: transY3 }],
      }}>
        <Text style={[lineStyle, { color: '#ff6b81' }]}>{line3}</Text>
      </Animated.View>
    </View>
  );
};

// ======================================================
// רקע חלופי עם Gradient מונפש
// ======================================================

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
    outputRange: ['#0f172a', '#1e293b', '#0f172a'],
  });

  // Temporarily disabled video for production build
  // const player = useVideoPlayer(bgSource, (playerInstance) => {
  //   // הפעלה אוטומטית, לולאה ומיוט
  //   playerInstance.loop = true;
  //   playerInstance.muted = true;
  //   playerInstance.play();
  // });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(15, 23, 42, 0.45)' },
        ]}
      />
    </Animated.View>
  );
};


// ======================================================
// כרטיס מצב משחק
// ======================================================
const ModeCard = ({
  title,
  subtitle,
  icon,
  colors,
  onPress,
  delay,
  customStyle,
  iconStyle,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        styles.cardWrapper,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.cardContainer, customStyle]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardGradient, customStyle]}
        >
          <View style={[styles.contentRow, iconStyle]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={icon} size={28} color="#fff" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ======================================================
// המסך הראשי
// ======================================================
export default function GameModeSelect({ navigation, route }) {
  // ✅ חשוב: כדי שהמסך יעשה rerender כששפה משתנה
  const { lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const t = (key, vars) => i18n.t(key, vars);

  const userId = route?.params?.userId ?? null;
  const user = route?.params?.user ?? null;

  const [showAgeGate, setShowAgeGate] = useState(false);
  const [isAdult, setIsAdult] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const val = await SecureStore.getItemAsync('lg_isAdult18');
        if (val === 'true') {
          setIsAdult(true);
        }
      } catch (e) { }
    })();
  }, []);

  const handleChooseMode = (mode) => {
    const params = { userId, user, gameMode: mode };

    if (mode === 'couple') {
      if (isAdult) {
        return navigation.navigate('GameHome', params);
      }
      setShowAgeGate(true);
      return;
    }

    if (mode === 'family') {
      return navigation.navigate('FamilyCardsSelect', {
        gameMode: 'family',
        userId,
        user,
      });
    }

    // מצב עבודה (הישן)
    if (mode === 'work') {
      return navigation.navigate('FriendsCardsSelect', {
        ...params,
        gameMode: 'work'
      });
    }

    // מצב חברים חדש - כרגע בבנייה
    if (mode === 'friends_fun') {
      Alert.alert(
        t('gameModeSelect.alerts.soonTitle'),
        t('gameModeSelect.alerts.soonMessage')
      );
      return;
    }
  };

  // תפריט עליון - לוגיקה
  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('lg_isAdult18');
    } catch (e) { }
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleContact = () =>
    Alert.alert(t('gameModeSelect.alerts.contactTitle'), t('gameModeSelect.alerts.contactMessage'));

  const handleFeedback = () =>
    Alert.alert(t('gameModeSelect.alerts.feedbackTitle'), t('gameModeSelect.alerts.feedbackMessage'));

  const handleHelp = () =>
    Alert.alert(t('gameModeSelect.alerts.helpTitle'), t('gameModeSelect.alerts.helpMessage'));

  const handleSelectCoupleCards = () => handleChooseMode('couple');
  const handleSelectFamilyCards = () => navigation.navigate('FamilyCardsSelect', { userId, user, gameMode: 'family' });
  const handleSelectFriendsCards = () => navigation.navigate('FriendsCardsSelect', { userId, user, gameMode: 'friends' });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LiveBackground />
      <TopMenu
        navigation={navigation}
        onLogout={handleLogout}
        onContact={handleContact}
        onFeedback={handleFeedback}
        onHelp={handleHelp}
        onSelectCoupleCards={handleSelectCoupleCards}
        onSelectFamilyCards={handleSelectFamilyCards}
        onSelectFriendsCards={handleSelectFriendsCards}
      />

      <ScrollView
        style={styles.contentScroller}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 64,
            paddingBottom: Math.max(insets.bottom + 28, 44),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* === HEADER SECTION === */}
        <View style={styles.headerContainer}>

          {/* 1. לוגו מסתובב */}
          <FlowerRoulette style={styles.logo} tapToSpin />

          {/* 2. סלוגן אנימציה חדש (לולאה) */}
          <SloganAnimation
            key={lang}
            line1={t('gameModeSelect.slogan.line1')}
            line2={t('gameModeSelect.slogan.line2')}
            line3={t('gameModeSelect.slogan.line3')}
          />

          {/* 3. כותרת המשנה */}
          <View style={styles.subHeaderContainer}>
            <Text style={styles.title}>{t('gameModeSelect.header.title')}</Text>
            <Text style={styles.subtitle}>{t('gameModeSelect.header.subtitle')}</Text>
          </View>
        </View>
        {/* === END HEADER SECTION === */}

        <View style={styles.listContainer}>

          {/* כרטיס 1: זוגי */}
          <ModeCard
            title={t('gameModeSelect.modes.couple.title')}
            subtitle={t('gameModeSelect.modes.couple.subtitle')}
            icon="heart-multiple"
            colors={['rgba(255, 65, 108, 0.9)', 'rgba(255, 75, 43, 0.9)']}
            onPress={() => handleChooseMode('couple')}
            delay={500}
            customStyle={{ alignSelf: 'flex-end', borderTopLeftRadius: 50, borderBottomLeftRadius: 50, borderTopRightRadius: 20, borderBottomRightRadius: 20, width: '95%' }}
            iconStyle={{ flexDirection: 'row-reverse' }}
          />

          {/* כרטיס 2: משפחה */}
          <ModeCard
            title={t('gameModeSelect.modes.family.title')}
            subtitle={t('gameModeSelect.modes.family.subtitle')}
            icon="home-heart"
            colors={['rgba(86, 171, 47, 0.9)', 'rgba(168, 224, 99, 0.9)']}
            onPress={() => handleChooseMode('family')}
            delay={650}
            customStyle={{ alignSelf: 'flex-start', borderTopRightRadius: 50, borderBottomRightRadius: 50, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, width: '95%', marginTop: -12 }}
            iconStyle={{ flexDirection: 'row' }}
          />

          <ModeCard
            title={t('gameModeSelect.modes.work.title')}
            subtitle={t('gameModeSelect.modes.work.subtitle')}
            icon="account-tie"
            colors={['rgba(33, 147, 176, 0.9)', 'rgba(109, 213, 237, 0.9)']}
            onPress={() => handleChooseMode('work')}
            delay={800}
            customStyle={{ alignSelf: 'flex-end', borderTopLeftRadius: 50, borderBottomLeftRadius: 50, borderTopRightRadius: 20, borderBottomRightRadius: 20, width: '95%', marginTop: -12 }}
            iconStyle={{ flexDirection: 'row-reverse' }}
          />

          <ModeCard
            title={t('gameModeSelect.modes.friendsFun.title')}
            subtitle={t('gameModeSelect.modes.friendsFun.subtitle')}
            icon="glass-cocktail"
            colors={['rgba(138, 43, 226, 0.9)', 'rgba(218, 112, 214, 0.9)']}
            onPress={() => handleChooseMode('friends_fun')}
            delay={950}
            customStyle={{ alignSelf: 'flex-start', borderTopRightRadius: 50, borderBottomRightRadius: 50, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, width: '95%', marginTop: -12 }}
            iconStyle={{ flexDirection: 'row' }}
          />

        </View>
      </ScrollView>

      <Modal transparent visible={showAgeGate} animationType="fade" onRequestClose={() => setShowAgeGate(false)}>
        <AgeGate
          onConfirm={async (shouldRemember) => {
            if (shouldRemember) { try { await SecureStore.setItemAsync('lg_isAdult18', 'true'); } catch (e) { } }
            setIsAdult(true);
            setShowAgeGate(false);
            navigation.navigate('GameHome', { userId, user, gameMode: 'couple' });
          }}
          onDeny={() => setShowAgeGate(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  contentScroller: {
    flex: 1,
    zIndex: 10,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  headerContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 5,
  },
  sloganContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
    minHeight: 120,
    justifyContent: 'center',
  },
  subHeaderContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 5,
  },
  title: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#e0e0e0',
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    width: '100%',
    paddingBottom: 40,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 8,
  },
  cardContainer: {
    height: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  contentRow: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconContainer: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'left',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'left',
  },
});
