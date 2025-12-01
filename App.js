import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MINIMUM_DISPLAY_TIME = 2600;

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const systemScheme = useColorScheme();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
    (async () => {
      const displayTimer = new Promise(resolve => setTimeout(resolve, MINIMUM_DISPLAY_TIME));
      try {
        await Notifications.requestPermissionsAsync();
        const savedUserJson = await AsyncStorage.getItem('@last_logged_in_user');
        if (savedUserJson) setLoggedInUser(JSON.parse(savedUserJson));
      } catch (e) {
        console.warn(e);
      } finally {
        await displayTimer;
        setIsLoadingAuth(false);
      }
    })();
  }, []);

  const handleAuthentication = async (userProfile) => {
    await AsyncStorage.setItem('@user_profile', JSON.stringify(userProfile));
    await AsyncStorage.setItem('@last_logged_in_user', JSON.stringify(userProfile));
    setLoggedInUser(userProfile);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@last_logged_in_user');
    setLoggedInUser(null);
  };

  if (isLoadingAuth) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={systemScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <SplashScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={systemScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {loggedInUser ? <HomeScreen user={loggedInUser} onLogout={handleLogout} onUpdateUser={handleAuthentication} /> : <LoginScreen onAuthenticate={handleAuthentication} />}
    </SafeAreaView>
  );
}