import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function LikeStatus({
  active = false,
  onToggle,
  disabled = false,
  title = 'אהבתי במיוחד',
  subtitle = 'שלוף רק כרטיסים שסימנתי באהבתי במיוחד',
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          active && styles.buttonActive,
          disabled && styles.buttonDisabled,
        ]}
        activeOpacity={0.85}
        onPress={onToggle}
        disabled={disabled}
      >
        <Text style={[styles.icon, active && styles.iconActive]}>
          ♥
        </Text>
        <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
          {active ? 'פעיל' : 'כבוי'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFF5F8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD7E3',
    marginBottom: 14,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7A1F44',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: '#7A5064',
  },
  button: {
    minWidth: 88,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3B3C9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonActive: {
    backgroundColor: '#FF4D8D',
    borderColor: '#FF4D8D',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 14,
    color: '#C44976',
    fontWeight: '800',
    marginBottom: 1,
  },
  iconActive: {
    color: '#FFFFFF',
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A33D67',
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
});
