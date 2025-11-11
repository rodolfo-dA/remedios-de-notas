// styles/globalStyles.js
import { StyleSheet, Platform } from 'react-native';

export default function useGlobalStyles(scheme) {
  const dark = scheme === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? '#0B1220' : '#F7F9FC',
      paddingTop: Platform.OS === 'android' ? 40 : 60,
      paddingHorizontal: 15,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: dark ? '#7FDBFF' : '#1E90FF',
      textAlign: 'left',
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: dark ? '#E6EEF8' : '#333',
    },
    input: {
      backgroundColor: dark ? '#0F1724' : '#F1F1F1',
      borderRadius: 5,
      padding: 12,
      marginBottom: 10, // Aumentado para melhor espaçamento
      fontSize: 16,
      color: dark ? '#E6EEF8' : '#333',
      borderWidth: 1,
      borderColor: dark ? '#1F2A37' : '#E6E6E6',
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    addButton: {
      backgroundColor: '#1E90FF',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 10,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    clearButton: {
      backgroundColor: '#FF6347',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
    },
    clearButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    emptyListText: {
      textAlign: 'center',
      color: dark ? '#9AA7B2' : '#999',
      marginTop: 20,
      fontStyle: 'italic',
    },
    errorText: {
      color: '#FF6347',
      fontSize: 13,
      marginBottom: 10,
      fontWeight: '600',
      textAlign: 'left',
    },
    smallMuted: {
      fontSize: 12,
      color: dark ? '#98A8B3' : '#666',
    },
  });
}