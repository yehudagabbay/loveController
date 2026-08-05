import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';

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
  containerStyle,
  showRemoveButton = true,
}) {
  const getDefaultPlayerName = (index) =>
    t(playerLabelPrefixKey, {
      ...(playerLabelPrefixDefault
        ? { defaultValue: `${playerLabelPrefixDefault} ${index + 1}` }
        : {}),
      num: index + 1,
      number: index + 1,
    });

  const getPlayerPlaceholder = (index) => getDefaultPlayerName(index);

  const updatePlayerName = (id, value) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, name: value } : player
      )
    );
  };

  const addPlayer = () => {
    setPlayers((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: '',
      },
    ]);
  };

  const removePlayer = (id) => {
    setPlayers((prev) => {
      if (prev.length <= minPlayers) return prev;
      return prev.filter((player) => player.id !== id);
    });
  };

  return (
    <View style={[styles.playersSection, containerStyle]}>
      <Text style={styles.playersTitle}>
        {t(titleKey, titleDefault ? { defaultValue: titleDefault } : undefined)}
      </Text>

      <View style={styles.playersList}>
        {players.map((player, idx) => (
          <View key={player.id} style={styles.playerRow}>
            <View style={styles.playerInputBox}>
              <Text style={[styles.inputLabel, { textAlign: lang === 'he' ? 'right' : 'left' }]}>
                {getDefaultPlayerName(idx)}
              </Text>

              <TextInput
                style={[styles.modernInput, { textAlign: lang === 'he' ? 'right' : 'left' }]}
                placeholder={getPlayerPlaceholder(idx)}
                placeholderTextColor="#9CA3AF"
                value={player.name}
                onChangeText={(value) => updatePlayerName(player.id, value)}
              />
            </View>

            {showRemoveButton && players.length > minPlayers && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePlayer(player.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={addPlayer} activeOpacity={0.8}>
        <Text style={styles.addButtonText}>
          {t(addButtonKey, addButtonDefault ? { defaultValue: addButtonDefault } : undefined)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  playersSection: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  playersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  playersList: {
    gap: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  playerInputBox: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  modernInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButton: {
    marginTop: 14,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  removeButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#B91C1C',
    fontSize: 18,
    fontWeight: '700',
  },
});
