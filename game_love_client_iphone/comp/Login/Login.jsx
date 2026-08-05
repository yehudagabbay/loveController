import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  View,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FlowerRoulette from '../Settings/FlowerRoulette';
import CustomAlert from '../../assets/utils/CustomAlert';
import LanguageSwitcher from '../../src/localization/components/LanguageSwitcher';
import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';
import ForgotPasswordModal from './ResetPassword/ResetPassword';
import {
  loginUser,
  resendVerificationEmail,
} from '../../assets/utils/ApiTools';

export default function Login({ route, navigation }) {
  const { lang, ready } = useLanguage();
  const insets = useSafeAreaInsets();
  const prefilledEmail = route?.params?.email || '';

  const t = useMemo(() => {
    return (key, options) => i18n.t(key, { ...options, locale: lang });
  }, [lang]);

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [authOverlayVisible, setAuthOverlayVisible] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const navigationTimeoutRef = useRef(null);

  const authSteps = useMemo(
    () => [
      t('login.transition.steps.credentials'),
      t('login.transition.steps.session'),
      t('login.transition.steps.ready'),
    ],
    [t]
  );

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    onOk: null,
  });

  const showAlert = (type, title, message, onOk = null) => {
    setAlertConfig({ visible: true, type, title, message, onOk });
  };

  const handleAlertClose = () => {
    const callback = alertConfig.onOk;
    setAlertConfig((prev) => ({ ...prev, visible: false, onOk: null }));
    if (callback) callback();
  };

  useEffect(() => {
    const verified = route?.params?.verified;
    if (verified === '1') {
      showAlert('success', t('login.verifyEmail.successTitle'), t('login.verifyEmail.successMessage'));
    } else if (verified === '0') {
      showAlert('error', t('login.verifyEmail.errorTitle'), t('login.verifyEmail.errorMessage'));
    }
  }, [route?.params?.verified, t]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [pulseAnim]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert('error', t('alerts.errorTitle'), t('login.alerts.missingEmailPassword'));
      return;
    }
    setBusy(true);
    setAuthStep(0);
    setAuthOverlayVisible(true);
    try {
      const { response: res, data } = await loginUser({ email, password });
      if (res.ok) {
        setAuthStep(1);
        const user = data?.User || data?.user || {};
        const userId = String(user.UserID ?? user.userID ?? user.id ?? '');
        if (!userId) {
          setAuthOverlayVisible(false);
          showAlert('error', t('alerts.errorTitle'), t('login.alerts.missingUserIdMessage'));
          return;
        }
        await SecureStore.setItemAsync('lg_userId', userId);
        await SecureStore.setItemAsync('lg_user', JSON.stringify(user));
        setAuthStep(2);
        navigationTimeoutRef.current = setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'GameModeSelect', params: { userId, user } }] });
        }, 450);
        return;
      }
      setAuthOverlayVisible(false);
      showAlert('error', t('alerts.errorTitle'), data?.message || t('login.alerts.loginHttpError', { status: res.status }));
    } catch (err) {
      setAuthOverlayVisible(false);
      showAlert('error', t('alerts.networkErrorTitle'), err?.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  return (
    <ImageBackground source={require('../../assets/images/login_bg1.jpg')} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />

      <ForgotPasswordModal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
        defaultEmail={email}
        showAlert={showAlert}
      />

      {authOverlayVisible ? (
        <View style={styles.authOverlay}>
          <Animated.View
            style={[
              styles.authLogoWrap,
              { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
            ]}
          >
            <FlowerRoulette style={styles.authLogo} tapToSpin={false} />
          </Animated.View>

          <Text style={styles.authTitle}>{t('login.transition.title')}</Text>
          <Text style={styles.authSubtitle}>{t('login.transition.subtitle')}</Text>

          <View style={styles.authProgressPanel}>
            {authSteps.map((label, index) => {
              const isDone = index < authStep;
              const isActive = index === authStep;

              return (
                <View key={label} style={styles.authStepRow}>
                  <View
                    style={[
                      styles.authStepDot,
                      isDone && styles.authStepDotDone,
                      isActive && styles.authStepDotActive,
                    ]}
                  >
                    {isDone ? <Text style={styles.authStepCheck}>OK</Text> : null}
                  </View>
                  <Text
                    style={[
                      styles.authStepText,
                      (isDone || isActive) && styles.authStepTextActive,
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
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top - 8, 0) : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 58, 72),
              paddingBottom: Math.max(insets.bottom + 32, 44),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="always"
          showsVerticalScrollIndicator={false}
        >
          
          <View style={[styles.langWrapper, { top: insets.top + 12 }]}>
            <LanguageSwitcher />
          </View>

          <View style={styles.logoContainer}>
            <FlowerRoulette style={styles.logo} tapToSpin />
          </View>

          {/* Card ההתחברות */}
          <View style={styles.card}>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

            <TextInput
              label={t('login.fields.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              textContentType="username"
              keyboardType="email-address"
              mode="outlined"
              style={styles.input}
              outlineColor="transparent"
              activeOutlineColor="#E91E63"
              theme={{ roundness: 12 }}
              left={<TextInput.Icon icon="email-outline" color="#888" />}
            />

            <TextInput
              label={t('login.fields.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              mode="outlined"
              style={styles.input}
              outlineColor="transparent"
              activeOutlineColor="#E91E63"
              theme={{ roundness: 12 }}
              left={<TextInput.Icon icon="lock-outline" color="#888" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  color="#888"
                  onPress={() => setShowPassword((prev) => !prev)}
                />
              }
            />

            <View style={styles.forgotRow}>
              <TouchableOpacity onPress={() => setShowResetModal(true)} disabled={busy}>
                <Text style={styles.forgotLink}>{t('login.links.forgotPassword')}</Text>
              </TouchableOpacity>
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={busy}
              disabled={busy}
              style={styles.loginBtn}
              labelStyle={styles.loginBtnText}
              contentStyle={{ height: 50 }}
            >
              {t('login.buttons.login')}
            </Button>
          </View>

          {/* Google Section - ללא האות G */}
          <View style={styles.googleExternalContainer}>
             <View style={styles.miniDividerContainer}>
                <View style={styles.miniLine} />
                <Text style={styles.orText}>{t('login.or') || 'או'}</Text>
                <View style={styles.miniLine} />
             </View>

             <TouchableOpacity 
                style={styles.googleGlassBtn} 
                onPress={() => navigation.navigate('SocialRegister', { provider: 'Google' })}
                disabled={busy}
             >
                <Text style={styles.googleBtnLabel}>
                  {t('login.buttons.loginWithGoogle')}
                </Text>
             </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('login.links.noAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registration')} disabled={busy}>
              <Text style={styles.registerLink}>{t('login.links.registerNow')}</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 10, 30, 0.4)',
  },
  authOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5000,
    elevation: 5000,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(20, 10, 30, 0.76)',
  },
  authLogoWrap: {
    width: 126,
    height: 126,
    borderRadius: 63,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    marginBottom: 22,
  },
  authLogo: {
    width: 102,
    height: 102,
  },
  authTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 330,
    marginBottom: 26,
  },
  authProgressPanel: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 18,
    marginBottom: 24,
  },
  authStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
  },
  authStepDot: {
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
  authStepDotActive: {
    borderColor: '#F9A8D4',
    backgroundColor: '#E91E63',
  },
  authStepDotDone: {
    borderColor: '#86EFAC',
    backgroundColor: '#22C55E',
  },
  authStepCheck: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  authStepText: {
    flex: 1,
    color: 'rgba(255,255,255,0.56)',
    fontSize: 14,
    fontWeight: '600',
  },
  authStepTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  langWrapper: {
    position: 'absolute',
    left: 12,
    zIndex: 9999,
  },
  logoContainer: { alignItems: 'center', marginBottom: 10 },
  logo: { width: 140, height: 140 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    paddingVertical: 25,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -6,
    marginBottom: 10,
  },
  forgotLink: {
    color: '#E91E63',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  loginBtn: {
    marginTop: 5,
    borderRadius: 50,
    backgroundColor: '#E91E63',
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  
  // Google Button Styles - Clean & Centered
  googleExternalContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  miniDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%',
    marginBottom: 15,
  },
  miniLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  orText: {
    marginHorizontal: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  googleGlassBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    paddingVertical: 14, // מעט יותר גבוה למראה כפתור מלא
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '85%',
    maxWidth: 300,
    alignItems: 'center', // ממרכז את הטקסט בתוך ה-TouchableOpacity
    justifyContent: 'center',
  },
  googleBtnLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 35,
    alignItems: 'center',
    gap: 6,
  },
  footerText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14 },
  registerLink: {
    color: '#FF80AB',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
