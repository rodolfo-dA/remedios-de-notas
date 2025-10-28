import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet } from 'react-native';
import MedicationItem from '../components/MedicationItem';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { globalStyles } from '../styles/globalStyles'; // 🌍 Import dos estilos globais

export default function HomeScreen() {
  const [medications, setMedications] = useState([]);
  const [nome, setNome] = useState('');
  const [dose, setDose] = useState('');
  const [frequencia, setFrequencia] = useState('');
  const [horarios, setHorarios] = useState('');
  const [anotacoes, setAnotacoes] = useState('');
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
        proximoHorario: horarios.split(',')[0].trim(),
      };
      setMedications([newMed, ...medications]);
      setNome('');
      setDose('');
      setFrequencia('');
      setHorarios('');
      setAnotacoes('');
    } else {
      alert('Preencha todos os campos obrigatórios.');
    }
  };

  // --- Deleção de itens ---
  const deleteMedication = (id) => {
    setMedToDelete(id);
    setDeleteAll(false);
    setModalVisible(true);
  };

  const clearAllMedications = () => {
    setDeleteAll(true);
    setModalVisible(true);
  };

  const confirmDelete = () => {
    if (deleteAll) setMedications([]);
    else setMedications(prev => prev.filter(med => med.id !== medToDelete));
    setModalVisible(false);
    setMedToDelete(null);
  };

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.headerTitle}>Remédios de Notas</Text>

      {/* --- Formulário --- */}
      <ScrollView style={styles.formContainer}>
        <Text style={globalStyles.sectionTitle}>Adicionar Novo Medicamento</Text>

        <TextInput
          style={globalStyles.input}
          placeholder="Nome do Remédio"
		  placeholderTextColor = "#899"
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={globalStyles.input}
          placeholder="Dose (ex: 500mg)"
		  placeholderTextColor = "#899"
          value={dose}
          onChangeText={setDose}
        />
        <TextInput
          style={globalStyles.input}
          placeholder="Frequência (ex: a cada 8h)"
		  placeholderTextColor = "#899"
          value={frequencia}
          onChangeText={setFrequencia}
        />
        <TextInput
          style={globalStyles.input}
          placeholder="Horários (ex: 08:00, 16:00)"
		  placeholderTextColor = "#899"
          value={horarios}
          onChangeText={setHorarios}
        />
        <TextInput
          style={[globalStyles.input, globalStyles.textArea]}
          placeholder="Anotações (opcional)"
		  placeholderTextColor = "#899"
          value={anotacoes}
          onChangeText={setAnotacoes}
          multiline
        />

        <TouchableOpacity style={globalStyles.addButton} onPress={addMedication}>
          <Text style={globalStyles.addButtonText}>Registrar Medicação</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- Lista de medicamentos --- */}
      <View style={styles.listHeader}>
        <Text style={globalStyles.sectionTitle}>Minhas Medicações</Text>
        {medications.length > 0 && (
          <TouchableOpacity style={globalStyles.clearButton} onPress={clearAllMedications}>
            <Text style={globalStyles.clearButtonText}>Apagar Tudo</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={medications}
        renderItem={({ item }) => <MedicationItem item={item} onDelete={deleteMedication} />}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={globalStyles.emptyListText}>Nenhuma medicação registrada.</Text>}
      />

      {/* --- Modal de Confirmação --- */}
      <DeleteConfirmModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={confirmDelete}
        deleteAll={deleteAll}
      />
    </View>
  );
}

// --- Estilos específicos da tela (mínimos) ---
const styles = StyleSheet.create({
  formContainer: {
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    elevation: 3,
    marginBottom: 15,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
});
