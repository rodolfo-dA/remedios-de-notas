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
  Alert, 
} from 'react-native';

// --- Dados de Exemplo (Vazio) ---
const INITIAL_MEDICATIONS = []; 

// --- Componente de Item da Medicação (COM O BOTÃO FUNCIONAL) ---
const MedicationItem = ({ item, onDelete }) => {
  // Lógica de Alerta (Simulada): 
  const isTimeNear = item.proximoHorario === '16:00' || item.proximoHorario === '19:00'; 
  const alertColor = isTimeNear ? '#FFD700' : '#E0E0E0'; 

  return (
    <View style={[styles.itemContainer, { borderColor: alertColor, borderWidth: isTimeNear ? 2 : 1 }]}>
      
      {/* Alerta Visual */}
      {isTimeNear && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>💊 HORA DO REMÉDIO CHEGANDO! ⏰</Text>
        </View>
      )}

      {/* Informações Principais e Botão de Excluir */}
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.nome} - {item.dose}</Text>
        
        {/* BOTÃO DE EXCLUSÃO QUE CHAMA onDelete COM O ID DO ITEM */}
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

      {/* Anotações - Só exibe se houver conteúdo */}
      {item.anotacoes ? (
        <>
          <Text style={styles.notesTitle}>Observações:</Text>
          <Text style={styles.notesText}>{item.anotacoes}</Text>
        </>
      ) : null}
      
    </View>
  );
};

// --- Componente Principal (App.js) ---
export default function App() {
  const [medications, setMedications] = useState(INITIAL_MEDICATIONS);
  const [nome, setNome] = useState('');
  const [dose, setDose] = useState('');
  const [frequencia, setFrequencia] = useState('');
  const [horarios, setHorarios] = useState('');
  const [anotacoes, setAnotacoes] = useState('');

  const addMedication = () => {
    // Anotações (anotacoes) é opcional.
    if (nome && dose && frequencia && horarios) {
      const newMed = {
        // Gera um ID mais seguro (ex: com um número aleatório somado ao timestamp)
        id: Date.now().toString() + Math.random().toString(), 
        nome,
        dose,
        frequencia,
        horarios,
        anotacoes,
        proximoHorario: horarios.split(',')[0].trim() || '', 
      };
      setMedications([newMed, ...medications]);
      
      // Limpar formulário
      setNome('');
      setDose('');
      setFrequencia('');
      setHorarios('');
      setAnotacoes('');
    } else {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha o Nome, Dose, Frequência e Horários.');
    }
  };

  // --- FUNÇÃO PARA APAGAR UM ITEM ESPECÍFICO (CORRIGIDA COM CALLBACK) ---
  const deleteMedication = (id) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja apagar esta medicação?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Excluir", 
          // USANDO O CALLBACK DE FUNÇÃO: setMedications(prevMeds => ...)
          // Isso garante que você está filtrando o estado mais recente (prevMeds)
          onPress: () => setMedications(prevMeds => prevMeds.filter(med => med.id !== id)), 
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };
  // ----------------------------------------------------------------------

  // --- FUNÇÃO PARA APAGAR TUDO ---
  const clearAllMedications = () => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja apagar TODAS as medicações registradas? Esta ação é irreversível.",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Apagar Tudo", 
          onPress: () => setMedications([]), 
          style: "destructive"
        }
      ],
      { cancelable: false }
    );
  };
  // ------------------------------------

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Remédios de Notas</Text>

      {/* Formulário de Adição */}
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
          placeholder="Anotações (Efeitos colaterais/Observações) - Opcional"
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

      {/* Lista de Medicamentos */}
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Minhas Medicações Atuais</Text>
        {/* Botão de exclusão total (só aparece se houver medicações) */}
        {medications.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAllMedications}>
            <Text style={styles.clearButtonText}>Apagar Tudo (X)</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={medications}
        // Passa a função de exclusão como prop
        renderItem={({ item }) => <MedicationItem item={item} onDelete={deleteMedication} />}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <Text style={styles.emptyListText}>Nenhuma medicação registrada.</Text>
        )}
      />
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
  // --- Formulário ---
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
  // --- Lista ---
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
  list: {
    flex: 1,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
  // --- Item da Medicação ---
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
  // Estilo para o botão de Excluir individual
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
  // --- Alerta ---
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