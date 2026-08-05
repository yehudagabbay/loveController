import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const PLAYER_ICONS = ['🙂', '😄', '🤩', '😎', '🥳', '😊', '🤗', '😁'];

export default function PlayersSection({
  players,
  setPlayers,
  t,
  lang = 'he',
  titleKey = 'playersSection.title',
  titleDefault,
  addButtonKey = 'playersSection.addButton',
  addButtonDefault,
  placeholderKey = 'playersSection.placeholder',
  placeholderDefault,
  playerLabelPrefixKey = 'playersSection.playerLabel',
  playerLabelPrefixDefault,
  minPlayers = 2,
  maxPlayers = 12,
  containerStyle,
  showRemoveButton = true,
  showAddButton = true,
  hideTitle = false,
  accentColor = '#4F46E5',
}) {
  const isRtl = lang === 'he' || lang === 'ar';

  const getDefaultPlayerName = (index) =>
    t(playerLabelPrefixKey, {
      ...(playerLabelPrefixDefault
        ? { defaultValue: `${playerLabelPrefixDefault} ${index + 1}` }
        : {}),
      num: index + 1,
      number: index + 1,
    });

  const updatePlayerName = (id, value) => {
    setPlayers((current) =>
      current.map((player) =>
        player.id === id ? { ...player, name: value } : player,
      ),
    );
  };

  const addPlayer = () => {
    Haptics.selectionAsync().catch(() => {});
    setPlayers((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        name: '',
      },
    ]);
  };

  const removePlayer = (id) => {
    Haptics.selectionAsync().catch(() => {});
    setPlayers((current) => {
      if (current.length <= minPlayers) return current;
      return current.filter((player) => player.id !== id);
    });
  };

  return (
    <View style={[styles.playersSection, containerStyle]}>
      {!hideTitle && (
        <Text style={styles.playersTitle}>
          {t(titleKey, titleDefault ? { defaultValue: titleDefault } : undefined)}
        </Text>
      )}

      <Text style={[styles.helperText, { textAlign: isRtl ? 'right' : 'left' }]}>
        {t('common.cardSelection.playersHint')}
      </Text>

      <View style={styles.playersList}>
        {players.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.playerRow,
              { flexDirection: isRtl ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: `${accentColor}18` }]}>
              <Text style={styles.avatarEmoji}>
                {PLAYER_ICONS[index % PLAYER_ICONS.length]}
              </Text>
              <View style={[styles.avatarNumber, { backgroundColor: accentColor }]}>
                <Text style={styles.avatarNumberText}>{index + 1}</Text>
              </View>
            </View>

            <View style={styles.playerInputBox}>
              <View
                style={[
                  styles.labelRow,
                  { flexDirection: isRtl ? 'row-reverse' : 'row' },
                ]}
              >
                <Text style={[styles.inputLabel, { textAlign: isRtl ? 'right' : 'left' }]}>
                  {getDefaultPlayerName(index)}
                </Text>
                <Text style={styles.optionalLabel}>
                  {t('common.cardSelection.optional')}
                </Text>
              </View>

              <TextInput
                style={[styles.modernInput, { textAlign: isRtl ? 'right' : 'left' }]}
                placeholder={t(placeholderKey, {
                  defaultValue: placeholderDefault || getDefaultPlayerName(index),
                })}
                placeholderTextColor="#94A3B8"
                value={player.name}
                onChangeText={(value) => updatePlayerName(player.id, value)}
                returnKeyType="done"
              />
            </View>

            {showRemoveButton && players.length > minPlayers && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePlayer(player.id)}
                activeOpacity={0.8}
                accessibilityLabel={t('common.cardSelection.removePlayer')}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {showAddButton && players.length < maxPlayers && (
        <TouchableOpacity
          style={[styles.addButton, { borderColor: accentColor }]}
          onPress={addPlayer}
          activeOpacity={0.8}
        >
          <View style={[styles.addIcon, { backgroundColor: accentColor }]}>
            <Text style={styles.addIconText}>+</Text>
          </View>
          <Text style={[styles.addButtonText, { color: accentColor }]}>
            {t(addButtonKey, addButtonDefault ? { defaultValue: addButtonDefault } : undefined)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  playersSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  playersTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 5,
    textAlign: 'center',
  },
  helperText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  playersList: {
    gap: 10,
  },
  playerRow: {
    minHeight: 82,
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 25,
  },
  avatarNumber: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  playerInputBox: {
    flex: 1,
  },
  labelRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  inputLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  optionalLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  modernInput: {
    minHeight: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  addButton: {
    minHeight: 54,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  addIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 24,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '900',
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  removeButtonText: {
    color: '#E11D48',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 22,
  },
});
