import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';

// --- Dados de Exemplo (Vazio) ---
const INITIAL_MEDICATIONS = []; 

// --- Componente de Item da Medicação ---
const MedicationItem = ({ item, onDelete }) => {
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
};

export default function App() {
  const [medications, setMedications] = useState(INITIAL_MEDICATIONS);
  const [nome, setNome] = useState('');
  const [dose, setDose] = useState('');
  const [frequencia, setFrequencia] = useState('');
  const [horarios, setHorarios] = useState('');
  const [anotacoes, setAnotacoes] = useState('');

  // --- Estados para o modal de exclusão ---
  const [modalVisible, setModalVisible] = useState(false);
  const [medToDelete, setMedToDelete] = useState(null);
  const [deleteAll, setDeleteAll] = useState(false);

  // --- Adicionar nova medicação ---
  const addMedication = () => {
    if (nome && dose && frequencia && horarios) {
      const newMed = {
        id: Date.now().toString() + Math.random().toString(), 
        nome,
        dose,
        frequencia,
        horarios,
        anotacoes,
        proximoHorario: horarios.split(',')[0].trim() || '', 
      };
      setMedications([newMed, ...medications]);
      setNome('');
      setDose('');
      setFrequencia('');
      setHorarios('');
      setAnotacoes('');
    } else {
      alert('Por favor, preencha o Nome, Dose, Frequência e Horários.');
    }
  };

  // --- Abrir modal de exclusão de um item ---
  const deleteMedication = (id) => {
    setMedToDelete(id);
    setDeleteAll(false);
    setModalVisible(true);
  };

  // --- Abrir modal de exclusão total ---
  const clearAllMedications = () => {
    setDeleteAll(true);
    setModalVisible(true);
  };

  // --- Confirmar exclusão ---
  const confirmDelete = () => {
    if (deleteAll) {
      setMedications([]);
    } else if (medToDelete) {
      setMedications(prev => prev.filter(med => med.id !== medToDelete));
    }
    setModalVisible(false);
    setMedToDelete(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Remédios de Notas</Text>

      <ScrollView style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Adicionar Novo Medicamento</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome do Remédio"
          placeholderTextColor="#999"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={styles.input}
          placeholder="Dose (ex: 500mg)"
          placeholderTextColor="#999"
          value={dose}
          onChangeText={setDose}
        />
        <TextInput
          style={styles.input}
          placeholder="Frequência (ex: A cada 8 horas)"
          placeholderTextColor="#999"
          value={frequencia}
          onChangeText={setFrequencia}
        />
        <TextInput
          style={styles.input}
          placeholder="Horários Específicos (ex: 08:00, 16:00, 00:00)"
          placeholderTextColor="#999"
          value={horarios}
          onChangeText={setHorarios}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Anotações (opcional)"
          placeholderTextColor="#999"
          value={anotacoes}
          onChangeText={setAnotacoes}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.addButton} onPress={addMedication}>
          <Text style={styles.addButtonText}>Registrar Medicação</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Minhas Medicações Atuais</Text>
        {medications.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAllMedications}>
            <Text style={styles.clearButtonText}>Apagar Tudo (X)</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={medications}
        renderItem={({ item }) => <MedicationItem item={item} onDelete={deleteMedication} />}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <Text style={styles.emptyListText}>Nenhuma medicação registrada.</Text>
        )}
      />

      {/* --- MODAL DE CONFIRMAÇÃO --- */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              {deleteAll
                ? "Tem certeza que deseja apagar TODAS as medicações registradas?"
                : "Tem certeza que deseja excluir esta medicação?"}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#ccc' }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#B22222' }]} 
                onPress={confirmDelete}
              >
                <Text style={styles.modalButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingTop: Platform.OS === 'android' ? 40 : 60, 
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E90FF', 
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  formContainer: {
    maxHeight: 300, 
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#F1F1F1',
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
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
    marginTop: 10,
    marginBottom: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listHeader: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
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
  list: { flex: 1 },
  emptyListText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
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
  // --- Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
