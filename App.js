// App.js
import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, Platform } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import * as Notifications from 'expo-notifications';

export default function App() {
  useEffect(() => {
    // Handler para exibir notificações quando o app está em foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // pedir permissão para notificações (iOS / Android)
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        // você pode tratar "status !== 'granted'" caso queira mostrar aviso
        console.log('Notification permission status:', status);
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      <HomeScreen />
    </SafeAreaView>
  );
}
