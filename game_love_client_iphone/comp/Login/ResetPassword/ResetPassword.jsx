import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import i18n from '../../../src/localization/i18n';
import { useLanguage } from '../../../src/localization/LanguageContext';
import { requestPasswordReset } from '../../../assets/utils/ApiTools';

export default function ResetPassword({
  visible,
  onClose,
  defaultEmail = '',
  showAlert,
}) {
  const { lang, ready } = useLanguage();
  const insets = useSafeAreaInsets();
  const t = useMemo(() => {
    return (key, vars) => i18n.t(key, { ...vars, locale: lang });
  }, [lang]);

  const [email, setEmail] = useState(defaultEmail || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setEmail(defaultEmail || '');
    setBusy(false);
  }, [visible, defaultEmail]);

  const sendResetLink = async () => {
    const trimmedEmail = (email || '').trim();

    if (!trimmedEmail) {
      showAlert?.(
        'error',
        t('alerts.errorTitle'),
        t('resetPasswordModal.errors.emailRequired')
      );
      return;
    }

    setBusy(true);

    try {
      const { response, raw, data } = await requestPasswordReset({
        email: trimmedEmail,
      });

      if (!response.ok) {
        showAlert?.(
          'error',
          t('alerts.errorTitle'),
          data?.message || data?.Message || raw || t('resetPasswordModal.errors.requestFailed')
        );
        return;
      }

      showAlert?.(
        'success',
        t('resetPasswordModal.success.title'),
        t('resetPasswordModal.success.message')
      );
      onClose?.();
    } catch (error) {
      showAlert?.(
        'error',
        t('alerts.networkErrorTitle'),
        error?.message || t('resetPasswordModal.errors.network')
      );
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <Modal
      transparent
      visible={!!visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.top - 8, 0) : 0}
      >
        <Pressable
          style={[
            styles.backdrop,
            {
              paddingTop: Math.max(insets.top + 20, 36),
              paddingBottom: Math.max(insets.bottom + 20, 36),
            },
          ]}
          onPress={onClose}
        >
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>{t('resetPasswordModal.title')}</Text>
            <Text style={styles.sub}>{t('resetPasswordModal.subtitle')}</Text>

            <TextInput
              mode="outlined"
              label={t('resetPasswordModal.fields.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              style={styles.input}
              outlineColor="transparent"
              activeOutlineColor="#E91E63"
              theme={{ roundness: 12 }}
              left={<TextInput.Icon icon="email-outline" color="#888" />}
            />

            <View style={styles.row}>
              <Button mode="text" onPress={onClose} disabled={busy}>
                {t('resetPasswordModal.buttons.cancel')}
              </Button>

              <Button
                mode="contained"
                onPress={sendResetLink}
                loading={busy}
                disabled={busy}
                style={styles.sendBtn}
              >
                {t('resetPasswordModal.buttons.sendLink')}
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    color: '#333',
  },
  sub: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 12,
    color: '#666',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sendBtn: {
    borderRadius: 12,
    backgroundColor: '#E91E63',
  },
});
