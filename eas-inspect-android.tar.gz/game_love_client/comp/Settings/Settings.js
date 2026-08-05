import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { logoutAndGoHome } from '../../assets/utils/logout';
import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

export function LogoutButton({ navigation, confirm = true, style, textStyle }) {
  const { ready } = useLanguage();
  const t = (key, vars) => i18n.t(key, vars);

  const onPress = () => {
    if (confirm) {
      Alert.alert(t('settings.logout.title'), t('settings.logout.message'), [
        { text: t('settings.buttons.cancel'), style: 'cancel' },
        {
          text: t('settings.buttons.logout'),
          style: 'destructive',
          onPress: () => logoutAndGoHome(navigation),
        },
      ]);
    } else {
      logoutAndGoHome(navigation);
    }
  };

  if (!ready) return null;

  return (
    <TouchableOpacity style={[styles.logoutBtn, style]} onPress={onPress}>
      <Text style={[styles.logoutText, textStyle]}>{t('settings.buttons.logout')}</Text>
    </TouchableOpacity>
  );
}

export default function Settings({ navigation }) {
  const { ready } = useLanguage();
  const t = (key, vars) => i18n.t(key, vars);

  if (!ready) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>
      <LogoutButton navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7f7fb' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#E53935',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoutText: { color: '#E53935', fontSize: 16, fontWeight: '700' },
});
