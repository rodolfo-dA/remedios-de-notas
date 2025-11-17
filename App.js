// App.js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null); 
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const systemScheme = useColorScheme();

  // CONFIGURAR NOTIFICAÇÕES
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
      } catch (e) {
        console.warn("Erro ao pedir permissões:", e);
      }
    })();
  }, []);

  // ▶️ MONITORAR LOGIN DO FIREBASE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Firebase Auth mudou:", user);

      if (user) {
        // usuário logado
        setLoggedInUser({
          email: user.email,
          uid: user.uid,
        });
      } else {
        // usuário deslogado
        setLoggedInUser(null);
      }

      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // SAIR DA CONTA
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Erro ao deslogar:", error);
    }
  };

  if (showSplash || isLoadingAuth) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={systemScheme === "dark" ? "light-content" : "dark-content"} />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={systemScheme === "dark" ? "light-content" : "dark-content"} />
      
      {loggedInUser ? (
        <HomeScreen 
          user={loggedInUser}
          onLogout={handleLogout}
        />
      ) : (
        <LoginScreen 
          onAuthenticate={(data) => console.log("LoginScreen chamou:", data)}
        />
      )}
    </SafeAreaView>
  );
}
