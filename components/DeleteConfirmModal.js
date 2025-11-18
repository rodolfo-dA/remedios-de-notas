// components/DeleteConfirmModal.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';

export default function DeleteConfirmModal({ visible, onCancel, onConfirm, deleteAll }) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const globalStyles = useGlobalStyles(scheme);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        {/* Aplica o tema escuro ao modal box */}
        <View style={[styles.modalBox, { backgroundColor: dark ? '#0F1724' : '#fff' }]}>
          <Text style={[globalStyles.sectionTitle, { color: dark ? '#E6EEF8' : '#333', textAlign: 'center', marginBottom: 18 }]}>
            {deleteAll
              ? "Tem certeza que deseja apagar TODAS as medicações registradas?"
              : "Tem certeza que deseja excluir esta medicação?"}
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#999' }]} 
              onPress={onCancel}
            >
              <Text style={styles.modalButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#B22222' }]} 
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    elevation: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});