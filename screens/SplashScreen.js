// screens/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

export default function SplashScreen({ onFinish }) {
  const mascotFadeAnim = new Animated.Value(1);
  const containerFadeAnim = new useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 🚀 MUDANÇA: Redução do delay para sincronizar com a duração do GIF (1500ms).
    // A animação do GIF roda em loop. Usamos um delay antes do FadeOut.
    const GIF_DURATION = 1500; // 1.5 segundos
    const FADE_OUT_DURATION = 800;
    
    // A animação do mascote será visível por 1500ms (1 loop do GIF) antes de dar FadeOut junto com a tela.
    const mascotAnimation = Animated.sequence([
      Animated.delay(GIF_DURATION), 
      Animated.timing(mascotFadeAnim, { toValue: 0, duration: FADE_OUT_DURATION, useNativeDriver: true }),
    ]);

    // Animação do container (executada APÓS o FadeOut do mascote)
    const containerAnimation = Animated.timing(containerFadeAnim, {
      toValue: 0, 
      duration: 300, // Duração suave para o FadeOut da tela azul
      useNativeDriver: true,
    });

    // O mascote some (1500ms + 800ms) e, imediatamente depois, a tela azul começa a sumir (0.3s)
    Animated.sequence([
      mascotAnimation,
      containerAnimation,
    ]).start(() => {
      // Sinaliza que TODAS as animações visuais terminaram (1.5s + 0.8s + 0.3s = 2.6s)
      onFinish && onFinish(); 
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerFadeAnim }]}>
      <Animated.Image
        source={require('../assets/mascote_intro.gif')}
        style={[styles.logo, { opacity: mascotFadeAnim }]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#219BF4', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 220, height: 220 },
});