
 import * as SecureStore from 'expo-secure-store';

export async function logoutAndGoHome(navigation) {
 const KEYS = ['lg_userId', 'lg_email', 'lg_token']; // עדכן לפי מה שאתה שומר
  for (const k of KEYS) { try { await SecureStore.deleteItemAsync(k); } catch {} }


   navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }], 
  });
}
