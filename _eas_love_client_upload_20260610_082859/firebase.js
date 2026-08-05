import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAzPpTKNvRPE64y_1CKj9TVzxJCNf2FGXY",
  authDomain: "liba-game.firebaseapp.com",
  projectId: "liba-game",
  storageBucket: "liba-game.firebasestorage.app",
  messagingSenderId: "726714686390",
  appId: "1:726714686390:web:efd4d7cc4e2a0d9e07ff17",
  measurementId: "G-6SP1KVD780"
};
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export { app, auth };
