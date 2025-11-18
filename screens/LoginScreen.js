// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, useColorScheme } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateProfileScreen from './CreateProfileScreen'; 

// Chaves de armazenamento
const USER_PROFILE_KEY = '@user_profile';
const LAST_LOGGED_IN_KEY = '@last_logged_in_user';

export default function LoginScreen({ onAuthenticate }) {
  const scheme = useColorScheme();
  const styles = useGlobalStyles(scheme);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false); 
  const [error, setError] = useState('');
  const isDark = scheme === 'dark'; 

  if (isCreating) {
    // A tela de criação de perfil é renderizada e herda o tema
    return <CreateProfileScreen onCancel={() => setIsCreating(false)} onProfileCreated={onAuthenticate} />;
  }

  // FUNÇÃO PARA LIMPAR O ASYNCSTORAGE
  const handleClearAuthData = async () => {
    Alert.alert(
      "Atenção!",
      "Isto apagará permanentemente o perfil mestre. Você terá que criar a conta novamente. Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Apagar Tudo", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(USER_PROFILE_KEY);
              await AsyncStorage.removeItem(LAST_LOGGED_IN_KEY);
              setUsername('');
              setPassword('');
              Alert.alert("Sucesso", "Dados de usuário removidos. Crie o perfil novamente.");
            } catch (e) {
              Alert.alert("Erro", "Falha ao remover dados.");
              console.error("Erro ao limpar dados:", e);
            }
          }
        }
      ]
    );
  };
  // FIM DA FUNÇÃO DE LIMPEZA

  const handleLogin = async () => {
    setError('');
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const storedData = await AsyncStorage.getItem(USER_PROFILE_KEY); 
      
      if (!storedData) {
        setError("Nenhum perfil encontrado. Crie um perfil primeiro.");
        return;
      }
      
      let userProfile;
      try {
        userProfile = JSON.parse(storedData);
      } catch (jsonError) {
        console.error("ERRO CRÍTICO: Falha ao fazer JSON.parse dos dados salvos.", jsonError);
        setError("O perfil de usuário está corrompido. Por favor, limpe os dados.");
        return;
      }
      
      // Compara os inputs LIMPOS com os dados salvos
      if (userProfile.username === cleanUsername && userProfile.password === cleanPassword) {
        onAuthenticate(userProfile); 
      } else {
        setError("Usuário ou senha inválidos.");
      }

    } catch (e) {
      console.error("Erro geral no handleLogin:", e);
      setError("Ocorreu um erro durante o login. Tente novamente.");
    }
  };

  return (
    <KeyboardAvoidingView 
      // Fundo da KeyboardAvoidingView é a cor de fundo do tema
      style={{ flex: 1, backgroundColor: isDark ? '#0B1220' : '#F7F9FC' }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={localStyles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={[styles.headerTitle, { textAlign: 'center', marginBottom: 50 }]}>Acesso ao Remédios de Notas</Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput 
          style={styles.input} 
          placeholder="Nome de Usuário" 
          placeholderTextColor={isDark ? '#9AA7B2' : '#899'} 
          value={username} 
          onChangeText={setUsername} 
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
          <Text style={[localStyles.createProfileText, { color: isDark ? '#7FDBFF' : '#1E90FF' }]}>Criar Perfil</Text>
        </TouchableOpacity>
        
        {/* BOTÃO DE LIMPEZA PARA DEBUG */}
        <TouchableOpacity 
          style={localStyles.clearDataButton} 
          onPress={handleClearAuthData}
        >
          <Text style={[localStyles.clearDataText, { color: isDark ? '#FF6347' : '#B22222' }]}>Limpar Dados de Perfil (Debug)</Text>
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
  clearDataButton: { 
    marginTop: 30,
    alignItems: 'center',
  },
  clearDataText: { 
    color: '#FF6347',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});