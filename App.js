// App.js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, Platform, useColorScheme } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen'; 
import LoginScreen from './screens/LoginScreen'; 
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const systemScheme = useColorScheme();
  
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    (async () => {
      // 🚀 CORREÇÃO: Sincroniza o timer com a duração exata da animação total (1500ms GIF + 800ms Fade Mascote + 300ms Fade Tela = 2600ms).
      const MINIMUM_DISPLAY_TIME = 2600; 
      const displayTimer = new Promise(resolve => setTimeout(resolve, MINIMUM_DISPLAY_TIME));
      
      try {
        await Notifications.requestPermissionsAsync();
        
        const savedUserJson = await AsyncStorage.getItem('@last_logged_in_user');
        if (savedUserJson) {
            setLoggedInUser(JSON.parse(savedUserJson));
        }
        
      } catch (e) {
        console.warn('Notification or Auth Check error:', e);
      } finally {
        await displayTimer; 
        setIsLoadingAuth(false);
      }
    })();
  }, []);
  
  const handleAuthentication = async (userProfile) => {
    await AsyncStorage.setItem('@last_logged_in_user', JSON.stringify(userProfile));
    setLoggedInUser(userProfile);
  };
  
  const handleLogout = async () => {
    await AsyncStorage.removeItem('@last_logged_in_user');
    setLoggedInUser(null);
  };

  if (isLoadingAuth || !splashAnimationFinished) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={systemScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <SplashScreen onFinish={() => {
            setSplashAnimationFinished(true); 
        }} /> 
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={systemScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {loggedInUser ? (
        <HomeScreen 
            user={loggedInUser} 
            onLogout={handleLogout} 
            onUpdateUser={handleAuthentication}
        /> 
      ) : (
        <LoginScreen onAuthenticate={handleAuthentication} />
      )}
    </SafeAreaView>
  );
}