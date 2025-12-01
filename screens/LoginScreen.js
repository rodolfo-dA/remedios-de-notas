import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, useColorScheme } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateProfileScreen from './CreateProfileScreen';

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

  if (isCreating) return <CreateProfileScreen onCancel={() => setIsCreating(false)} onProfileCreated={onAuthenticate} />;

  const handleLogin = async () => {
    setError('');
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    if (!cleanUsername || !cleanPassword) return setError("Por favor, preencha todos os campos.");

    try {
      const storedData = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (!storedData) return setError("Nenhum perfil encontrado. Crie um perfil primeiro.");
      
      const userProfile = JSON.parse(storedData);
      if (userProfile.username === cleanUsername && userProfile.password === cleanPassword) {
        await AsyncStorage.setItem(LAST_LOGGED_IN_KEY, storedData);
        onAuthenticate(userProfile);
      } else {
        setError("Usuário ou senha inválidos.");
      }
    } catch (e) {
      setError("Ocorreu um erro durante o login.");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: isDark ? '#0B1220' : '#F7F9FC' }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={localStyles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={[styles.headerTitle, { textAlign: 'center', marginBottom: 50 }]}>Acesso ao Remédios de Notas</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TextInput style={styles.input} placeholder="Nome de Usuário" placeholderTextColor={isDark ? '#9AA7B2' : '#899'} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput style={[styles.input, { marginBottom: 20 }]} placeholder="Senha" placeholderTextColor={isDark ? '#9AA7B2' : '#899'} secureTextEntry value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.addButton} onPress={handleLogin}>
          <Text style={styles.addButtonText} numberOfLines={1}>ENTRAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={localStyles.createProfileButton} onPress={() => setIsCreating(true)}>
          <Text style={[localStyles.createProfileText, { color: isDark ? '#7FDBFF' : '#1E90FF' }]} numberOfLines={1}>Criar Perfil</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 15 },
  createProfileButton: { marginTop: 20, alignItems: 'center' },
  createProfileText: { fontWeight: 'bold', fontSize: 16, textDecorationLine: 'underline' },
});