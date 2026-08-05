import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import ensureAudioPlaybackMode from './audioPlaybackMode';

export default function useDeckCompleteSound(triggerKey) {
  const soundRef = useRef(null);
  const hasPendingPlayRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadSound = async () => {
      try {
        await ensureAudioPlaybackMode();

        const { sound } = await Audio.Sound.createAsync(
          require('../sounds/Achievement unlocked.mp3'),
          { shouldPlay: false, volume: 1 },
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;

        if (hasPendingPlayRef.current) {
          hasPendingPlayRef.current = false;
          await sound.replayAsync();
        }
      } catch (e) { }
    };

    loadSound();

    return () => {
      isMounted = false;
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) {
        sound.unloadAsync().catch(() => { });
      }
    };
  }, []);

  useEffect(() => {
    if (!triggerKey) return;

    const playSound = async () => {
      const sound = soundRef.current;

      if (!sound) {
        hasPendingPlayRef.current = true;
        return;
      }

      try {
        await ensureAudioPlaybackMode();
        await sound.replayAsync();
      } catch (e) { }
    };

    playSound();
  }, [triggerKey]);
}
