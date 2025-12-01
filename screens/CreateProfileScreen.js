import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, useColorScheme } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateProfileScreen({ onCancel, onProfileCreated }) {
  const scheme = useColorScheme();
  const styles = useGlobalStyles(scheme);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const isDark = scheme === 'dark';

  const handleCreateProfile = async () => {
    setError('');
    if (!username || !password || !confirmPassword) return setError("Todos os campos devem ser preenchidos.");
    if (password.length < 6) return setError("A senha deve ter no mínimo 6 caracteres.");
    if (password !== confirmPassword) return setError("As senhas não coincidem!");

    try {
      if (await AsyncStorage.getItem('@user_profile')) {
        Alert.alert("Erro", "Um perfil já existe. Para criar um novo, apague os dados de usuário na tela de login.");
        onCancel();
        return;
      }
      const newProfile = { username: username.trim(), password, photoUri: null };
      await AsyncStorage.setItem('@user_profile', JSON.stringify(newProfile));
      await AsyncStorage.setItem('@last_logged_in_user', JSON.stringify(newProfile));
      Alert.alert("Sucesso", "Perfil criado! Você será logado automaticamente.");
      onProfileCreated(newProfile);
    } catch (e) {
      Alert.alert("Erro", "Ocorreu um erro ao salvar o perfil.");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: isDark ? '#0B1220' : '#F7F9FC' }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={localStyles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={[styles.headerTitle, { textAlign: 'center', marginBottom: 50 }]}>Criar Novo Perfil</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TextInput style={styles.input} placeholder="Nome de Usuário" placeholderTextColor={isDark ? '#9AA7B2' : '#899'} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={isDark ? '#9AA7B2' : '#899'} secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={[styles.input, { marginBottom: 20 }]} placeholder="Confirme sua Senha" placeholderTextColor={isDark ? '#9AA7B2' : '#899'} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
        <TouchableOpacity style={styles.addButton} onPress={handleCreateProfile}>
          <Text style={styles.addButtonText} numberOfLines={1}>CRIAR CONTA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={localStyles.cancelButton} onPress={onCancel}>
          <Text style={[localStyles.cancelText, { color: isDark ? '#7FDBFF' : '#1E90FF' }]} numberOfLines={1}>Cancelar e Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 15 },
  cancelButton: { marginTop: 20, alignItems: 'center' },
  cancelText: { fontWeight: 'bold', fontSize: 16, textDecorationLine: 'underline' },
});