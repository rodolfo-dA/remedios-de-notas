// App.js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, Platform, useColorScheme } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen'; 
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  // Objeto do usuário logado ou null
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 
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
      try {
        await Notifications.requestPermissionsAsync();
        
        // 1. Verificar se há um usuário salvo para login automático (manter a sessão)
        const savedUserJson = await AsyncStorage.getItem('@last_logged_in_user');
        if (savedUserJson) {
            setLoggedInUser(JSON.parse(savedUserJson));
        }
        
      } catch (e) {
        console.warn('Notification or Auth Check error:', e);
      } finally {
        setIsLoadingAuth(false);
      }
    })();
  }, []);
  
  // Função passada para LoginScreen/CreateProfile para logar o usuário
  const handleAuthentication = async (userProfile) => {
    // Guarda o perfil logado no estado e no AsyncStorage para persistência.
    await AsyncStorage.setItem('@last_logged_in_user', JSON.stringify(userProfile));
    setLoggedInUser(userProfile);
  };
  
  // Função para deslogar (voltar para a tela de login/trocar usuário)
  const handleLogout = async () => {
    // Remove o usuário logado atualmente (mas mantém o perfil cadastrado)
    await AsyncStorage.removeItem('@last_logged_in_user');
    setLoggedInUser(null);
  };

  if (showSplash || isLoadingAuth) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={systemScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <SplashScreen onFinish={() => setShowSplash(false)} /> 
      </SafeAreaView>
    );
  }

  // Renderiza Login ou Home
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={systemScheme === 'dark' ? 'light-content' : 'dark-content'} />
      {loggedInUser ? (
        // Passa o usuário logado e as funções para o HomeScreen
        <HomeScreen 
            user={loggedInUser} 
            onLogout={handleLogout} 
            onUpdateUser={handleAuthentication} // Usado para atualizar a senha/foto
        /> 
      ) : (
        // LoginScreen usa a função de autenticação
        <LoginScreen onAuthenticate={handleAuthentication} />
      )}
    </SafeAreaView>
  );
}