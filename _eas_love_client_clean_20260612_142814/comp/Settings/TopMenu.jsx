import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Linking,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

const LIGHT_SCREENS = [
  'FamilyCardsSelect',
  'FriendsCardsSelect',
  'GameHome',
  'IndexGame',
  'UpdateDetails',
  'FeedbackScreen',
  'Help',
  'About',
  'Info',
  'PrivacyPolicy',
];

const HOME_INFO_SCREENS = [
  'GameModeSelect',
  'GameHome',
  'FamilyCardsSelect',
  'FriendsCardsSelect',
];

export default function TopMenu({ navigation, theme }) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const { lang, setLang, ready } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  useEffect(() => {
    if (lang) {
      i18n.locale = lang;
    }
  }, [lang]);

  const route = useRoute();
  const currentScreenName = route?.name;

  const isLightMode = theme
    ? theme === 'light'
    : LIGHT_SCREENS.includes(currentScreenName);
  const showInfoShortcut = HOME_INFO_SCREENS.includes(currentScreenName);

  const iconColor = isLightMode ? '#334155' : '#ffffff';

  const btnGradient = isLightMode
    ? ['#ffffff', '#f1f5f9']
    : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'];

  const borderColor = isLightMode ? '#cbd5e1' : 'rgba(255,255,255,0.3)';
  const containerStyle = isLightMode ? styles.lightShadow : {};

  const langList = useMemo(
    () => [
      { code: 'en', label: i18n.t('menu.languages.en') },
      { code: 'he', label: i18n.t('menu.languages.he') },
      { code: 'es', label: i18n.t('menu.languages.es') },
      { code: 'ru', label: i18n.t('menu.languages.ru') },
      { code: 'ar', label: i18n.t('menu.languages.ar') },
      { code: 'zh', label: i18n.t('menu.languages.zh') },
      { code: 'fr', label: i18n.t('menu.languages.fr') },
    ],
    [lang],
  );

  const currentLangLabel =
    langList.find((item) => item.code === lang)?.label || i18n.t('menu.languages.en');

  const go = (screenName, params = {}) => {
    setOpen(false);
    setTimeout(() => {
      if (navigation) navigation.navigate(screenName, params);
    }, 100);
  };

  const handleLogout = async () => {
    try {
      setOpen(false);
      await SecureStore.deleteItemAsync('lg_user');
      await SecureStore.deleteItemAsync('lg_isAdult18');

      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch {
      Alert.alert(i18n.t('alerts.errorTitle'), i18n.t('menu.logoutError'));
    }
  };

  const pickLang = async (newLang) => {
    try {
      setLangOpen(false);
      await setLang(newLang);
    } catch {
      setLangOpen(false);
    }
  };

  const openExternalLink = async (url) => {
    try {
      setPolicyOpen(false);
      setOpen(false);
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(i18n.t('alerts.errorTitle'), i18n.t('menu.linkOpenError'));
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(i18n.t('alerts.errorTitle'), i18n.t('menu.linkOpenError'));
    }
  };

  const handleResetInstructions = async () => {
    try {
      const storedUserId = await SecureStore.getItemAsync('lg_userId');
      const keysToDelete = [
        'lg_hideCoupleInstructions',
        'lg_hideFamilyInstructions',
        'lg_hideFriendsInstructions',
        `lg_hideCoupleInstructions_${storedUserId || 'guest'}`,
        `lg_hideFamilyInstructions_${storedUserId || 'guest'}`,
        `lg_hideFriendsInstructions_${storedUserId || 'guest'}`,
      ];

      await Promise.all(keysToDelete.map((key) => SecureStore.deleteItemAsync(key)));
      setOpen(false);
      Alert.alert(
        i18n.t('alerts.successTitle'),
        i18n.t('menu.resetInstructionsSuccess'),
      );
    } catch {
      Alert.alert(i18n.t('alerts.errorTitle'), i18n.t('menu.resetInstructionsError'));
    }
  };

  if (!ready) return null;

  return (
    <>
      <View
        style={[
          styles.triggerContainer,
          { top: insets.top + 12, right: 16 },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setOpen(true)}
          style={[
            styles.menuBtnWrapper,
            containerStyle,
          ]}
        >
          <LinearGradient
            colors={btnGradient}
            style={[styles.menuBtn, { borderColor }]}
          >
            <MaterialCommunityIcons name="menu" size={28} color={iconColor} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showInfoShortcut ? (
        <View
          style={[
            styles.infoTriggerContainer,
            { top: insets.top + 12, left: 16 },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => go('Info')}
            style={[
              styles.menuBtnWrapper,
              containerStyle,
            ]}
          >
            <LinearGradient
              colors={btnGradient}
              style={[styles.menuBtn, { borderColor }]}
            >
              <MaterialCommunityIcons
                name="information-variant-circle-outline"
                size={28}
                color={iconColor}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={[
            styles.backdrop,
            {
              paddingTop: insets.top + 12,
              paddingBottom: Math.max(insets.bottom, 12),
              paddingRight: 12,
              paddingLeft: 12,
            },
          ]}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[
              styles.menuBox,
              {
                width: Math.min(screenWidth - 24, 340),
                maxHeight: screenHeight - insets.top - Math.max(insets.bottom, 12) - 24,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{i18n.t('menu.title')}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuScrollContent}
            >
              <View style={styles.divider} />

              <MenuItem
                title={i18n.t('menu.gameMode')}
                icon="gamepad-variant"
                onPress={() => go('GameModeSelect')}
              />
              <MenuItem
                title={i18n.t('menu.couplesCards')}
                icon="cards-heart"
                onPress={() => go('GameHome', { gameMode: 'couple' })}
              />
              <MenuItem
                title={i18n.t('menu.familyCards')}
                icon="home-heart"
                onPress={() => go('FamilyCardsSelect')}
              />
              <MenuItem
                title={i18n.t('menu.friendsCards')}
                icon="account-group"
                onPress={() => go('FriendsCardsSelect')}
              />

              <View style={styles.divider} />

              <MenuItem
                title={i18n.t('menu.updateDetails')}
                icon="account-edit-outline"
                onPress={() => go('UpdateDetails')}
              />
              <MenuItem
                title={i18n.t('menu.feedback')}
                icon="message-draw"
                onPress={() => go('FeedbackScreen')}
              />
              <MenuItem
                title={i18n.t('menu.help')}
                icon="help-circle-outline"
                onPress={() => go('Help')}
              />

              <View style={styles.divider} />

              <MenuItem
                title={`${i18n.t('menu.language')}: ${currentLangLabel}`}
                icon="translate"
                onPress={() => setLangOpen(true)}
              />

              <View style={styles.divider} />

              <MenuItem
                title={i18n.t('menu.policyPrivacy')}
                icon="shield-lock-outline"
                onPress={() => setPolicyOpen(true)}
              />

              <View style={styles.divider} />

              <MenuItem
                title={i18n.t('alerts.infoTitle')}
                icon="information-variant-circle-outline"
                onPress={() => go('Info')}
              />

              <View style={styles.divider} />

              <MenuItem
                title={i18n.t('menu.about')}
                icon="information-outline"
                onPress={() => go('About')}
              />

              <View style={styles.divider} />

              <MenuItem
                title={i18n.t('menu.logout')}
                icon="logout"
                isDanger
                onPress={handleLogout}
              />

              <View style={styles.divider} />

              <MenuItem
                title={i18n.t('menu.resetInstructions')}
                icon="restore"
                onPress={handleResetInstructions}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={policyOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPolicyOpen(false)}
      >
        <Pressable style={styles.langBackdrop} onPress={() => setPolicyOpen(false)}>
          <Pressable style={styles.langBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.langHeader}>
              <Text style={styles.langTitle}>{i18n.t('menu.policyPrivacy')}</Text>
              <TouchableOpacity onPress={() => setPolicyOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.langItem}
              onPress={() =>
                openExternalLink(
                  'https://drive.google.com/file/d/1RZ8pSvvQNskO06MnnDd3fqijPGEiGhht/view?usp=drive_link',
                )
              }
            >
              <Text style={styles.langText}>{i18n.t('menu.termsOfUse')}</Text>
              <MaterialCommunityIcons
                name="open-in-new"
                size={20}
                color="#38BDF8"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.langItem}
              onPress={() =>
                openExternalLink(
                  'https://drive.google.com/file/d/1Raer4kngethsRHFwtd-ndv8pSbgr_Sty/view?usp=drive_link',
                )
              }
            >
              <Text style={styles.langText}>{i18n.t('menu.privacyPolicy')}</Text>
              <MaterialCommunityIcons
                name="open-in-new"
                size={20}
                color="#38BDF8"
              />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={langOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}
      >
        <Pressable style={styles.langBackdrop} onPress={() => setLangOpen(false)}>
          <Pressable style={styles.langBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.langHeader}>
              <Text style={styles.langTitle}>{i18n.t('menu.chooseLanguage')}</Text>
              <TouchableOpacity onPress={() => setLangOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {langList.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.langItem,
                  lang === item.code && styles.langItemActive,
                ]}
                onPress={() => pickLang(item.code)}
              >
                <Text style={styles.langText}>{item.label}</Text>

                {lang === item.code ? (
                  <MaterialCommunityIcons name="check" size={20} color="#22c55e" />
                ) : (
                  <View style={{ width: 20 }} />
                )}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuItem({ title, icon, onPress, isDanger }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDanger && styles.dangerText]}>
          {title}
        </Text>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={isDanger ? '#ff4b4b' : '#e2e8f0'}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  triggerContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 100,
  },
  infoTriggerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
  },
  menuBtnWrapper: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  lightShadow: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#fff',
    borderRadius: 25,
  },
  menuBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 22,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 15,
  },
  menuBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 10,
  },
  menuScrollContent: {
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 12,
  },
  menuItem: {
    paddingVertical: 12,
  },
  itemContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    color: '#e2e8f0',
    fontSize: 16,
  },
  dangerText: {
    color: '#ff4b4b',
    fontWeight: 'bold',
  },
  langBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  langBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  langHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  langTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  langItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  langItemActive: {
    borderColor: 'rgba(34,197,94,0.45)',
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  langText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
});
