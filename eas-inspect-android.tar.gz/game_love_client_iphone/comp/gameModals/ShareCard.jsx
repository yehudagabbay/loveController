import React, { useMemo, forwardRef } from 'react';
import { View, Text, StyleSheet, I18nManager, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import i18n from '../../src/localization/i18n';
import logo from '../../assets/images/logo1.png';

const GAME_TYPES = {
  couples: 'couples',
  friends: 'friends',
  family: 'family',
};

function getGameTheme(gameType, t) {
  switch (gameType) {
    case GAME_TYPES.couples:
      return {
        background: '#FFF5F7',
        border: '#FFD1DC',
        accent: '#E85D8E',
        secondary: '#FFB6C1',
        title: '#8E2D4A',
        text: '#4B2E39',
        label: t('shareCard.gameTypes.couples'),
        icon: 'heart-outline',
      };
    case GAME_TYPES.friends:
      return {
        background: '#F0F7FF',
        border: '#C6E2FF',
        accent: '#4C8DDA',
        secondary: '#9DC4F0',
        title: '#2B5D8A',
        text: '#23384A',
        label: t('shareCard.gameTypes.friends'),
        icon: 'account-group-outline',
      };
    default:
      return {
        background: '#FAF7F0',
        border: '#EBDCB2',
        accent: '#C49A5A',
        secondary: '#E2C995',
        title: '#634823',
        text: '#403728',
        label: t('shareCard.gameTypes.family'),
        icon: 'home-variant-outline',
      };
  }
}

function getCategoryLabel(gameType, categoryId, t) {
  const safeCategoryId = String(Number(categoryId) || 1);
  if (gameType === GAME_TYPES.friends) {
    if (safeCategoryId === '1') return t('friendsCardsGame.categories.intro');
    if (safeCategoryId === '2') return t('friendsCardsGame.categories.fun');
    return t('friendsCardsGame.categories.team');
  }
  if (gameType === GAME_TYPES.family) {
    return t(`familyCardsGame.category.name.${safeCategoryId}`);
  }
  return t(`indexGame.category.name.${safeCategoryId}`);
}

function getLevelLabel(gameType, levelId, t) {
  const safeLevelId = String(Number(levelId) || 1);
  if (gameType === GAME_TYPES.friends) {
    if (safeLevelId === '1') return t('friendsCardsGame.levels.easy');
    if (safeLevelId === '2') return t('friendsCardsGame.levels.medium');
    return t('friendsCardsGame.levels.hard');
  }
  if (gameType === GAME_TYPES.family) {
    return t(`familyCardsGame.level.name.${safeLevelId}`);
  }
  return t(`indexGame.level.name.${safeLevelId}`);
}

const ShareCard = forwardRef(({
  appName = 'LIBA',
  gameType = GAME_TYPES.couples,
  categoryId = 1,
  levelId = 1,
  cardText = '',
  lang = 'he',
  size = 380,
  style,
}, ref) => {
  const t = (key, options) => i18n.t(key, { ...options, locale: lang });
  const theme = useMemo(() => getGameTheme(gameType, t), [gameType, lang]);
  const isRTL = lang === 'he' || I18nManager.isRTL;
  const cardHeight = useMemo(() => {
    if (cardText.length > 150) return Math.round(size * 1.34);
    if (cardText.length > 100) return Math.round(size * 1.22);
    return Math.round(size * 1.12);
  }, [cardText.length, size]);

  const categoryLabel = useMemo(
    () => getCategoryLabel(gameType, categoryId, t),
    [gameType, categoryId, lang]
  );
  const levelLabel = useMemo(
    () => getLevelLabel(gameType, levelId, t),
    [gameType, levelId, lang]
  );

  return (
    <ViewShot ref={ref} options={{ format: 'png', quality: 1.0 }} style={[styles.container, style]}>
      <View
        collapsable={false}
        style={[
          styles.card,
          {
            width: size,
            height: cardHeight,
            borderRadius: Math.max(32, size * 0.13),
            borderWidth: Math.max(8, size * 0.03),
            padding: Math.max(18, size * 0.065),
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={[styles.glow, { backgroundColor: theme.secondary, top: -60, left: -60, opacity: 0.2 }]} />
        <View style={[styles.glow, { backgroundColor: theme.accent, bottom: -80, right: -40, opacity: 0.15 }]} />

        <Image
          source={logo}
          style={[
            styles.backgroundLogo,
            {
              width: size * 0.42,
              height: size * 0.42,
              tintColor: theme.accent,
              opacity: 0.18,
              transform: isRTL ? [{ rotate: '-10deg' }] : [{ rotate: '10deg' }],
            },
          ]}
          resizeMode="contain"
        />

        <View style={styles.header}>
          <Text style={[styles.appName, { color: theme.title }]}>{appName}</Text>
        </View>

        <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <MaterialCommunityIcons name={theme.icon} size={14} color="#FFF" />
            <Text style={styles.badgeText}>{theme.label}</Text>
          </View>

          <View style={[styles.badge, { backgroundColor: theme.title }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#FFF" />
            <Text style={styles.badgeText}>{levelLabel}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <MaterialCommunityIcons
            name="format-quote-open"
            size={42}
            color={theme.accent}
            style={{
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
              opacity: 0.15,
              marginBottom: -10,
            }}
          />
          <Text
            style={[
              styles.cardText,
              {
                color: theme.text,
                textAlign: 'center',
                writingDirection: isRTL ? 'rtl' : 'ltr',
                fontSize:
                  size < 340
                    ? cardText.length > 80
                      ? (cardText.length > 150 ? 15 : 18)
                      : 21
                    : cardText.length > 80
                      ? (cardText.length > 150 ? 18 : 22)
                      : 26,
                lineHeight:
                  size < 340
                    ? cardText.length > 80
                      ? (cardText.length > 150 ? 24 : 28)
                      : 30
                    : 38,
              },
            ]}
          >
            {cardText}
          </Text>
          <MaterialCommunityIcons
            name="format-quote-close"
            size={42}
            color={theme.accent}
            style={{
              alignSelf: isRTL ? 'flex-start' : 'flex-end',
              opacity: 0.15,
              marginTop: -10,
            }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.categoryText, { color: theme.title }]}>#{categoryLabel}</Text>
          <View style={[styles.divider, { backgroundColor: theme.accent, opacity: 0.4 }]} />
          <Text style={[styles.footerSubText, { color: theme.title }]}>
            {t('shareCard.footer.tagline')}
          </Text>
        </View>
      </View>
    </ViewShot>
  );
});

const styles = StyleSheet.create({
  container: { padding: 10 },
  card: {
    justifyContent: 'space-between',
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  glow: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
  backgroundLogo: {
    position: 'absolute',
    bottom: -10,
    right: 15,
    zIndex: 0,
  },
  header: { alignItems: 'center', zIndex: 10 },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    opacity: 0.9,
    marginTop: 2,
  },
  badgeRow: { justifyContent: 'center', gap: 10, marginTop: 12, zIndex: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 25,
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  badgeText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, zIndex: 10 },
  cardText: {
    fontWeight: '800',
    lineHeight: 38,
  },
  footer: { alignItems: 'center', zIndex: 10, marginBottom: 5 },
  categoryText: { fontSize: 16, fontWeight: '800', fontStyle: 'italic', marginBottom: 10 },
  divider: { width: 60, height: 3, borderRadius: 2, marginBottom: 10 },
  footerSubText: { fontSize: 12, fontWeight: '700', letterSpacing: 1, opacity: 0.7 },
});

export default ShareCard;
