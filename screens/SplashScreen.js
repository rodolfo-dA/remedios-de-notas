// screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

export default function SplashScreen({ onFinish }) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start(() => onFinish && onFinish());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/mascote_intro.gif')}
        style={[styles.logo, { opacity: fadeAnim }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#20A0FF', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 220, height: 220 },
});
