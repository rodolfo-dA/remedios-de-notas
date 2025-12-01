import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet, LayoutAnimation, Platform, UIManager, ActivityIndicator, Animated, Keyboard, Alert, Switch, useColorScheme, Modal, Image } from 'react-native';
import MedicationItem from '../components/MedicationItem';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import MedicationHistoryModal from '../components/MedicationHistoryModal'; 
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import uuid from 'react-native-uuid';
import { Picker } from '@react-native-picker/picker'; 
import { MaterialIcons } from '@expo/vector-icons'; 
import ProfileScreen from './ProfileScreen'; 

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

const STORAGE_KEY = '@medications_v1';
const THEME_STORAGE_KEY = '@app_theme';
const NOTIFICATION_EARLY_MINUTES = 20; 

function timeToMinutes(t) {
  if (!t) return 24 * 60;
  const [h, m] = t.split(':').map(Number);
  return (Number.isNaN(h) || Number.isNaN(m)) ? 24 * 60 : h * 60 + m;
}

function getTimeBefore(targetTime, minutesBefore) {
  const [h, m] = targetTime.split(':').map(Number);
  let totalMinutes = h * 60 + m - minutesBefore;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  return { hour: Math.floor(totalMinutes / 60) % 24, minute: totalMinutes % 60 };
}

function calculateDoseTimes(startTime, intervalHours) {
  if (!startTime || !intervalHours) return [];
  const [startH, startM] = startTime.split(':').map(Number);
  const intervalMinutes = intervalHours * 60;
  const allTimes = [];
  let currentMinutes = startH * 60 + startM;
  for (let i = 0; i < 24 / intervalHours; i++) {
    const h = Math.floor(currentMinutes / 60) % 24;
    const m = currentMinutes % 60;
    allTimes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    currentMinutes += intervalMinutes;
  }
  return Array.from(new Set(allTimes)).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
}

function findNextDoseTime(doseTimes) {
  if (!doseTimes || !doseTimes.length) return '23:59';
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const nextTime = doseTimes.find(t => timeToMinutes(t) > nowMinutes);
  return nextTime || doseTimes[0];
}

async function scheduleNotificationsForMedication(medId, doseTimes, nomeMed) {
  try {
    const ids = [];
    const now = new Date();
    for (const t of doseTimes) {
      const { hour, minute } = getTimeBefore(t, NOTIFICATION_EARLY_MINUTES);
      let trigger = new Date();
      trigger.setHours(hour, minute, 0, 0);
      if (trigger < now) trigger.setDate(trigger.getDate() + 1);
      const id = await Notifications.scheduleNotificationAsync({ content: { title: `Lembrete (${NOTIFICATION_EARLY_MINUTES} min)`, body: `${nomeMed} — Próxima: ${t}.`, sound: true, data: { medId } }, trigger: { date: trigger, repeats: true } });
      ids.push(id);
    }
    return ids;
  } catch (e) { return []; }
}

async function cancelNotificationIds(ids = []) {
    try { for (const id of ids) if (id) await Notifications.cancelScheduledNotificationAsync(id); } catch (e) {}
}

export default function HomeScreen({ user, onLogout, onUpdateUser }) { 
  const systemScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState('light'); 
  const [currentTimeTick, setCurrentTimeTick] = useState(Date.now()); 
  const [frequenciaInterval, setFrequenciaInterval] = useState(8); 
  const [primeiraDoseTime, setPrimeiraDoseTime] = useState('08:00'); 
  const [medications, setMedications] = useState([]);
  const [nome, setNome] = useState('');
  const [dose, setDose] = useState('');
  const [anotacoes, setAnotacoes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [medToDelete, setMedToDelete] = useState(null);
  const [deleteAll, setDeleteAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false); 
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedMedicationForHistory, setSelectedMedicationForHistory] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { AsyncStorage.getItem(THEME_STORAGE_KEY).then(t => setCurrentTheme(t === 'dark' || t === 'light' ? t : systemScheme || 'light')).catch(() => {}); }, [systemScheme]);
  useEffect(() => { AsyncStorage.setItem(THEME_STORAGE_KEY, currentTheme).catch(() => {}); }, [currentTheme]);

  const finalScheme = currentTheme; 
  const styles = useGlobalStyles(finalScheme);
  const isDark = finalScheme === 'dark';

  const loadAndRecalculateMedications = useCallback(async () => {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
            const normalized = (JSON.parse(raw) || []).map(m => {
                const times = m.horarios ? m.horarios.split(',').map(s => s.trim()) : [];
                return { ...m, id: m.id || uuid.v4(), proximoHorario: findNextDoseTime(times) };
            });
            setMedications(normalized);
        }
    } catch (e) {}
  }, [currentTimeTick]); 

  useEffect(() => {
    loadAndRecalculateMedications(); 
    const interval = setInterval(() => setCurrentTimeTick(Date.now()), 30000); 
    return () => clearInterval(interval);
  }, [loadAndRecalculateMedications]);

  const sortedMedications = medications.slice().sort((a, b) => {
    const nowMinutes = (new Date().getHours() * 60 + new Date().getMinutes());
    const diff = (t) => { const m = timeToMinutes(t || '23:59'); return m >= nowMinutes ? m - nowMinutes : (m + 1440) - nowMinutes; };
    return diff(a.proximoHorario) - diff(b.proximoHorario) || a.nome.localeCompare(b.nome);
  });

  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medications)).catch(() => {}); }, [medications]);

  function validateFields() {
    const e = {};
    if (!nome.trim()) e.nome = 'Nome obrigatório';
    if (!dose.trim()) e.dose = 'Dose obrigatória';
    if (!frequenciaInterval) e.frequenciaInterval = 'Selecione a frequência';
    if (!primeiraDoseTime.trim() || primeiraDoseTime.length !== 5) e.primeiraDoseTime = 'Formato HH:MM';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function showToast(msg = 'Salvo') {
    Keyboard.dismiss();
    Animated.sequence([Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.delay(1000), Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true })]).start();
  }

  const addOrSaveMedication = async () => {
    if (!validateFields()) return;
    setIsSaving(true);
    try {
      const calculatedHorarios = calculateDoseTimes(primeiraDoseTime, frequenciaInterval);
      const horariosString = calculatedHorarios.join(', ');
      const newFrequenciaDesc = `A cada ${frequenciaInterval} hora(s)`;
      const proximoHorario = findNextDoseTime(calculatedHorarios);
      
      if (isEditing && editingId) {
        const original = medications.find(m => m.id === editingId);
        if (original?.notificationIds) await cancelNotificationIds(original.notificationIds);
        const nIds = await scheduleNotificationsForMedication(editingId, calculatedHorarios, nome);
        setMedications(prev => prev.map(m => m.id === editingId ? { ...m, nome: nome.trim(), dose: dose.trim(), frequencia: newFrequenciaDesc, horarios: horariosString, anotacoes: anotacoes.trim(), proximoHorario, notificationIds: nIds } : m));
        setIsEditing(false); setEditingId(null);
      } else {
        const id = uuid.v4();
        const nIds = await scheduleNotificationsForMedication(id, calculatedHorarios, nome);
        setMedications(prev => [{ id, nome: nome.trim(), dose: dose.trim(), frequencia: newFrequenciaDesc, horarios: horariosString, anotacoes: anotacoes.trim(), proximoHorario, notificationIds: nIds }, ...prev]);
      }
      setNome(''); setDose(''); setFrequenciaInterval(8); setPrimeiraDoseTime('08:00'); setAnotacoes(''); setErrors({});
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowForm(false);
      showToast();
    } catch (e) { Alert.alert('Erro', 'Não foi possível salvar.'); } finally { setIsSaving(false); }
  };

  const confirmDelete = async () => {
    setModalVisible(false);
    if (deleteAll) {
      for (const m of medications) if (m.notificationIds) await cancelNotificationIds(m.notificationIds);
      setMedications([]);
    } else if (medToDelete) {
      const target = medications.find(m => m.id === medToDelete);
      if (target?.notificationIds) await cancelNotificationIds(target.notificationIds);
      setMedications(prev => prev.filter(m => m.id !== medToDelete));
    }
    setMedToDelete(null); setDeleteAll(false); showToast('Removido.');
  };

  const handleEdit = (id) => {
    const m = medications.find(x => x.id === id);
    if (!m) return;
    const intervalMatch = m.frequencia.match(/A cada (\d+) hora\(s\)/);
    setNome(m.nome); setDose(m.dose); setFrequenciaInterval(intervalMatch ? Number(intervalMatch[1]) : 8); setPrimeiraDoseTime(m.horarios.split(',')[0]?.trim() || '08:00'); setAnotacoes(m.anotacoes || '');
    setIsEditing(true); setEditingId(id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowForm(true);
  };

  const handleLogDose = async (medId, nextHorario) => {
      const med = medications.find(m => m.id === medId);
      if (!med) return;
      try {
          const key = `@med_history_${medId}`;
          const history = JSON.parse((await AsyncStorage.getItem(key)) || '[]');
          history.push({ id: uuid.v4(), medId, medicationName: med.nome, targetTime: nextHorario, timestamp: new Date().toISOString() });
          await AsyncStorage.setItem(key, JSON.stringify(history));
          setCurrentTimeTick(Date.now()); 
          showToast(`Dose registrada!`);
      } catch (e) { Alert.alert('Erro', 'Falha ao registrar.'); }
  };

  return (
    <View style={styles.container}>
      <View style={localStyles.header}>
        <Text style={styles.headerTitle}>Remédios de Notas</Text>
        <TouchableOpacity onPress={() => setIsProfileModalVisible(true)} style={[localStyles.profileButton, { borderColor: isDark ? styles.input.borderColor : '#ccc' }]}>
          {user.photoUri ? <Image source={{ uri: user.photoUri }} style={localStyles.profileImage} /> : <MaterialIcons name="account-circle" size={30} color={isDark ? styles.sectionTitle.color : '#333'} />}
        </TouchableOpacity>
      </View>
      <View style={{ alignItems: 'flex-end', marginTop: -10, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.smallMuted, { marginRight: 8, color: isDark ? styles.smallMuted.color : '#333' }]}>Tema: {currentTheme === 'dark' ? 'Escuro' : 'Claro'}</Text>
          <Switch value={currentTheme === 'dark'} onValueChange={() => setCurrentTheme(p => p === 'dark' ? 'light' : 'dark')} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={"#f4f3f4"} />
        </View>
      </View>
      <TouchableOpacity style={[{ backgroundColor: showForm ? '#FF6347' : '#1E90FF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 }]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowForm(p => !p); }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{showForm ? 'Cancelar' : '➕ Adicionar Novo'}</Text>
      </TouchableOpacity>
      {showForm && (
        <ScrollView style={localStyles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>{isEditing ? 'Editar Medicação' : 'Adicionar Novo'}</Text>
          <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={finalScheme === 'dark' ? '#9AA7B2' : '#899'} value={nome} onChangeText={setNome} />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}
          <TextInput style={styles.input} placeholder="Dose" placeholderTextColor={finalScheme === 'dark' ? '#9AA7B2' : '#899'} value={dose} onChangeText={setDose} />
          {errors.dose && <Text style={styles.errorText}>{errors.dose}</Text>}
          <Text style={[styles.smallMuted, { marginBottom: 4, color: finalScheme === 'dark' ? '#E6EEF8' : '#333' }]}>Frequência:</Text>
          <View style={[styles.input, { padding: 0, height: 48, backgroundColor: styles.input.backgroundColor, borderColor: styles.input.borderColor }]}>
            <Picker selectedValue={frequenciaInterval} onValueChange={setFrequenciaInterval} style={{ color: '#333' }} itemStyle={{ color: '#333' }}>
              {Array.from({ length: 24 }, (_, i) => i + 1).map(h => <Picker.Item key={h} label={`${h} hora(s)`} value={h} />)}
            </Picker>
          </View>
          <TextInput style={styles.input} placeholder="1ª dose (Ex: 08:00)" placeholderTextColor={finalScheme === 'dark' ? '#9AA7B2' : '#899'} value={primeiraDoseTime} onChangeText={t => setPrimeiraDoseTime(t.replace(/[^0-9:]/g, ''))} maxLength={5} keyboardType="numbers-and-punctuation"/>
          {errors.primeiraDoseTime && <Text style={styles.errorText}>{errors.primeiraDoseTime}</Text>}
          <TextInput style={[styles.input, styles.textArea]} placeholder="Anotações" placeholderTextColor={finalScheme === 'dark' ? '#9AA7B2' : '#899'} value={anotacoes} onChangeText={setAnotacoes} multiline />
          <TouchableOpacity style={localStyles.saveButton} onPress={addOrSaveMedication} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={localStyles.saveButtonText}>{isEditing ? 'Salvar' : 'Registrar'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
      <View style={localStyles.listHeader}>
        <Text style={styles.sectionTitle}>Minhas Medicações</Text>
        <View style={localStyles.listActions}>
            <TouchableOpacity onPress={() => { Alert.alert('Atualizado', 'Recalculado.'); setCurrentTimeTick(Date.now()); }} style={[styles.clearButton, { backgroundColor: '#8A2BE2', marginRight: 10 }]}>
                <MaterialIcons name="refresh" size={18} color="#fff" />
            </TouchableOpacity>
            {medications.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={() => { setDeleteAll(true); setModalVisible(true); }}>
                    <Text style={styles.clearButtonText} numberOfLines={1}>Apagar Tudo</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>
      <FlatList data={sortedMedications} renderItem={({ item }) => ( <MedicationItem item={item} onDelete={(id) => { setMedToDelete(id); setDeleteAll(false); setModalVisible(true); }} onEdit={handleEdit} onLogDose={handleLogDose} onShowHistory={(m) => { setSelectedMedicationForHistory(m); setIsHistoryModalVisible(true); }} currentTimeTick={currentTimeTick} scheme={finalScheme} /> )} keyExtractor={item => item.id} ListEmptyComponent={<Text style={styles.emptyListText}>Nenhuma medicação registrada.</Text>} contentContainerStyle={{ paddingBottom: 80 }} />
      <DeleteConfirmModal visible={modalVisible} onCancel={() => setModalVisible(false)} onConfirm={confirmDelete} deleteAll={deleteAll} />
      <Animated.View pointerEvents="none" style={[localStyles.toast, { transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-60, 20] }) }], opacity: toastAnim }]}><Text style={{ color: '#fff', fontWeight: '700' }}>✔️ Ação realizada</Text></Animated.View>
      <View style={localStyles.versionContainer}><Text style={styles.smallMuted}>Versão: V01.06.00</Text></View>
      <Modal animationType="slide" visible={isProfileModalVisible} onRequestClose={() => setIsProfileModalVisible(false)}>
        <ProfileScreen user={user} onBack={() => setIsProfileModalVisible(false)} onLogout={onLogout} onUpdateUser={onUpdateUser} scheme={finalScheme} />
      </Modal>
      <Modal animationType="slide" transparent={true} visible={isHistoryModalVisible} onRequestClose={() => setIsHistoryModalVisible(false)}>
        <MedicationHistoryModal medication={selectedMedicationForHistory} onClose={() => { setIsHistoryModalVisible(false); setSelectedMedicationForHistory(null); }} scheme={finalScheme} />
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  profileButton: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1 },
  profileImage: { width: 36, height: 36, borderRadius: 18 },
  versionContainer: { position: 'absolute', bottom: 0, left: 15, right: 15, paddingVertical: 5, alignItems: 'center' },
  formContainer: { backgroundColor: 'transparent', borderRadius: 8, padding: 10, marginBottom: 12 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 8 },
  listActions: { flexDirection: 'row', alignItems: 'center' },
  saveButton: { backgroundColor: '#1E90FF', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toast: { position: 'absolute', left: 16, right: 16, padding: 10, backgroundColor: '#28A745', borderRadius: 8, alignItems: 'center', top: 8, zIndex: 999, elevation: 6 },
});