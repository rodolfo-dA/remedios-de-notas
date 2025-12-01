import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

export default function SplashScreen() {
  const mascotFadeAnim = new Animated.Value(1);
  const containerFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(1500),
      Animated.timing(mascotFadeAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.timing(containerFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerFadeAnim }]}>
      <Animated.Image source={require('../assets/mascote_intro.gif')} style={[styles.logo, { opacity: mascotFadeAnim }]} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#219BF4', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 220, height: 220 },
});