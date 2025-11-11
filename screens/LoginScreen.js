// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateProfileScreen from './CreateProfileScreen'; 

// Chaves de armazenamento
const USER_PROFILE_KEY = '@user_profile';
const LAST_LOGGED_IN_KEY = '@last_logged_in_user';

export default function LoginScreen({ onAuthenticate }) {
  const styles = useGlobalStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false); 
  const isDark = styles.container.backgroundColor === '#0B1220'; 

  if (isCreating) {
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
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    try {
      const storedData = await AsyncStorage.getItem(USER_PROFILE_KEY); 
      
      console.log("--- DEBUG DE LOGIN ---");
      console.log(`Input Username (Limpo): ${cleanUsername}`);
      console.log(`Input Password (Limpo): ${cleanPassword}`);
      console.log(`Dados Brutos do AsyncStorage: ${storedData}`); // Verifica o que foi lido

      if (!storedData) {
        Alert.alert("Erro", "Nenhum perfil encontrado. Crie um perfil primeiro.");
        return;
      }
      
      let userProfile;
      try {
        userProfile = JSON.parse(storedData);
        console.log("Perfil Carregado (JSON.parse OK):", userProfile); // Verifica se o parse funcionou
      } catch (jsonError) {
        console.error("ERRO CRÍTICO: Falha ao fazer JSON.parse dos dados salvos.", jsonError);
        Alert.alert("Erro de Dados", "O perfil de usuário está corrompido. Por favor, limpe os dados.");
        return;
      }
      
      // Compara os inputs LIMPOS com os dados salvos
      if (userProfile.username === cleanUsername && userProfile.password === cleanPassword) {
        console.log("LOGIN BEM-SUCEDIDO!");
        onAuthenticate(userProfile); 
      } else {
        console.log("LOGIN FALHOU: Credenciais não coincidem.");
        Alert.alert("Erro", "Usuário ou senha inválidos.");
      }

    } catch (e) {
      console.error("Erro geral no handleLogin:", e);
      Alert.alert("Erro", "Ocorreu um erro durante o login. Tente novamente.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={localStyles.scrollContainer}>
        <Text style={[styles.headerTitle, { marginBottom: 30 }]}>Acesso ao Remédios de Notas</Text>

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
          <Text style={localStyles.createProfileText}>Criar Perfil</Text>
        </TouchableOpacity>
        
        {/* BOTÃO DE LIMPEZA PARA DEBUG */}
        <TouchableOpacity 
          style={localStyles.clearDataButton} 
          onPress={handleClearAuthData}
        >
          <Text style={localStyles.clearDataText}>Limpar Dados de Perfil (Debug)</Text>
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