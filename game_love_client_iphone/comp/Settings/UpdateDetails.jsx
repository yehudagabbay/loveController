import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomAlert from '../../assets/utils/CustomAlert';
import { updateUserDetails } from '../../assets/utils/ApiTools';
import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';
import TopMenu from './TopMenu';

export default function UpdateDetails({ navigation, route }) {
  const { lang, ready } = useLanguage();
  const insets = useSafeAreaInsets();

  const t = useMemo(() => {
    return (key, vars) => i18n.t(key, { ...vars, locale: lang });
  }, [lang]);

  const routeUser = route?.params?.user || {};
  const routeUserId = String(route?.params?.userId || routeUser?.UserID || '');

  const [userId, setUserId] = useState(routeUserId);
  const [existingUser, setExistingUser] = useState(routeUser);
  const [nickname, setNickname] = useState(routeUser?.Nickname || '');
  const [gender, setGender] = useState(
    routeUser?.Gender && routeUser.Gender !== 'N/A' ? routeUser.Gender : ''
  );
  const [age, setAge] = useState(routeUser?.Age != null ? String(routeUser.Age) : '');
  const [busy, setBusy] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'error',
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
    if (typeof callback === 'function') callback();
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [storedUserId, storedUserRaw] = await Promise.all([
          SecureStore.getItemAsync('lg_userId'),
          SecureStore.getItemAsync('lg_user'),
        ]);

        if (!mounted) return;

        const parsedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
        const resolvedUserId = routeUserId || String(storedUserId || parsedUser?.UserID || '');
        const resolvedUser = Object.keys(routeUser || {}).length ? routeUser : parsedUser || {};

        if (resolvedUserId) {
          setUserId(resolvedUserId);
        }

        setExistingUser(resolvedUser);

        if (!nickname && resolvedUser?.Nickname) {
          setNickname(resolvedUser.Nickname);
        }

        if (!gender && resolvedUser?.Gender && resolvedUser.Gender !== 'N/A') {
          setGender(resolvedUser.Gender);
        }

        if (!age && resolvedUser?.Age != null) {
          setAge(String(resolvedUser.Age));
        }
      } catch {
      }
    })();

    return () => {
      mounted = false;
    };
  }, [routeUser, routeUserId]);

  const handleSave = async () => {
    const trimmedNickname = nickname.trim();
    const parsedAge = Number(age);

    if (!userId) {
      showAlert('error', t('alerts.errorTitle'), t('updateDetails.errors.missingUserId'));
      return;
    }

    if (!trimmedNickname) {
      showAlert('error', t('alerts.errorTitle'), t('registration.errors.nicknameRequired'));
      return;
    }

    if (!gender) {
      showAlert('error', t('alerts.errorTitle'), t('registration.errors.genderRequired'));
      return;
    }

    if (!age || Number.isNaN(parsedAge) || parsedAge < 18) {
      showAlert('error', t('alerts.errorTitle'), t('registration.errors.ageMustBe18'));
      return;
    }

    setBusy(true);
    try {
      const { response, raw, data } = await updateUserDetails({
        userId,
        nickname: trimmedNickname,
        gender,
        age: parsedAge,
      });

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.Message ||
            raw ||
            t('updateDetails.errors.updateFailed')
        );
      }

      const updatedUser = {
        ...existingUser,
        UserID: Number(userId),
        Nickname: data?.Nickname || trimmedNickname,
        Gender: data?.Gender || gender,
        Age: data?.Age ?? parsedAge,
      };

      await SecureStore.setItemAsync('lg_userId', String(userId));
      await SecureStore.setItemAsync('lg_user', JSON.stringify(updatedUser));

      showAlert(
        'success',
        t('alerts.successTitle'),
        t('updateDetails.success.message'),
        () =>
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'GameModeSelect',
                params: { userId: String(userId), user: updatedUser },
              },
            ],
          })
      );
    } catch (error) {
      showAlert(
        'error',
        t('alerts.errorTitle'),
        error?.message || t('updateDetails.errors.updateFailed')
      );
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <ImageBackground
      source={require('../../assets/images/updateBG.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <TopMenu navigation={navigation} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top - 8, 0) : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 24, 44),
              paddingBottom: Math.max(insets.bottom + 24, 44),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="always"
          showsVerticalScrollIndicator={false}
        >
          <CustomAlert
            visible={alertConfig.visible}
            type={alertConfig.type}
            title={alertConfig.title}
            message={alertConfig.message}
            onClose={handleAlertClose}
          />

          <View style={styles.card}>
            <Text style={styles.title}>{t('updateDetails.title')}</Text>
            <Text style={styles.subtitle}>
              {t('updateDetails.subtitle')}
            </Text>

            <TextInput
              label={t('registration.fields.nickname')}
              value={nickname}
              onChangeText={setNickname}
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'Male' && styles.genderButtonActive]}
                onPress={() => setGender('Male')}
                disabled={busy}
              >
                <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>
                  {t('registration.gender.male')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.genderButton, gender === 'Female' && styles.genderButtonActive]}
                onPress={() => setGender('Female')}
                disabled={busy}
              >
                <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>
                  {t('registration.gender.female')}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              label={t('registration.fields.age')}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={busy}
              disabled={busy}
              style={styles.saveButton}
              labelStyle={styles.saveButtonText}
            >
              {t('updateDetails.buttons.save')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 10, 30, 0.45)',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  input: {
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderButtonActive: {
    borderColor: '#e91e63',
    backgroundColor: '#fde7ef',
  },
  genderText: {
    color: '#374151',
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#c2185b',
  },
  saveButton: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: '#e91e63',
  },
  saveButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
