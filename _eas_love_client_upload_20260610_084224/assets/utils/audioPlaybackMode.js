import { Audio } from 'expo-av';

let audioModePromise = null;

export default function ensureAudioPlaybackMode() {
  if (!audioModePromise) {
    audioModePromise = Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch((error) => {
      audioModePromise = null;
      throw error;
    });
  }

  return audioModePromise;
}
