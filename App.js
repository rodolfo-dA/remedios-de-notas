// App.js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, Platform, useColorScheme } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen'; 
import LoginScreen from './screens/LoginScreen'; 
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚀 CORREÇÃO: Usar um único estado de carregamento para simplificar a lógica.
// O tempo de 2600ms deve ser respeitado antes de setar isLoadingAuth para false.
const MINIMUM_DISPLAY_TIME = 2600; 

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 
  // Removido: const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);
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
      const displayTimer = new Promise(resolve => setTimeout(resolve, MINIMUM_DISPLAY_TIME));
      
      try {
        await Notifications.requestPermissionsAsync();
        
        const savedUserJson = await AsyncStorage.getItem('@last_logged_in_user');
        if (savedUserJson) {
            setLoggedInUser(JSON.parse(savedUserJson));
        }
        
      } catch (e) {
        // AVISO: O 'finally' deve vir após 'await displayTimer' para garantir o tempo mínimo.
        console.warn('Notification or Auth Check error:', e);
      } finally {
        // 🚀 CORREÇÃO: Garante que o timer de exibição mínima SEMPRE seja aguardado.
        // Isto resolve a race condition da splashscreen.
        await displayTimer; 
        setIsLoadingAuth(false);
      }
    })();
  }, []);
  
  const handleAuthentication = async (userProfile) => {
    // 🚀 MELHORIA: Garante que o perfil mestre também seja atualizado, 
    // embora o Login/Create já façam isso, garante consistência em `onUpdateUser` do HomeScreen.
    await AsyncStorage.setItem('@user_profile', JSON.stringify(userProfile));
    await AsyncStorage.setItem('@last_logged_in_user', JSON.stringify(userProfile));
    setLoggedInUser(userProfile);
  };
  
  const handleLogout = async () => {
    await AsyncStorage.removeItem('@last_logged_in_user');
    setLoggedInUser(null);
  };

  // 🚀 MUDANÇA: A renderização agora depende APENAS do estado de carregamento de Auth/Splash.
  if (isLoadingAuth) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={systemScheme === 'dark' ? 'light-content' : 'dark-content'} />
        {/* SplashScreen não precisa mais de onFinish, ela roda a animação pelo tempo mínimo */}
        <SplashScreen /> 
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