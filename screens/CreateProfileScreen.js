// screens/CreateProfileScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateProfileScreen({ onCancel, onProfileCreated }) {
  const styles = useGlobalStyles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const isDark = styles.container.backgroundColor === '#0B1220';

  const handleCreateProfile = async () => {
    setError('');

    if (!username || !password || !confirmPassword) {
      setError("Todos os campos devem ser preenchidos.");
      return;
    }

    if (password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem!");
      return;
    }

    try {
      // Verifica se o perfil mestre já existe
      const existingProfile = await AsyncStorage.getItem('@user_profile');
      if (existingProfile) {
        Alert.alert("Erro", "Um perfil já existe. Por favor, faça login.");
        onCancel();
        return;
      }

      // Salva o novo perfil: Garantimos que o username não tem espaços em branco
      const newProfile = { 
          username: username.trim(), 
          password,
          photoUri: null, 
      };
      
      await AsyncStorage.setItem('@user_profile', JSON.stringify(newProfile));

      Alert.alert("Sucesso", "Perfil criado! Você será logado automaticamente.");
      onProfileCreated(newProfile); // Loga o usuário
      
    } catch (e) {
      console.error("Erro ao criar perfil:", e);
      Alert.alert("Erro", "Ocorreu um erro ao salvar o perfil.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={localStyles.scrollContainer}>
        <Text style={[styles.headerTitle, { marginBottom: 30 }]}>Criar Novo Perfil</Text>
        
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
          style={styles.input} 
          placeholder="Senha" 
          placeholderTextColor={isDark ? '#9AA7B2' : '#899'}
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />

        <TextInput 
          style={[styles.input, { marginBottom: 20 }]} 
          placeholder="Confirme sua Senha" 
          placeholderTextColor={isDark ? '#9AA7B2' : '#899'}
          secureTextEntry 
          value={confirmPassword} 
          onChangeText={setConfirmPassword} 
        />

        <TouchableOpacity style={styles.addButton} onPress={handleCreateProfile}>
          <Text style={styles.addButtonText}>CRIAR CONTA</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={localStyles.cancelButton} 
          onPress={onCancel}
        >
          <Text style={localStyles.cancelText}>Cancelar e Voltar</Text>
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
  cancelButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelText: {
    color: '#FF6347',
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});