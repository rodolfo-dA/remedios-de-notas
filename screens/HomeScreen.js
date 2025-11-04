// screens/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Animated,
  Keyboard,
  Alert,
  Switch,
  useColorScheme,
} from 'react-native';
import MedicationItem from '../components/MedicationItem';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import uuid from 'react-native-uuid';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STORAGE_KEY = '@medications_v1';

export default function HomeScreen() {
  const systemScheme = useColorScheme();
  const [forceDark, setForceDark] = useState(null);

  // ✅ Determina tema final antes de chamar qualquer hook de estilo
  const finalScheme =
    forceDark === null ? systemScheme : forceDark ? 'dark' : 'light';

  // ✅ Agora o hook sempre é chamado da mesma forma
  const styles = useGlobalStyles(finalScheme);

  const [medications, setMedications] = useState([]);
  const [nome, setNome] = useState('');
  const [dose, setDose] = useState('');
  const [frequencia, setFrequencia] = useState('');
  const [horarios, setHorarios] = useState('');
  const [anotacoes, setAnotacoes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [medToDelete, setMedToDelete] = useState(null);
  const [deleteAll, setDeleteAll] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const toastAnim = useRef(new Animated.Value(0)).current;

  // Carregar do AsyncStorage no mount e normalizar estrutura
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          // normalizar: garantir proximoHorario e notificationIds
          const normalized = (saved || []).map(m => {
            const proximo = m.proximoHorario || (m.horarios ? m.horarios.split(',')[0].trim() : undefined);
            return {
              id: m.id || uuid.v4(),
              nome: m.nome || 'Sem nome',
              dose: m.dose || '',
              frequencia: m.frequencia || '',
              horarios: m.horarios || '',
              anotacoes: m.anotacoes || '',
              proximoHorario: proximo,
              notificationIds: m.notificationIds || [],
            };
          });
          setMedications(normalized);
        }
      } catch (e) {
        console.warn('Erro ao carregar medicamentos:', e);
      }
    })();
  }, []);

  // Salvar no AsyncStorage sempre que medications mudar
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
      } catch (e) {
        console.warn('Erro ao salvar medicamentos:', e);
      }
    })();
  }, [medications]);

  // Ordenar pela hora do próximo horário (usando helper)
  const sortedMedications = medications.slice().sort((a, b) => {
    const aMin = timeToMinutes(a.proximoHorario || firstTime(a.horarios));
    const bMin = timeToMinutes(b.proximoHorario || firstTime(b.horarios));
    return aMin - bMin;
  });

  function firstTime(horariosStr) {
    if (!horariosStr) return '23:59';
    const arr = horariosStr.split(',').map(s => s.trim()).filter(Boolean);
    return arr[0] || '23:59';
  }

  function timeToMinutes(t) {
    if (!t) return 24 * 60;
    const [h, m] = t.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return 24 * 60;
    return h * 60 + m;
  }

  function validateFields() {
    const e = {};
    if (!nome.trim()) e.nome = 'Nome obrigatório';
    if (!dose.trim()) e.dose = 'Dose obrigatória';
    if (!frequencia.trim()) e.frequencia = 'Frequência obrigatória';
    if (!horarios.trim()) e.horarios = 'Ao menos um horário (ex: 08:00, 20:00)';
    else {
      const parts = horarios.split(',').map(s => s.trim());
      const invalid = parts.some(p => !/^\d{1,2}:\d{2}$/.test(p) || Number(p.split(':')[0]) > 23 || Number(p.split(':')[1]) > 59);
      if (invalid) e.horarios = 'Use formato HH:MM separados por vírgula';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function scheduleNotificationsForMedication(medId, horariosStr, nomeMed) {
    try {
      const times = horariosStr.split(',').map(s => s.trim()).filter(Boolean);
      const ids = [];
      for (const t of times) {
        const [h, m] = t.split(':').map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) continue;
        const trigger = { hour: h, minute: m, repeats: true };
        const id = await Notifications.scheduleNotificationAsync({
          content: { title: 'Hora do remédio', body: `${nomeMed} — hora de tomar (${t})`, sound: true, data: { medId } },
          trigger,
        });
        ids.push(id);
      }
      return ids;
    } catch (e) {
      console.warn('Erro ao agendar notificações:', e);
      return [];
    }
  }

  async function cancelNotificationIds(ids = []) {
    try {
      for (const id of ids) {
        if (id) await Notifications.cancelScheduledNotificationAsync(id);
      }
    } catch (e) {
      console.warn('Erro ao cancelar notificações:', e);
    }
  }

  function showToast(msg = 'Salvo') {
    Keyboard.dismiss();
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  const addOrSaveMedication = async () => {
    if (!validateFields()) return;
    setIsSaving(true);

    try {
      if (isEditing && editingId) {
        const original = medications.find(m => m.id === editingId);
        if (original?.notificationIds?.length) {
          await cancelNotificationIds(original.notificationIds);
        }
        const notificationIds = await scheduleNotificationsForMedication(editingId, horarios, nome);
        const updated = medications.map(m => m.id === editingId ? {
          ...m,
          nome: nome.trim(),
          dose: dose.trim(),
          frequencia: frequencia.trim(),
          horarios: horarios.trim(),
          anotacoes: anotacoes.trim(),
          proximoHorario: firstTime(horarios),
          notificationIds,
        } : m);
        setMedications(updated);
        setIsEditing(false);
        setEditingId(null);
        showToast('Editado com sucesso!');
      } else {
        const id = uuid.v4();
        const notificationIds = await scheduleNotificationsForMedication(id, horarios, nome);
        const newMed = {
          id,
          nome: nome.trim(),
          dose: dose.trim(),
          frequencia: frequencia.trim(),
          horarios: horarios.trim(),
          anotacoes: anotacoes.trim(),
          proximoHorario: firstTime(horarios),
          notificationIds,
        };
        setMedications(prev => [newMed, ...prev]);
        showToast('Adicionado com sucesso!');
      }

      setNome('');
      setDose('');
      setFrequencia('');
      setHorarios('');
      setAnotacoes('');
      setErrors({});
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowForm(false);
    } catch (e) {
      console.warn('Erro ao salvar medicação:', e);
      Alert.alert('Erro', 'Não foi possível salvar a medicação. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMedication = (id) => {
    if (!id) return;
    setMedToDelete(id);
    setDeleteAll(false);
    setModalVisible(true);
  };

  const clearAllMedications = () => {
    setDeleteAll(true);
    setModalVisible(true);
  };

  const confirmDelete = async () => {
    setModalVisible(false);
    if (deleteAll) {
      for (const m of medications) {
        if (m.notificationIds?.length) await cancelNotificationIds(m.notificationIds);
      }
      setMedications([]);
      setMedToDelete(null);
      showToast('Todas as medicações foram apagadas.');
      return;
    }

    if (!medToDelete) {
      // nada a deletar
      return;
    }

    const target = medications.find(m => m.id === medToDelete);
    if (target?.notificationIds?.length) {
      await cancelNotificationIds(target.notificationIds);
    }
    setMedications(prev => prev.filter(m => m.id !== medToDelete));
    setMedToDelete(null);
    showToast('Remoção realizada.');
  };

  const handleEdit = (id) => {
    const m = medications.find(x => x.id === id);
    if (!m) return;
    setNome(m.nome);
    setDose(m.dose);
    setFrequencia(m.frequencia);
    setHorarios(m.horarios);
    setAnotacoes(m.anotacoes || '');
    setIsEditing(true);
    setEditingId(id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowForm(true);
  };

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (showForm) {
      setIsEditing(false); setEditingId(null); setErrors({});
      setNome(''); setDose(''); setFrequencia(''); setHorarios(''); setAnotacoes('');
    }
    setShowForm(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={styles.headerTitle}>Remédios de Notas</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.smallMuted}>{forceDark === null ? `Tema: ${systemScheme}` : (forceDark ? 'Tema: dark' : 'Tema: light')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Text style={[styles.smallMuted, { marginRight: 8 }]}>Forçar tema</Text>
			<Switch
				value={forceDark === true}
				onValueChange={(v) => setForceDark(v ? true : null)}
			/>
            <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => setForceDark(null)}>
              <Text style={[styles.smallMuted]}>Seguir sistema</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[{ backgroundColor: showForm ? '#FF6347' : '#1E90FF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 }]}
        onPress={toggleForm}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{showForm ? 'Cancelar' : '➕ Adicionar Novo'}</Text>
      </TouchableOpacity>

      {showForm && (
        <ScrollView style={localStyles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>{isEditing ? 'Editar Medicação' : 'Adicionar Novo Medicamento'}</Text>

          <TextInput style={styles.input} placeholder="Nome do Remédio" placeholderTextColor="#899" value={nome} onChangeText={setNome} />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

          <TextInput style={styles.input} placeholder="Dose (ex: 500mg)" placeholderTextColor="#899" value={dose} onChangeText={setDose} />
          {errors.dose && <Text style={styles.errorText}>{errors.dose}</Text>}

          <TextInput style={styles.input} placeholder="Frequência (ex: a cada 8h)" placeholderTextColor="#899" value={frequencia} onChangeText={setFrequencia} />
          {errors.frequencia && <Text style={styles.errorText}>{errors.frequencia}</Text>}

          <TextInput style={styles.input} placeholder="Horários (ex: 08:00, 16:00)" placeholderTextColor="#899" value={horarios} onChangeText={setHorarios} />
          {errors.horarios && <Text style={styles.errorText}>{errors.horarios}</Text>}

          <TextInput style={[styles.input, styles.textArea]} placeholder="Anotações (opcional)" placeholderTextColor="#899" value={anotacoes} onChangeText={setAnotacoes} multiline />

          <TouchableOpacity style={localStyles.saveButton} onPress={addOrSaveMedication} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={localStyles.saveButtonText}>{isEditing ? 'Salvar alterações' : 'Registrar Medicação'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      <View style={localStyles.listHeader}>
        <Text style={styles.sectionTitle}>Minhas Medicações</Text>
        {medications.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAllMedications}>
            <Text style={styles.clearButtonText}>Apagar Tudo</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={sortedMedications}
        renderItem={({ item }) => (
          <MedicationItem item={item} onDelete={deleteMedication} onEdit={handleEdit} />
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyListText}>Nenhuma medicação registrada.</Text>}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <DeleteConfirmModal visible={modalVisible} onCancel={() => setModalVisible(false)} onConfirm={confirmDelete} deleteAll={deleteAll} />

      <Animated.View pointerEvents="none" style={[localStyles.toast, { transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 20] }) }], opacity: toastAnim }]}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>✔️ Ação realizada</Text>
      </Animated.View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  formContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 10, elevation: 3, marginBottom: 12 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 8 },
  saveButton: { backgroundColor: '#1E90FF', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toast: { position: 'absolute', left: 16, right: 16, padding: 10, backgroundColor: '#28A745', borderRadius: 8, alignItems: 'center', top: 8, zIndex: 999, elevation: 6 },
});
