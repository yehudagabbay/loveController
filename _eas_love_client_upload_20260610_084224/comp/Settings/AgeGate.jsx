import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ✅ i18n + Language Context
import i18n from '../../src/localization/i18n';
import { useLanguage } from '../../src/localization/LanguageContext';

export default function AgeGate({ onConfirm, onDeny }) {
  // ✅ כדי שהמודאל יעשה rerender כשהשפה משתנה
  const { lang } = useLanguage();
  const t = (key, vars) => i18n.t(key, vars);

  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleConfirm = () => {
    // אנו מעבירים לאבא את ההחלטה האם לשמור או לא
    onConfirm(dontAskAgain);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>

        {/* אייקון בראש המודאל */}
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="shield-account" size={40} color="#ff4b2b" />
        </View>

        <Text style={styles.title}>{t('ageGate.title')}</Text>
        <Text style={styles.subtitle}>
          {t('ageGate.message')}
        </Text>

        {/* אזור הצ'ק בוקס */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          activeOpacity={0.8}
          onPress={() => setDontAskAgain(!dontAskAgain)}
        >
          <MaterialCommunityIcons
            name={dontAskAgain ? "checkbox-marked" : "checkbox-blank-outline"}
            size={24}
            color={dontAskAgain ? "#ff4b2b" : "#ccc"}
          />
          <Text style={styles.checkboxText}>{t('ageGate.rememberMe')}</Text>
        </TouchableOpacity>

        {/* כפתור אישור */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleConfirm}>
          <LinearGradient
            colors={['#ff416c', '#ff4b2b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmBtn}
          >
            <Text style={styles.confirmText}>{t('ageGate.confirm')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* כפתור ביטול */}
        <TouchableOpacity style={styles.cancelBtn} onPress={onDeny}>
          <Text style={styles.cancelText}>{t('ageGate.deny')}</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // כהה יותר כדי להבליט את המודאל
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#1e293b', // רקע כהה מודרני (Dark Slate)
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255, 75, 43, 0.15)',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: '#cbd5e1', // אפור בהיר לקריאות
    marginBottom: 24,
    lineHeight: 22,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 10,
    width: '100%',
  },
  checkboxText: {
    color: '#e2e8f0',
    fontSize: 14,
    marginLeft: 10,
  },
  confirmBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
