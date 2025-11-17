// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseConfig';
import CreateProfileScreen from './CreateProfileScreen';

export default function LoginScreen({ onAuthenticate }) {
  const styles = useGlobalStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const isDark = styles.container.backgroundColor === '#0B1220';

  // Se o usuário clicou em "Criar conta", abre tela de cadastro
  if (isCreating) {
    return <CreateProfileScreen onCancel={() => setIsCreating(false)} onAccountCreated={onAuthenticate} />;
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      const user = userCredential.user;

      // devolvemos o user para o App.js
      onAuthenticate({ email: user.email, uid: user.uid });

    } catch (error) {
      console.log("Erro de login:", error.code);

      if (error.code === 'auth/user-not-found') {
        Alert.alert("Erro", "Usuário não encontrado.");
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert("Erro", "Senha incorreta.");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("Erro", "Email inválido.");
      } else {
        Alert.alert("Erro", "Não foi possível fazer login.");
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={localStyles.scrollContainer}>
        <Text style={[styles.headerTitle, { marginBottom: 30 }]}>Entrar no Remédios de Notas</Text>

        <TextInput 
          style={styles.input} 
          placeholder="Email" 
          placeholderTextColor={isDark ? '#9AA7B2' : '#899'} 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none"
        />

        <TextInput 
          style={[styles.input, { marginBottom: 20 }]} 
          placeholder="Senha" 
          placeholderTextColor={isDark ? '#9AA7B2' : '#899'} 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />

        <TouchableOpacity style={styles.addButton} onPress={handleLogin}>
          <Text style={styles.addButtonText}>ENTRAR</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={localStyles.createProfileButton} 
          onPress={() => setIsCreating(true)}
        >
          <Text style={localStyles.createProfileText}>Criar Conta</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  createProfileButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  createProfileText: {
    color: '#1E90FF',
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
