// screens/CreateProfileScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function CreateProfileScreen({ onCancel, onAccountCreated }) {
  const styles = useGlobalStyles();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // nome exibido no app
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const isDark = styles.container.backgroundColor === '#0B1220';

  const handleCreateAccount = async () => {
    setError("");

    if (!email || !username || !password || !confirmPassword) {
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      Alert.alert("Sucesso", "Conta criada! Logando...");

      // devolve para App.js as infos do usuário
      onAccountCreated({
        email: user.email,
        uid: user.uid,
        username: username.trim(),
      });

    } catch (error) {
      console.log("Erro ao criar conta:", error.message);

      if (error.code === "auth/email-already-in-use") {
        setError("Este email já está sendo usado.");
      } else if (error.code === "auth/invalid-email") {
        setError("Email inválido.");
      } else {
        setError("Não foi possível criar a conta.");
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={localStyles.scrollContainer}>
        <Text style={[styles.headerTitle, { marginBottom: 30 }]}>Criar Conta</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={isDark ? '#9AA7B2' : '#899'}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Nome de Usuário"
          placeholderTextColor={isDark ? '#9AA7B2' : '#899'}
          value={username}
          onChangeText={setUsername}
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

        <TouchableOpacity style={styles.addButton} onPress={handleCreateAccount}>
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
