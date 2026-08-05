import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import CustomAlert from '../../assets/utils/CustomAlert';
import FlowerRoulette from '../Settings/FlowerRoulette';
import { googleAuthConfig } from '../../assets/utils/authConfig';
import { socialLoginUser } from '../../assets/utils/ApiTools';
import { auth } from '../../firebase';
import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

GoogleSignin.configure({
  webClientId: googleAuthConfig.webClientId,
  iosClientId: googleAuthConfig.iosClientId,
  scopes: ['openid', 'profile', 'email'],
});

export default function SocialRegister({ navigation, route }) {
  const { lang, ready } = useLanguage();
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const t = useMemo(() => {
    return (key, vars) => i18n.t(key, { ...vars, locale: lang });
  }, [lang]);

  const [authStep, setAuthStep] = useState(0);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
    onOk: null,
  });

  const openedOnceRef = useRef(false);
  const navigationTimeoutRef = useRef(null);

  const stepLabels = useMemo(
    () => [
      t('registration.socialRegister.loading.steps.google'),
      t('registration.socialRegister.loading.steps.account'),
      t('registration.socialRegister.loading.steps.ready'),
    ],
    [t]
  );

  const showAlert = (type, title, message, onOk = null) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onOk,
    });
  };

  const handleAlertClose = () => {
    const callback = alertConfig.onOk;
    setAlertConfig((prev) => ({
      ...prev,
      visible: false,
      onOk: null,
    }));

    if (typeof callback === 'function') {
      callback();
    }
  };

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const provider = route?.params?.provider;

    if (provider !== 'Google') {
      showAlert(
        'error',
        t('alerts.errorTitle'),
        t('registration.socialRegister.errors.googleOpenFailed'),
        () => navigation.goBack()
      );
      return;
    }

    if (openedOnceRef.current) return;

    openedOnceRef.current = true;

    (async () => {
      try {
        setAuthStep(0);

        try {
          await GoogleSignin.signOut();
        } catch {}

        const googleResult = await GoogleSignin.signIn();

        if (googleResult?.type === 'cancelled') {
          showAlert(
            'info',
            t('registration.socialRegister.cancelled.title'),
            t('registration.socialRegister.cancelled.message'),
            () => navigation.goBack()
          );
          return;
        }

        if (!googleResult?.data?.idToken) {
          throw new Error(
            t('registration.socialRegister.errors.missingIdToken')
          );
        }

        const credential = GoogleAuthProvider.credential(
          googleResult.data.idToken
        );
        const userCred = await signInWithCredential(auth, credential);
        setAuthStep(1);

        const uid = userCred?.user?.uid || '';
        const firebaseIdToken = await userCred.user.getIdToken(true);
        const email = userCred?.user?.email || '';
        const displayName =
          userCred?.user?.displayName ||
          (email ? email.split('@')[0] : 'Google User');

        const { response: apiResponse, raw, data } = await socialLoginUser({
          idToken: firebaseIdToken,
          email,
          nickname: displayName,
          gender: 'N/A',
          age: null,
        });

        if (!apiResponse.ok) {
          throw new Error(
            data?.message || data?.error || raw || 'Social login failed'
          );
        }

        const userId = String(data?.UserID ?? data?.userID ?? data?.id ?? '');

        if (!userId) {
          throw new Error('Missing user id after social login');
        }

        await SecureStore.setItemAsync('lg_userId', userId);
        await SecureStore.setItemAsync('lg_firebase_uid', uid);
        await SecureStore.setItemAsync('lg_firebase_idToken', firebaseIdToken);

        if (email) {
          await SecureStore.setItemAsync('lg_firebase_email', email);
        }

        const socialUser = {
          UserID: Number(userId),
          Email: data?.Email || email,
          Nickname: data?.Nickname || displayName,
          Gender: data?.Gender || 'N/A',
          Age: data?.Age ?? null,
          SocialID: data?.SocialID || uid,
          FirebaseUID: data?.FirebaseUID || uid,
        };

        await SecureStore.setItemAsync('lg_user', JSON.stringify(socialUser));

        setAuthStep(2);

        navigationTimeoutRef.current = setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'GameModeSelect',
                params: { userId, user: socialUser },
              },
            ],
          });
        }, 450);
      } catch (error) {
        console.warn('Google/Firebase social sign-in error:', error);

        const isCancelled = error?.code === statusCodes.SIGN_IN_CANCELLED;
        const errorMessage = isCancelled
          ? t('registration.socialRegister.cancelled.message')
          : error?.message ||
            t('registration.socialRegister.errors.firebaseFailed');

        showAlert(
          isCancelled ? 'info' : 'error',
          isCancelled
            ? t('registration.socialRegister.cancelled.title')
            : t('alerts.errorTitle'),
          errorMessage,
          () => navigation.goBack()
        );
      }
    })();

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [navigation, route?.params?.provider, t]);

  if (!ready) return null;

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <ImageBackground
      source={require('../../assets/images/login_bg1.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 24, 44),
            paddingBottom: Math.max(insets.bottom + 24, 44),
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
          ]}
        >
          <FlowerRoulette style={styles.logo} tapToSpin={false} />
        </Animated.View>

        <View style={styles.googleBadge}>
          <Text style={styles.googleBadgeText}>G</Text>
          <Text style={styles.googleBadgeLabel}>Google</Text>
        </View>

        <Text style={styles.title}>
          {t('registration.socialRegister.loading.title')}
        </Text>
        <Text style={styles.subtitle}>
          {t('registration.socialRegister.loading.subtitle')}
        </Text>

        <View style={styles.progressPanel}>
          {stepLabels.map((label, index) => {
            const isDone = index < authStep;
            const isActive = index === authStep;

            return (
              <View key={label} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    isDone && styles.stepDotDone,
                    isActive && styles.stepDotActive,
                  ]}
                >
                  {isDone ? <Text style={styles.stepCheck}>OK</Text> : null}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    (isDone || isActive) && styles.stepTextActive,
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 10, 30, 0.58)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoWrap: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    marginBottom: 22,
  },
  logo: {
    width: 104,
    height: 104,
  },
  googleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    marginBottom: 18,
  },
  googleBadgeText: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#1F2937',
    fontWeight: '800',
    backgroundColor: '#F8FAFC',
  },
  googleBadgeLabel: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 330,
    marginBottom: 26,
  },
  progressPanel: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 18,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stepDotActive: {
    borderColor: '#F9A8D4',
    backgroundColor: '#E91E63',
  },
  stepDotDone: {
    borderColor: '#86EFAC',
    backgroundColor: '#22C55E',
  },
  stepCheck: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: 'rgba(255,255,255,0.56)',
    fontSize: 14,
    fontWeight: '600',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
});
