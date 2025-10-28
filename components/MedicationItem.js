import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MedicationItem({ item, onDelete }) {
  const isTimeNear = item.proximoHorario === '16:00' || item.proximoHorario === '19:00'; 
  const alertColor = isTimeNear ? '#FFD700' : '#E0E0E0'; 

  return (
    <View style={[styles.itemContainer, { borderColor: alertColor, borderWidth: isTimeNear ? 2 : 1 }]}>
      {isTimeNear && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>💊 HORA DO REMÉDIO CHEGANDO! ⏰</Text>
        </View>
      )}

      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.nome} - {item.dose}</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
          <Text style={styles.deleteButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Frequência:</Text>
        <Text style={styles.infoValue}>{item.frequencia}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Horários:</Text>
        <Text style={styles.infoValue}>{item.horarios}</Text>
      </View>

      {item.anotacoes ? (
        <>
          <Text style={styles.notesTitle}>Observações:</Text>
          <Text style={styles.notesText}>{item.anotacoes}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#B22222',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    fontWeight: '600',
    marginRight: 5,
    color: '#555',
  },
  infoValue: {
    color: '#000',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    color: '#1E90FF',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  alertBanner: {
    backgroundColor: '#FFEB3B',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  alertText: {
    color: '#B7410E',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
