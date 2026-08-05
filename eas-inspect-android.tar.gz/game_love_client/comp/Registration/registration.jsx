import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Animated,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';

import LanguageSwitcher from '../../src/localization/components/LanguageSwitcher';
import { useLanguage } from '../../src/localization/LanguageContext';
import i18n from '../../src/localization/i18n';
import { registerUserAccount } from '../../assets/utils/ApiTools';
import CustomAlert from '../../assets/utils/CustomAlert';

const GENDER_MALE = '\u05d6\u05db\u05e8';
const GENDER_FEMALE = '\u05e0\u05e7\u05d1\u05d4';

const Registration = ({ navigation }) => {
  const { lang, ready } = useLanguage();

  const t = useMemo(() => {
    return (key, options) => i18n.t(key, { ...options, locale: lang });
  }, [lang]);

  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [errorKeys, setErrorKeys] = useState({});
  const [busy, setBusy] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    onOk: null,
  });

  const scrollViewRef = useRef();
  const detailsAnim = useRef(new Animated.Value(0)).current;
  const socialAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (gender) {
      Animated.parallel([
        Animated.timing(detailsAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(socialAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
      return;
    }

    Animated.parallel([
      Animated.timing(detailsAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(socialAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [gender, detailsAnim, socialAnim]);

  const animatedHeight = detailsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });
  const animatedSocialTranslate = socialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  const showAlert = (type, title, message, onOk = null) => {
    setAlertConfig({ visible: true, type, title, message, onOk });
  };

  const handleAlertClose = () => {
    const callback = alertConfig.onOk;
    setAlertConfig((prev) => ({ ...prev, visible: false, onOk: null }));
    if (callback) callback();
  };

  const buildErrorKeys = (model) => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    const ageRegex = /^(1[89]|[2-9]\d)$/;

    if (!model.nickname?.trim()) {
      errors.nickname = 'registration.errors.nicknameRequired';
    }
    if (!model.gender) {
      errors.gender = 'registration.errors.genderRequired';
    }

    if (!model.email?.trim()) {
      errors.email = 'registration.errors.emailRequired';
    } else if (!emailRegex.test(model.email)) {
      errors.email = 'registration.errors.emailInvalid';
    }

    if (!model.password) {
      errors.password = 'registration.errors.passwordRequired';
    } else if (!passwordRegex.test(model.password)) {
      errors.password = 'registration.errors.passwordWeak';
    }

    if (model.confirmPassword !== model.password) {
      errors.confirmPassword = 'registration.errors.passwordsNotMatch';
    }

    const numericAge = Number(model.age);
    if (!model.age || Number.isNaN(numericAge) || numericAge <= 0) {
      errors.age = 'registration.errors.ageInvalid';
    } else if (!ageRegex.test(String(model.age).trim())) {
      errors.age = 'registration.errors.ageMustBe18';
    }

    return errors;
  };

  const validate = (field, value) => {
    const model = {
      nickname,
      gender,
      email,
      password,
      confirmPassword,
      age,
      ...(field ? { [field]: value } : {}),
    };
    const errors = buildErrorKeys(model);

    setErrorKeys(errors);
    if (field) return undefined;
    return Object.keys(errors).length === 0;
  };

  const registerUser = async () => {
    if (!validate()) return;

    setBusy(true);
    try {
      const payload = {
        nickname: nickname.trim(),
        gender,
        email: email.trim(),
        passwordHash: password,
        age: Number(age),
      };

      const { response: res, raw, data } = await registerUserAccount(payload);

      if (res.ok) {
        showAlert(
          'success',
          t('alerts.successTitle'),
          t('registration.alerts.verifyEmailNotice'),
          () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login', params: { email: email.trim() } }],
            });
          }
        );
        return;
      }

      const errMsg =
        data?.message ||
        data?.error ||
        raw ||
        t('registration.alerts.registerHttpError', { status: res.status });

      const normalizedErrMsg = String(errMsg || '').toLowerCase();
      if (
        normalizedErrMsg.includes('email address already exists') ||
        normalizedErrMsg.includes('email already exists')
      ) {
        showAlert(
          'error',
          t('alerts.errorTitle'),
          t('registration.alerts.emailAlreadyExists')
        );
        return;
      }

      showAlert('error', t('alerts.errorTitle'), errMsg);
    } catch (err) {
      showAlert(
        'error',
        t('alerts.networkErrorTitle'),
        err?.message || String(err)
      );
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <ImageBackground
      source={require('../../assets/images/reg_page_bg.jpg')}
      style={styles.background}
    >
      <View style={styles.langWrap}>
        <LanguageSwitcher />
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={handleAlertClose}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('registration.title')}</Text>

          <TextInput
            label={t('registration.fields.nickname')}
            mode="outlined"
            dense
            value={nickname}
            onChangeText={(text) => {
              setNickname(text);
              validate('nickname', text);
            }}
            error={!!errorKeys.nickname}
            style={styles.input}
          />
          {errorKeys.nickname ? (
            <Text style={styles.errorText}>{t(errorKeys.nickname)}</Text>
          ) : null}

          <Text style={styles.label}>{t('registration.fields.genderLabel')}</Text>
          {errorKeys.gender ? (
            <Text style={[styles.errorText, { alignSelf: 'flex-start' }]}>
              {t(errorKeys.gender)}
            </Text>
          ) : null}

          <View style={styles.genderContainer}>
            <TouchableOpacity
              onPress={() => {
                setGender(GENDER_MALE);
                validate('gender', GENDER_MALE);
              }}
              style={[
                styles.genderButton,
                gender === GENDER_MALE && styles.genderButtonSelected,
              ]}
            >
              <Text style={styles.genderEmoji}>👦🏻</Text>
              <Text style={styles.genderText}>{t('registration.gender.male')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setGender(GENDER_FEMALE);
                validate('gender', GENDER_FEMALE);
              }}
              style={[
                styles.genderButton,
                gender === GENDER_FEMALE && styles.genderButtonSelected,
              ]}
            >
              <Text style={styles.genderEmoji}>👧🏻</Text>
              <Text style={styles.genderText}>
                {t('registration.gender.female')}
              </Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={{ overflow: 'hidden', height: animatedHeight }}>
            <View style={styles.expandedBlock}>
              <TextInput
                label={t('registration.fields.email')}
                mode="outlined"
                dense
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  validate('email', text);
                }}
                error={!!errorKeys.email}
                style={styles.input}
              />
              {errorKeys.email ? (
                <Text style={styles.errorText}>{t(errorKeys.email)}</Text>
              ) : null}

              <TextInput
                label={t('registration.fields.password')}
                mode="outlined"
                dense
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  validate('password', text);
                }}
                error={!!errorKeys.password}
                style={styles.input}
              />
              {errorKeys.password ? (
                <Text style={styles.errorText}>{t(errorKeys.password)}</Text>
              ) : null}

              <TextInput
                label={t('registration.fields.confirmPassword')}
                mode="outlined"
                dense
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  validate('confirmPassword', text);
                }}
                error={!!errorKeys.confirmPassword}
                style={styles.input}
              />
              {errorKeys.confirmPassword ? (
                <Text style={styles.errorText}>{t(errorKeys.confirmPassword)}</Text>
              ) : null}

              <TextInput
                label={t('registration.fields.age')}
                mode="outlined"
                dense
                keyboardType="numeric"
                value={age}
                onChangeText={(text) => {
                  setAge(text);
                  validate('age', text);
                }}
                error={!!errorKeys.age}
                style={styles.input}
              />
              {errorKeys.age ? (
                <Text style={styles.errorText}>{t(errorKeys.age)}</Text>
              ) : null}

              <Button
                mode="contained"
                icon="heart"
                onPress={registerUser}
                disabled={busy}
                buttonColor="#e91e63"
                textColor="white"
                style={[styles.heartButton, { width: 300 }]}
              >
                {busy
                  ? t('common.general.sending')
                  : t('registration.buttons.register')}
              </Button>

              {busy ? (
                <View style={{ marginTop: 10 }}>
                  <ActivityIndicator />
                </View>
              ) : null}
            </View>
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: animatedSocialTranslate }],
              width: '100%',
              alignItems: 'center',
              marginTop: 10,
            }}
          >
            <Button
              mode="outlined"
              icon="google"
              textColor="#DB4437"
              onPress={() =>
                navigation.navigate('SocialRegister', { provider: 'Google' })
              }
              style={styles.socialButton}
            >
              {t('registration.buttons.registerWithGoogle')}
            </Button>
          </Animated.View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>
              {t('registration.links.haveAccount')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: 'cover' },
  langWrap: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 0) + 14,
    left: 12,
    zIndex: 9999,
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    width: 300,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  genderButton: {
    alignItems: 'center',
    padding: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 12,
    width: 100,
    backgroundColor: '#ffffff66',
  },
  genderButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  genderEmoji: {
    fontSize: 30,
  },
  genderText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5,
  },
  heartButton: {
    marginTop: 20,
    borderRadius: 30,
    paddingVertical: 5,
    elevation: 3,
  },
  socialButton: {
    marginTop: 10,
    width: 300,
    borderRadius: 25,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  linkText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    textDecorationLine: 'underline',
  },
  expandedBlock: {
    alignItems: 'center',
  },
});

export default Registration;
