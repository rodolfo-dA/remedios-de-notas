// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, useColorScheme } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateProfileScreen from './CreateProfileScreen'; 

// 🚀 Variável de controle para botões de debug.
const __DEBUG_MODE__ = true; // Mude para 'false' para ocultar os botões de debug

// Chaves de armazenamento
const USER_PROFILE_KEY = '@user_profile';
const LAST_LOGGED_IN_KEY = '@last_logged_in_user';
const MEDICATION_STORAGE_KEY = '@medications_v1'; 
const THEME_STORAGE_KEY = '@app_theme'; 

export default function LoginScreen({ onAuthenticate }) {
  const scheme = useColorScheme();
  const styles = useGlobalStyles(scheme);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false); 
  const [error, setError] = useState('');
  const isDark = scheme === 'dark'; 

  if (isCreating) {
    return <CreateProfileScreen onCancel={() => setIsCreating(false)} onProfileCreated={onAuthenticate} />;
  }

  // FUNÇÃO PARA IMPRIMIR OS DADOS NO CONSOLE E EM UM ALERTA
  const handlePrintAuthData = async () => {
    try {
        const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
        const lastLoggedIn = await AsyncStorage.getItem(LAST_LOGGED_IN_KEY);
        
        console.log("--- DEBUG: DADOS DE PERFIL ---");
        console.log(`Perfil Mestre (${USER_PROFILE_KEY}):`, storedProfile);
        console.log(`Último Logado (${LAST_LOGGED_IN_KEY}):`, lastLoggedIn);
        console.log("-------------------------------");

        if (storedProfile) {
            let profileData;
            try {
                profileData = JSON.parse(storedProfile);
                
                const logMessage = 
                    `Perfil Mestre Encontrado:\n` +
                    `Usuário: ${profileData.username || 'N/A'}\n` +
                    `Senha: ${profileData.password || 'N/A'}\n` +
                    `Photo URI: ${profileData.photoUri ? 'Registrada' : 'Nenhuma'}`;
                    
                Alert.alert("Dados de Perfil (Debug)", logMessage);
            } catch (e) {
                Alert.alert("Erro", "Perfil de usuário corrompido ou JSON inválido.");
            }
        } else {
            Alert.alert("Dados de Perfil (Debug)", "Nenhum perfil mestre encontrado no AsyncStorage.");
        }
    } catch (e) {
        Alert.alert("Erro", "Falha ao ler dados de perfil.");
        console.error("Erro ao imprimir dados:", e);
    }
  };
  // FIM DA FUNÇÃO DE IMPRESSÃO

  // FUNÇÃO PARA LIMPAR O ASYNCSTORAGE
  const handleClearAuthData = async () => {
    console.log("DEBUG: Botão 'Limpar Dados' foi CLICADO."); 

    // 🚀 LINHA DE RACIOCÍNIO: Substituir o Alert de confirmação por um Alert simples
    // ou por uma função de confirmação direta, pois o Alert de confirmação está bloqueando a execução assíncrona.
    const keysToRemove = [USER_PROFILE_KEY, LAST_LOGGED_IN_KEY, MEDICATION_STORAGE_KEY, THEME_STORAGE_KEY];

    try {
        // Tentar a limpeza imediata. Se falhar no seu ambiente, é provável que nenhum método funcione.
        const errors = await AsyncStorage.multiRemove(keysToRemove);
        
        if (errors && errors.length > 0) {
            Alert.alert("Atenção", "Algumas operações de limpeza falharam. Verifique o console.");
            errors.forEach(e => console.error("Erro em multiRemove:", e));
            return;
        }

        // Limpar o estado local
        setUsername('');
        setPassword('');
        setError(''); 
        
        // NOVO: Verificar se a remoção funcionou e dar feedback
        const checkData = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (!checkData) {
            Alert.alert("Sucesso", "Dados de usuário e medicações removidos. Crie o perfil novamente.");
        } else {
            // Este alerta será exibido se a limpeza falhar (como no seu caso anterior)
            Alert.alert("Falha de Limpeza", "Os dados persistem! Pode ser um problema de caching. Tente reiniciar o aplicativo ou limpar o cache do Expo Go/simulador manualmente.");
        }

    } catch (e) {
        Alert.alert("Erro Crítico", "Falha catastrófica ao tentar limpar os dados.");
        console.error("Erro crítico ao limpar dados:", e);
    }
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
        await AsyncStorage.setItem(LAST_LOGGED_IN_KEY, storedData);
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
        
        {__DEBUG_MODE__ && (
          <View>
            {/* BOTÃO DE DEBUG: IMPRIMIR DADOS */}
            <TouchableOpacity 
              style={localStyles.printDataButton} 
              onPress={handlePrintAuthData}
            >
              <Text style={[localStyles.clearDataText, { color: isDark ? '#FFD700' : '#8B4B00' }]}>Imprimir Dados de Perfil (Debug)</Text>
            </TouchableOpacity>

            {/* BOTÃO DE LIMPEZA PARA DEBUG */}
            <TouchableOpacity 
              style={localStyles.clearDataButton} 
              onPress={handleClearAuthData}
            >
              <Text style={[localStyles.clearDataText, { color: isDark ? '#FF6347' : '#B22222' }]}>Limpar Dados de Perfil e Medicações (Debug)</Text>
            </TouchableOpacity>
          </View>
        )}
        
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
  printDataButton: { 
    marginTop: 30,
    alignItems: 'center',
  },
  clearDataButton: { 
    marginTop: 10,
    alignItems: 'center',
  },
  clearDataText: { 
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});