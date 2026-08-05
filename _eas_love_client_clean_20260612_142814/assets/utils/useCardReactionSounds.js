import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import ensureAudioPlaybackMode from './audioPlaybackMode';

export default function useCardReactionSounds() {
  const likeSoundRef = useRef(null);
  const reallyLikedSoundRef = useRef(null);
  const pendingLikeSoundRef = useRef(false);
  const pendingReallyLikedSoundRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadSounds = async () => {
      try {
        await ensureAudioPlaybackMode();

        const [{ sound: likeSound }, { sound: reallyLikedSound }] = await Promise.all([
          Audio.Sound.createAsync(
            require('../sounds/likeSound.mp3'),
            { shouldPlay: false, volume: 1 },
          ),
          Audio.Sound.createAsync(
            require('../sounds/ReallyLikedSound.mp3'),
            { shouldPlay: false, volume: 1 },
          ),
        ]);

        if (!isMounted) {
          await Promise.all([
            likeSound.unloadAsync(),
            reallyLikedSound.unloadAsync(),
          ]);
          return;
        }

        likeSoundRef.current = likeSound;
        reallyLikedSoundRef.current = reallyLikedSound;

        if (pendingLikeSoundRef.current) {
          pendingLikeSoundRef.current = false;
          await likeSound.replayAsync();
        }

        if (pendingReallyLikedSoundRef.current) {
          pendingReallyLikedSoundRef.current = false;
          await reallyLikedSound.replayAsync();
        }
      } catch (e) { }
    };

    loadSounds();

    return () => {
      isMounted = false;

      const likeSound = likeSoundRef.current;
      const reallyLikedSound = reallyLikedSoundRef.current;

      likeSoundRef.current = null;
      reallyLikedSoundRef.current = null;

      if (likeSound) {
        likeSound.unloadAsync().catch(() => { });
      }

      if (reallyLikedSound) {
        reallyLikedSound.unloadAsync().catch(() => { });
      }
    };
  }, []);

  const playLikeSound = useCallback(async () => {
    const sound = likeSoundRef.current;

    if (!sound) {
      pendingLikeSoundRef.current = true;
      return;
    }

    try {
      await ensureAudioPlaybackMode();
      await sound.replayAsync();
    } catch (e) { }
  }, []);

  const playReallyLikedSound = useCallback(async () => {
    const sound = reallyLikedSoundRef.current;

    if (!sound) {
      pendingReallyLikedSoundRef.current = true;
      return;
    }

    try {
      await ensureAudioPlaybackMode();
      await sound.replayAsync();
    } catch (e) { }
  }, []);

  return {
    playLikeSound,
    playReallyLikedSound,
  };
}
