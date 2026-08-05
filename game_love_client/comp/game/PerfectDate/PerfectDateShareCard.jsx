import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';

const CARD_WIDTH = 360;
const CARD_HEIGHT = 450;

const copyByLang = {
  he: {
    dateCode: 'קוד דייט',
    secret: 'רגע סודי',
    shared: 'רגע זוגי',
    footer: 'שומרים רגעים שמקרבים ביניכם',
    dialogTitle: 'שתף כרטיס דייט',
  },
  en: {
    dateCode: 'Date code',
    secret: 'Secret moment',
    shared: 'Couple moment',
    footer: 'Save moments that bring you closer',
    dialogTitle: 'Share date card',
  },
  fr: {
    dateCode: 'Code du rencard',
    secret: 'Moment secret',
    shared: 'Moment \u00e0 deux',
    footer: 'Gardez les moments qui vous rapprochent',
    dialogTitle: 'Partager la carte du rencard',
  },
  ar: {
    dateCode: 'رمز الموعد',
    secret: 'لحظة سرية',
    shared: 'لحظة مشتركة',
    footer: 'احتفظوا باللحظات التي تقربكم',
    dialogTitle: 'مشاركة بطاقة الموعد',
  },
  ru: {
    dateCode: 'Код свидания',
    secret: 'Тайный момент',
    shared: 'Момент для двоих',
    footer: 'Сохраняйте моменты, которые делают вас ближе',
    dialogTitle: 'Поделиться картой свидания',
  },
  zh: {
    dateCode: '约会代码',
    secret: '秘密时刻',
    shared: '两个人的时刻',
    footer: '保存那些让你们更靠近的时刻',
    dialogTitle: '分享约会卡片',
  },
  es: {
    dateCode: 'Código de cita',
    secret: 'Momento secreto',
    shared: 'Momento de los dos',
    footer: 'Guarda los momentos que los acercan',
    dialogTitle: 'Compartir carta de la cita',
  },
};

const isRtlLanguage = (lang) => lang === 'he' || lang === 'ar' || I18nManager.isRTL;

function getTextSize(text) {
  const length = String(text || '').length;
  if (length > 210) return { fontSize: 19, lineHeight: 27 };
  if (length > 145) return { fontSize: 22, lineHeight: 31 };
  if (length > 90) return { fontSize: 25, lineHeight: 35 };
  return { fontSize: 30, lineHeight: 40 };
}

const PerfectDateShareCard = forwardRef(({
  dateNumber,
  label,
  text,
  progressText,
  isSecret = false,
  lang = 'he',
  t,
}, ref) => {
  const viewShotRef = useRef(null);
  const isRTL = isRtlLanguage(lang);
  const copy = copyByLang[lang] || copyByLang.en;
  const textSize = useMemo(() => getTextSize(text), [text]);

  const title = t?.('perfectDate.title') || (lang === 'he' ? 'הדייט המושלם' : 'Perfect Date');
  const cardLabel =
    label ||
    t?.('perfectDate.card.sharedMoment') ||
    copy.shared;
  const safeDateNumber = String(dateNumber || '').trim();

  useImperativeHandle(ref, () => ({
    share: async () => {
      if (!text || !viewShotRef.current?.capture) return false;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return false;

      const uri = await viewShotRef.current.capture();
      if (!uri) return false;

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: copy.dialogTitle,
        UTI: 'public.png',
      });

      return true;
    },
  }), [copy.dialogTitle, text]);

  return (
    <View pointerEvents="none" style={styles.captureHost}>
      <ViewShot
        ref={viewShotRef}
        options={{
          format: 'png',
          quality: 1,
          width: 1080,
          height: 1350,
        }}
        style={styles.shot}
      >
        <LinearGradient
          colors={['#FFF7FA', '#FCE7F3', '#FFF7ED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
          collapsable={false}
        >
          <View style={[styles.glow, styles.glowTop]} />
          <View style={[styles.glow, styles.glowBottom]} />

          <View style={[styles.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.brandBlock}>
              <Text style={[styles.brand, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                LIBA
              </Text>
              <Text style={[styles.title, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                {title}
              </Text>
            </View>

            <View style={styles.iconBadge}>
              <MaterialCommunityIcons name="calendar-heart" size={28} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.heroCircle}>
            <MaterialCommunityIcons
              name={isSecret ? 'heart-lock' : 'cards-heart'}
              size={58}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.contentBox}>
            <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.metaPill}>
                <Text style={[styles.metaText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                  {isSecret ? copy.secret : cardLabel}
                </Text>
              </View>

              {progressText ? (
                <View style={styles.progressPill}>
                  <Text style={styles.progressText}>{progressText}</Text>
                </View>
              ) : null}
            </View>

            <Text
              style={[
                styles.cardText,
                textSize,
                {
                  textAlign: 'center',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}
              numberOfLines={9}
              adjustsFontSizeToFit
            >
              {text}
            </Text>
          </View>

          <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {safeDateNumber ? (
              <View style={styles.codeBox}>
                <Text style={[styles.codeLabel, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
                  {copy.dateCode}
                </Text>
                <Text style={styles.codeValue}>{safeDateNumber}</Text>
              </View>
            ) : null}

            <Text style={[styles.footerText, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
              {copy.footer}
            </Text>
          </View>
        </LinearGradient>
      </ViewShot>
    </View>
  );
});

const styles = StyleSheet.create({
  captureHost: {
    position: 'absolute',
    left: -5000,
    top: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    opacity: 0.99,
  },
  shot: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FFF7FA',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: '#FFF7FA',
  },
  glow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
  },
  glowTop: {
    top: -70,
    right: -56,
    backgroundColor: 'rgba(190,24,93,0.2)',
  },
  glowBottom: {
    left: -86,
    bottom: -82,
    backgroundColor: 'rgba(251,146,60,0.2)',
  },
  topRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  brandBlock: {
    flex: 1,
  },
  brand: {
    color: '#BE185D',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 4,
  },
  title: {
    marginTop: 4,
    color: '#5B1B2E',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BE185D',
    shadowColor: '#9F1239',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  heroCircle: {
    alignSelf: 'center',
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DB2777',
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#9F1239',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  contentBox: {
    borderRadius: 32,
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.16)',
    minHeight: 170,
    justifyContent: 'center',
  },
  metaRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  metaPill: {
    flex: 1,
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(190,24,93,0.1)',
  },
  metaText: {
    color: '#8A3048',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  progressPill: {
    minWidth: 54,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B1B2E',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  cardText: {
    color: '#5B1B2E',
    fontWeight: '900',
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 2,
  },
  codeBox: {
    minWidth: 112,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.16)',
    alignItems: 'center',
  },
  codeLabel: {
    color: '#8A3048',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  codeValue: {
    color: '#BE185D',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  footerText: {
    flex: 1,
    color: '#7A2E43',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});

export default PerfectDateShareCard;
