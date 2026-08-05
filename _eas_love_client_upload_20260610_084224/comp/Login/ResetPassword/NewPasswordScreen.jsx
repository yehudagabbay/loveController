import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import CustomAlert from '../../../assets/utils/CustomAlert';
import { confirmPasswordReset } from '../../../assets/utils/ApiTools';
import i18n from '../../../src/localization/i18n';
import { useLanguage } from '../../../src/localization/LanguageContext';
import BGImage from '../../../assets/images/mewPassowrdBG.jpg';

export default function NewPasswordScreen({ route, navigation }) {
  const { email, token } = route.params || {};
  const { lang, ready } = useLanguage();
  const t = useMemo(() => {
    return (key, vars) => i18n.t(key, { ...vars, locale: lang });
  }, [lang]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    onOk: null,
  });

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
    setAlertConfig((prev) => ({ ...prev, visible: false, onOk: null }));
    if (typeof callback === 'function') callback();
  };

  const passwordRegex = useMemo(
    () => /^(?=.*[a-z])(?=.*[A-Z])(?=(?:.*\d){4,}).+$/,
    [],
  );

  const handleSubmit = async () => {
    if (!email || !token) {
      showAlert(
        'error',
        t('alerts.errorTitle'),
        t('newPasswordScreen.errors.missingEmailOrToken')
      );
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      showAlert(
        'error',
        t('alerts.errorTitle'),
        t('newPasswordScreen.errors.emptyFields')
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert(
        'error',
        t('alerts.errorTitle'),
        t('newPasswordScreen.errors.passwordMismatch')
      );
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      showAlert(
        'error',
        t('alerts.errorTitle'),
        t('newPasswordScreen.errors.passwordRules')
      );
      return;
    }

    setBusy(true);

    try {
      const { response, raw } = await confirmPasswordReset({
        email,
        token,
        newPassword,
      });

      if (!response.ok) {
        showAlert(
          'error',
          t('alerts.errorTitle'),
          raw || t('newPasswordScreen.errors.resetFailed')
        );
        return;
      }

      showAlert(
        'success',
        t('alerts.successTitle'),
        t('newPasswordScreen.success.passwordChanged'),
        () => navigation.navigate('Login', { email })
      );
    } catch (error) {
      showAlert(
        'error',
        t('alerts.networkErrorTitle'),
        error?.message || t('newPasswordScreen.errors.network')
      );
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <ImageBackground
      source={BGImage}
      resizeMode="cover"
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.container}>
        <CustomAlert
          visible={alertConfig.visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={handleAlertClose}
        />

        <View style={styles.card}>
          <Text style={styles.title}>{t('newPasswordScreen.title')}</Text>
          <Text style={styles.subtitle}>
            {t('newPasswordScreen.subtitle', { email })}
          </Text>

          <Text style={styles.helperText}>
            {t('newPasswordScreen.helperText')}
          </Text>

          <TextInput
            mode="outlined"
            label={t('newPasswordScreen.fields.newPassword')}
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
            outlineColor="transparent"
            activeOutlineColor="#E91E63"
            theme={{ roundness: 12 }}
            left={<TextInput.Icon icon="lock-outline" color="#777" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                color="#777"
                onPress={() => setShowPassword((prev) => !prev)}
              />
            }
          />

          <TextInput
            mode="outlined"
            label={t('newPasswordScreen.fields.confirmPassword')}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            outlineColor="transparent"
            activeOutlineColor="#E91E63"
            theme={{ roundness: 12 }}
            left={<TextInput.Icon icon="lock-check-outline" color="#777" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                color="#777"
                onPress={() => setShowConfirmPassword((prev) => !prev)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={busy}
            disabled={busy}
            style={styles.saveBtn}
            labelStyle={styles.saveBtnText}
            contentStyle={{ height: 52 }}
          >
            {t('newPasswordScreen.buttons.save')}
          </Button>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login', { email })}
            disabled={busy}
            style={styles.backRow}
          >
            <Text style={styles.backLink}>
              {t('newPasswordScreen.buttons.backToLogin')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.68,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(246, 242, 247, 0.72)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#555',
    fontSize: 15,
    marginBottom: 16,
  },
  helperText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13.5,
    marginBottom: 24,
    lineHeight: 21,
  },
  input: {
    marginBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  saveBtn: {
    marginTop: 12,
    borderRadius: 50,
    backgroundColor: '#E91E63',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  backRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  backLink: {
    color: '#E91E63',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
