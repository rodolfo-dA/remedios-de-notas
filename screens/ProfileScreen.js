// screens/ProfileScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, Modal, useColorScheme } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; 
import { MaterialIcons } from '@expo/vector-icons'; 

// --- SUB-COMPONENTE: MODAL DE ALTERAÇÃO DE SENHA ---
// 🚀 MUDANÇA: Recebe o scheme como prop
const ChangePasswordModal = ({ isVisible, onCancel, user, onPasswordUpdated, scheme }) => {
    // 🚀 CORREÇÃO: Usa o scheme passado via prop
    const styles = useGlobalStyles(scheme);
    const isDark = scheme === 'dark';
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');

    const handleChangePassword = async () => {
        setError('');
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setError('Preencha todos os campos.');
            return;
        }
        if (currentPassword !== user.password) {
            setError('A senha atual está incorreta.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError('As novas senhas não coincidem.');
            return;
        }
        if (newPassword === currentPassword) {
            setError('A nova senha não pode ser igual à senha anterior.');
            return;
        }
        if (newPassword.length < 6) {
             setError('A nova senha deve ter no mínimo 6 caracteres.');
             return;
        }

        try {
            // 1. Atualiza o perfil mestre (AsyncStorage)
            const updatedProfile = { ...user, password: newPassword };
            await AsyncStorage.setItem('@user_profile', JSON.stringify(updatedProfile));
            
            // 2. Atualiza o usuário logado (AsyncStorage)
            await AsyncStorage.setItem('@last_logged_in_user', JSON.stringify(updatedProfile));

            onPasswordUpdated(updatedProfile); // Atualiza o estado no App.js
            Alert.alert('Sucesso', 'Senha alterada com sucesso!');
            onCancel();
        } catch (e) {
            console.error("Erro ao alterar senha:", e);
            Alert.alert('Erro', 'Não foi possível alterar a senha.');
        }
    };

    return (
        <Modal transparent animationType="fade" visible={isVisible} onRequestClose={onCancel}>
            <View style={modalStyles.modalOverlay}>
                {/* Aplica o tema escuro ao modal box */}
                <View style={[modalStyles.modalBox, { backgroundColor: isDark ? '#0F1724' : '#fff' }]}>
                    <Text style={[styles.sectionTitle, { color: isDark ? styles.sectionTitle.color : '#333', marginBottom: 15 }]}>Alterar Senha</Text>

                    <TextInput 
                        style={styles.input} 
                        placeholder="Senha Atual" 
                        placeholderTextColor={isDark ? '#9AA7B2' : '#899'}
                        secureTextEntry 
                        value={currentPassword} 
                        onChangeText={setCurrentPassword} 
                    />
                    
                    <TextInput 
                        style={styles.input} 
                        placeholder="Nova Senha" 
                        placeholderTextColor={isDark ? '#9AA7B2' : '#899'}
                        secureTextEntry 
                        value={newPassword} 
                        onChangeText={setNewPassword} 
                    />
                    
                    <TextInput 
                        style={styles.input} 
                        placeholder="Confirme Nova Senha" 
                        placeholderTextColor={isDark ? '#9AA7B2' : '#899'}
                        secureTextEntry 
                        value={confirmNewPassword} 
                        onChangeText={setConfirmNewPassword} 
                    />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={modalStyles.modalButtons}>
                        <TouchableOpacity 
                            style={[modalStyles.modalButton, { backgroundColor: '#999' }]} 
                            onPress={onCancel}
                        >
                            <Text style={modalStyles.modalButtonText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[modalStyles.modalButton, { backgroundColor: '#4CAF50' }]} 
                            on onPress={handleChangePassword}
                        >
                            <Text style={modalStyles.modalButtonText}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
// --------------------------------------------------------

// 🚀 MUDANÇA: Recebe o scheme como prop
export default function ProfileScreen({ user, onBack, onLogout, onUpdateUser, scheme }) { 
    // 🚀 CORREÇÃO: Usa o scheme passado via prop, em vez de useColorScheme()
    const styles = useGlobalStyles(scheme);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const isDark = scheme === 'dark'; // Usa a prop scheme para definir isDark

    const [photoUri, setPhotoUri] = useState(user.photoUri); 

    const pickImage = async () => {
        let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão necessária", "É preciso permissão para acessar a galeria de fotos.");
            return;
        }

        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5, 
        });

        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
            await savePhotoUri(pickerResult.assets[0].uri);
        }
    };
    
    // Salva a URI da foto e atualiza o estado em App.js (Persistência)
    const savePhotoUri = async (uri) => {
        try {
            const updatedProfile = { ...user, photoUri: uri };
            
            await AsyncStorage.setItem('@user_profile', JSON.stringify(updatedProfile));
            await AsyncStorage.setItem('@last_logged_in_user', JSON.stringify(updatedProfile));
            
            onUpdateUser(updatedProfile); 
            setPhotoUri(uri);
            Alert.alert('Sucesso', 'Foto atualizada!');

        } catch (e) {
            console.error("Erro ao salvar foto:", e);
            Alert.alert('Erro', 'Não foi possível salvar a foto.');
        }
    };
    
    const handlePasswordUpdate = (updatedUser) => {
        onUpdateUser(updatedUser); 
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={localStyles.scrollContainer}>
                
                {/* Botão de Voltar/Fechar */}
                <TouchableOpacity onPress={onBack} style={localStyles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={isDark ? styles.sectionTitle.color : '#333'} />
                    <Text style={[styles.sectionTitle, { marginLeft: 5, color: isDark ? styles.sectionTitle.color : '#333' }]}>Voltar</Text>
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { marginBottom: 30, marginTop: 10 }]}>Meu Perfil</Text>
                
                {/* Visualização e Botões da Foto */}
                <View style={[localStyles.photoContainer, { borderColor: isDark ? styles.input.borderColor : '#E0E0E0', backgroundColor: isDark ? '#0F1724' : '#fff' }]}>
                    <Image
                        // Mascote como placeholder default. O estilo localStyles.profileImage não tem mais background cinza.
                        source={photoUri ? { uri: photoUri } : require('../assets/mascote.png')} 
                        style={localStyles.profileImage}
                    />
                    <Text style={[styles.sectionTitle, { marginTop: 15, color: isDark ? '#7FDBFF' : '#1E90FF' }]}>@{user.username}</Text>
                    
                    <View style={{ marginTop: 20 }}>
                        <TouchableOpacity style={localStyles.photoButton} onPress={pickImage}>
                            <Text style={localStyles.photoButtonText}>
                                {photoUri ? '🔄 Atualizar Foto de Perfil' : '➕ Adicionar Foto de Perfil'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Opção de Alterar Senha */}
                <View style={[localStyles.infoBox, { borderColor: isDark ? styles.input.borderColor : '#E0E0E0', backgroundColor: isDark ? '#0F1724' : '#fff' }]}>
                    <Text style={[styles.sectionTitle, { marginBottom: 10, color: isDark ? '#7FDBFF' : '#1E90FF' }]}>Configurações de Conta</Text>
                    <TouchableOpacity style={[localStyles.settingButton, { backgroundColor: isDark ? '#1F2A37' : '#F7F7F7', borderColor: isDark ? '#1F2A37' : '#eee' }]} onPress={() => setIsPasswordModalVisible(true)}>
                        <Text style={[localStyles.settingButtonText, { color: isDark ? styles.sectionTitle.color : '#333' }]}>Alterar Senha</Text>
                        <MaterialIcons name="keyboard-arrow-right" size={24} color={isDark ? '#9AA7B2' : '#666'} />
                    </TouchableOpacity>
                </View>

                {/* Opção de Trocar/Sair */}
                <View style={localStyles.infoBox}>
                    <TouchableOpacity style={[localStyles.settingButton, { justifyContent: 'center', backgroundColor: '#FF6347' }]} onPress={onLogout}>
                        <Text style={[localStyles.settingButtonText, { color: '#fff' }]}>Trocar de Usuário / Sair</Text>
                    </TouchableOpacity>
                    <Text style={[styles.smallMuted, { textAlign: 'center', marginTop: 10 }]}>
                        Isso manterá seu perfil salvo, mas você precisará fazer login novamente.
                    </Text>
                </View>
                
            </ScrollView>

            <ChangePasswordModal 
                isVisible={isPasswordModalVisible} 
                onCancel={() => setIsPasswordModalVisible(false)}
                user={user}
                onPasswordUpdated={handlePasswordUpdate}
                scheme={scheme} // <--- Passa o tema para o subcomponente
            />
        </View>
    );
}

const localStyles = StyleSheet.create({
    scrollContainer: {
        paddingBottom: 40,
        paddingHorizontal: 15,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    photoContainer: {
        alignItems: 'center',
        marginBottom: 30,
        padding: 20,
        borderRadius: 10,
        borderWidth: 1,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#1E90FF',
    },
    photoButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    photoButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    infoBox: {
        marginTop: 20,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
    },
    settingButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    settingButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

const modalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: '85%',
        borderRadius: 12,
        padding: 18,
        elevation: 6,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});