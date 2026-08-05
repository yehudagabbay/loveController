// App.js
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { googleAuthConfig } from './assets/utils/authConfig';

// ✅ i18n + Language Provider
import { LanguageProvider, useLanguage } from './src/localization/LanguageContext';
import i18n from './src/localization/i18n';

// Screens
import CoupleCardsGame from './comp/game/CoupleGame/CoupleCardsGame';
import Registration from './comp/Registration/registration';
import SocialRegister from './comp/Registration/SocialRegister';
import Login from './comp/Login/Login';
import Settings from './comp/Settings/Settings';
import CoupleCardsSelect from './comp/game/CoupleGame/CoupleCardsSelect';
import WelcomeScreen from './comp/Welcome/WelcomeScreen';
import GameModeSelect from './comp/Welcome/GameModeSelect';
import FriendsCardsGame from './comp/game/FriendGame/FriendsCardsGame';
import FriendsCardsSelect from './comp/game/FriendGame/FriendsCardsSelect';
import FamilyCardsSelect from './comp/game/FamilyGame/FamilyCardsSelect';
import FamilyCardsGame from './comp/game/FamilyGame/FimilyCardsGame';
import TopMenu from './comp/Settings/TopMenu';
import FeedbackScreen from './comp/Settings/FeedbackScreen';
import Help from './comp/Settings/Help';
import About from './comp/Settings/About';
import Info from './comp/Settings/Info';
import PrivacyPolicy from './comp/Settings/PrivacyPolicy';
import UpdateDetails from './comp/Settings/UpdateDetails';

import NewPasswordScreen from './comp/Login/ResetPassword/NewPasswordScreen';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text>Something went wrong.</Text>
          <Text>{this.state.error?.toString()}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [
    'loveclient://',
    'loveclient:/',
    `${googleAuthConfig.redirectScheme}://`,
    `${googleAuthConfig.redirectScheme}:/`,
    Linking.createURL('/'),
  ],
  config: {
    screens: {
      Login: 'login',
      SocialRegister: 'oauthredirect',
      NewPassword: 'reset-password',
    },
  },
};

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <LanguageProvider>
          <AppInner />
        </LanguageProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function AppInner() {
  const [initialRoute, setInitialRoute] = useState(null);
  const { lang, ready } = useLanguage();

  useEffect(() => {
    let mounted = true;

    const timeoutId = setTimeout(() => {
      if (mounted) {
        setInitialRoute('Welcome');
      }
    }, 5000);

    (async () => {
      try {
        const raw = await SecureStore.getItemAsync('lg_user');

        if (mounted) {
          setInitialRoute(raw ? 'GameModeSelect' : 'Welcome');
        }
      } catch {
        if (mounted) setInitialRoute('Welcome');
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!initialRoute || !ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        key={lang}
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="GameModeSelect" component={GameModeSelect} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Registration" component={Registration} />
        <Stack.Screen name="SocialRegister" component={SocialRegister} />
        <Stack.Screen name="IndexGame" component={CoupleCardsGame} />
        <Stack.Screen name="GameHome" component={CoupleCardsSelect} />
        <Stack.Screen
          name="Settings"
          component={Settings}
          options={{ title: i18n.t('settings.title') }}  />
        <Stack.Screen name="FriendsCardsGame" component={FriendsCardsGame} />
        <Stack.Screen name="FriendsCardsSelect" component={FriendsCardsSelect} />
        <Stack.Screen name="FamilyCardsSelect" component={FamilyCardsSelect} />
        <Stack.Screen name="FamilyCardsGame" component={FamilyCardsGame} />
        <Stack.Screen name="TopMenu" component={TopMenu} />
        <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} />
        <Stack.Screen name="Help" component={Help} />
        <Stack.Screen name="About" component={About} />
        <Stack.Screen name="Info" component={Info} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Stack.Screen name="UpdateDetails" component={UpdateDetails} />

        <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
      </Stack.Navigator>

      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
