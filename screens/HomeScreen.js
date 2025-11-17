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
  Modal,
} from 'react-native';
import MedicationItem from '../components/MedicationItem';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import useGlobalStyles from '../styles/globalStyles';
import * as Notifications from 'expo-notifications';
import uuid from 'react-native-uuid';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import ProfileScreen from './ProfileScreen';

// Firestore imports
import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const NOTIFICATION_EARLY_MINUTES = 20; // Lembrete 20 minutos antes da dose

// --- FUNÇÕES DE LÓGICA DE HORÁRIOS (mantive suas funções) ---
function timeToMinutes(t) {
  if (!t) return 24 * 60;
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 24 * 60;
  return h * 60 + m;
}

function getTimeBefore(targetTime, minutesBefore) {
  const [h, m] = targetTime.split(':').map(Number);
  let totalMinutes = h * 60 + m;
  totalMinutes -= minutesBefore;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return {
    hour: newH,
    minute: newM,
    formatted: `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`,
  };
}

function calculateDoseTimes(startTime, intervalHours) {
  if (!startTime || !intervalHours || intervalHours < 1 || intervalHours > 24) return [];
  const [startH, startM] = startTime.split(':').map(Number);
  const intervalMinutes = intervalHours * 60;
  const allTimes = [];
  let currentMinutes = startH * 60 + startM;
  for (let i = 0; i < 24 / intervalHours; i++) {
    const h = Math.floor(currentMinutes / 60) % 24;
    const m = currentMinutes % 60;
    const formattedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    allTimes.push(formattedTime);
    currentMinutes += intervalMinutes;
  }
  const uniqueTimes = Array.from(new Set(allTimes)).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  return uniqueTimes;
}

function findNextDoseTime(doseTimes) {
  if (!doseTimes || doseTimes.length === 0) return '23:59';
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let nextTime = doseTimes.find(t => timeToMinutes(t) > nowMinutes);
  if (!nextTime) nextTime = doseTimes[0];
  return nextTime;
}

async function scheduleNotificationsForMedication(medId, doseTimes, nomeMed) {
  try {
    const ids = [];
    for (const t of doseTimes) {
      const notificationTime = getTimeBefore(t, NOTIFICATION_EARLY_MINUTES);
      const trigger = {
        hour: notificationTime.hour,
        minute: notificationTime.minute,
        repeats: true,
      };
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Lembrete de Remédio (${NOTIFICATION_EARLY_MINUTES} min)`,
          body: `${nomeMed} — A próxima dose é às ${t}.`,
          sound: true,
          data: { medId },
        },
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
// --- FIM FUNÇÕES DE HORÁRIOS ---


// --- COMPONENTE PRINCIPAL ---
export default function HomeScreen({ user, onLogout, onUpdateUser }) {
  const systemScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState('light');

  // Form states
  const [frequenciaInterval, setFrequenciaInterval] = useState(8);
  const [primeiraDoseTime, setPrimeiraDoseTime] = useState('08:00');

  // Medication & UI states
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

  // Profile state (synced)
  const [profile, setProfile] = useState({ username: '', email: user?.email || '', photoUri: null, theme: null });

  const toastAnim = useRef(new Animated.Value(0)).current;
  const finalScheme = currentTheme;
  const styles = useGlobalStyles(finalScheme);

  // Frequency options
  const frequencyOptions = Array.from({ length: 24 }, (_, i) => i + 1);

  // -------------------------
  // Firestore: subscriptions
  // -------------------------
  useEffect(() => {
    if (!user?.uid) return;
    const medsColRef = collection(db, 'users', user.uid, 'medications');

    // Real-time meds listener
    const unsubMeds = onSnapshot(medsColRef, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          nome: data.nome || 'Sem nome',
          dose: data.dose || '',
          frequencia: data.frequencia || '',
          horarios: data.horarios || '',
          anotacoes: data.anotacoes || '',
          proximoHorario: data.proximoHorario || findNextDoseTime((data.horarios || '').split(',').map(s => s.trim())),
          notificationIds: data.notificationIds || [],
          primeiraDose: data.primeiraDose || '',
        });
      });
      // sort by next time
      const sorted = items.slice().sort((a, b) => timeToMinutes(a.proximoHorario || '23:59') - timeToMinutes(b.proximoHorario || '23:59'));
      setMedications(sorted);
    }, (err) => {
      console.warn('Erro no snapshot de medicações:', err);
    });

    // Profile listener (theme, username, photo)
    const profileDocRef = doc(db, 'users', user.uid, 'profile', 'meta');
    const unsubProfile = onSnapshot(profileDocRef, (snap) => {
      if (snap.exists()) {
        const p = snap.data();
        setProfile(prev => ({ ...prev, ...p }));
        if (p.theme) setCurrentTheme(p.theme);
      } else {
        // Se não existir, cria doc base com email e tema padrão
        setProfile(prev => ({ ...prev, email: user.email }));
      }
    }, (err) => {
      console.warn('Erro no snapshot de profile:', err);
    });

    return () => {
      unsubMeds();
      unsubProfile();
    };
  }, [user?.uid]);

  // -------------------------
  // Notifications: request permission on mount
  // -------------------------
  useEffect(() => {
    (async () => {
      try {
        await Notifications.requestPermissionsAsync();
      } catch (e) {
        console.warn('Erro ao pedir permissão de notificação:', e);
      }
    })();
  }, []);

  // -------------------------
  // Validation
  // -------------------------
  function validateFields() {
    const e = {};
    if (!nome.trim()) e.nome = 'Nome obrigatório';
    if (!dose.trim()) e.dose = 'Dose obrigatória';

    if (!frequenciaInterval || frequenciaInterval < 1 || frequenciaInterval > 24) {
      e.frequenciaInterval = 'Selecione a frequência entre 1 e 24 horas';
    }

    if (!primeiraDoseTime.trim()) {
      e.primeiraDoseTime = 'Horário da primeira dose obrigatório';
    } else {
      const parts = primeiraDoseTime.split(':').map(Number);
      if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1]) || parts[0] > 23 || parts[1] > 59) {
        e.primeiraDoseTime = 'Use formato HH:MM válido (ex: 08:00)';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // -------------------------
  // UI Helpers
  // -------------------------
  function showToast(msg = 'Salvo') {
    Keyboard.dismiss();
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (showForm) {
      setIsEditing(false); setEditingId(null); setErrors({});
      setNome(''); setDose(''); setFrequenciaInterval(8); setPrimeiraDoseTime('08:00'); setAnotacoes('');
    }
    setShowForm(prev => !prev);
  };

  const toggleTheme = async () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(newTheme);
    // salvar no Firestore no profile
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'profile', 'meta'), { ...profile, theme: newTheme, email: user.email }, { merge: true });
    } catch (e) {
      console.warn('Erro ao salvar tema no Firestore:', e);
    }
  };

  // -------------------------
  // CRUD Medications (Firestore)
  // -------------------------
  const addOrSaveMedication = async () => {
    if (!validateFields()) return;
    if (!user?.uid) { Alert.alert('Erro', 'Usuário não identificado.'); return; }
    setIsSaving(true);

    try {
      const calculatedHorarios = calculateDoseTimes(primeiraDoseTime, frequenciaInterval);
      const horariosString = calculatedHorarios.join(', ');
      const newFrequenciaDesc = `A cada ${frequenciaInterval} hora(s)`;
      const proximoHorario = findNextDoseTime(calculatedHorarios);

      if (isEditing && editingId) {
        // buscar doc original (se tiver notificationIds, cancelar antes)
        const target = medications.find(m => m.id === editingId);
        if (target?.notificationIds?.length) await cancelNotificationIds(target.notificationIds);

        const notificationIds = await scheduleNotificationsForMedication(editingId, calculatedHorarios, nome);

        const docRef = doc(db, 'users', user.uid, 'medications', editingId);
        await updateDoc(docRef, {
          nome: nome.trim(),
          dose: dose.trim(),
          frequencia: newFrequenciaDesc,
          horarios: horariosString,
          anotacoes: anotacoes.trim(),
          proximoHorario,
          notificationIds,
          primeiraDose: primeiraDoseTime,
        });

        setIsEditing(false);
        setEditingId(null);
        showToast('Editado com sucesso!');
      } else {
        const id = uuid.v4();
        const notificationIds = await scheduleNotificationsForMedication(id, calculatedHorarios, nome);

        const docRef = doc(db, 'users', user.uid, 'medications', id);
        await setDoc(docRef, {
          nome: nome.trim(),
          dose: dose.trim(),
          frequencia: newFrequenciaDesc,
          horarios: horariosString,
          anotacoes: anotacoes.trim(),
          proximoHorario,
          notificationIds,
          primeiraDose: primeiraDoseTime,
          createdAt: new Date().toISOString(),
        });

        showToast('Adicionado com sucesso!');
      }

      // reset
      setNome(''); setDose(''); setFrequenciaInterval(8); setPrimeiraDoseTime('08:00'); setAnotacoes('');
      setErrors({});
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowForm(false);
    } catch (e) {
      console.warn('Erro ao salvar medicação no Firestore:', e);
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
    if (!user?.uid) return;

    if (deleteAll) {
      // cancelar notificações e deletar todos os docs (batch)
      try {
        const medsSnapshot = await getDocs(collection(db, 'users', user.uid, 'medications'));
        const batch = writeBatch(db);
        for (const docSnap of medsSnapshot.docs) {
          const data = docSnap.data();
          if (data?.notificationIds?.length) await cancelNotificationIds(data.notificationIds);
          batch.delete(doc(db, 'users', user.uid, 'medications', docSnap.id));
        }
        await batch.commit();
        showToast('Todas as medicações foram apagadas.');
      } catch (e) {
        console.warn('Erro ao apagar tudo:', e);
        Alert.alert('Erro', 'Falha ao apagar todas as medicações.');
      }
      return;
    }

    if (!medToDelete) return;

    try {
      const target = medications.find(m => m.id === medToDelete);
      if (target?.notificationIds?.length) await cancelNotificationIds(target.notificationIds);
      await deleteDoc(doc(db, 'users', user.uid, 'medications', medToDelete));
      setMedToDelete(null);
      showToast('Remoção realizada.');
    } catch (e) {
      console.warn('Erro ao deletar medicação:', e);
      Alert.alert('Erro', 'Não foi possível apagar a medicação.');
    }
  };

  const handleEdit = (id) => {
    const m = medications.find(x => x.id === id);
    if (!m) return;
    const intervalMatch = m.frequencia.match(/A cada (\d+) hora\(s\)/);
    const firstTimeMatch = m.horarios.split(',')[0]?.trim() || '08:00';

    setNome(m.nome);
    setDose(m.dose);
    setFrequenciaInterval(intervalMatch ? Number(intervalMatch[1]) : 8);
    setPrimeiraDoseTime(firstTimeMatch);
    setAnotacoes(m.anotacoes || '');
    setIsEditing(true);
    setEditingId(id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowForm(true);
  };

  // sorted for display (already sorted on snapshot, but keep safeguard)
  const sortedMedications = medications.slice().sort((a, b) => {
    const aMin = timeToMinutes(a.proximoHorario || '23:59');
    const bMin = timeToMinutes(b.proximoHorario || '23:59');
    return aMin - bMin;
  });

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setIsProfileModalVisible(true)} style={{ marginRight: 10 }}>
            <MaterialIcons name="account-circle" size={32} color={styles.headerTitle.color} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Remédios de Notas</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Text style={[styles.smallMuted, { marginRight: 8 }]}>Tema: {currentTheme === 'dark' ? 'Escuro' : 'Claro'}</Text>
            <Switch value={currentTheme === 'dark'} onValueChange={toggleTheme} />
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

          <TextInput style={styles.input} placeholder="Nome do Remédio" placeholderTextColor={finalScheme === 'dark' ? '#9AA7B2' : '#899'} value={nome} onChangeText={setNome} />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

          <TextInput style={styles.input} placeholder="Dose (ex: 500mg)" placeholderTextColor={finalScheme === 'dark' ? '#9AA7B2' : '#899'} value={dose} onChangeText={setDose} />
          {errors.dose && <Text style={styles.errorText}>{errors.dose}</Text>}

          <Text style={[styles.smallMuted, { marginBottom: 4, marginTop: 4, color: finalScheme === 'dark' ? '#E6EEF8' : '#333', fontSize: 14 }]}>Frequência (a cada quantas horas?)</Text>
          <View style={[styles.input, { padding: 0, height: 48 }]}>
            <Picker
              selectedValue={frequenciaInterval}
              onValueChange={(itemValue) => setFrequenciaInterval(itemValue)}
              style={{ color: finalScheme === 'dark' ? '#E6EEF8' : '#333' }}
              itemStyle={{ color: finalScheme === 'dark' ? '#E6EEF8' : '#333' }}
            >
              {frequencyOptions.map(hour => (
                <Picker.Item key={hour} label={`${hour} hora(s)`} value={hour} />
              ))}
            </Picker>
          </View>
          {errors.frequenciaInterval && <Text style={styles.errorText}>{errors.frequenciaInterval}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Horário da 1ª dose (Ex: 08:00)"
            placeholderTextColor={finalScheme === 'dark' ? '#9AA7B2' : '#899'}
            value={primeiraDoseTime}
            onChangeText={(text) => {
              const formattedText = text.replace(/[^0-9:]/g, '');
              setPrimeiraDoseTime(formattedText);
            }}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          {errors.primeiraDoseTime && <Text style={styles.errorText}>{errors.primeiraDoseTime}</Text>}
          <Text style={[styles.smallMuted, { marginBottom: 8, marginTop: -4 }]}>Horários futuros serão calculados automaticamente.</Text>

          <TextInput style={[styles.input, styles.textArea]} placeholder="Anotações (opcional)" placeholderTextColor={finalScheme === 'dark' ? '#9AA7B2' : '#899'} value={anotacoes} onChangeText={setAnotacoes} multiline />

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

      {/* MODAL LATERAL DE PERFIL */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isProfileModalVisible}
        onRequestClose={() => setIsProfileModalVisible(false)}
      >
        <ProfileScreen
          user={user}
          profile={profile}
          onBack={() => setIsProfileModalVisible(false)}
          onLogout={onLogout}
          onUpdateUser={onUpdateUser}
        />
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  formContainer: { backgroundColor: 'transparent', borderRadius: 8, padding: 10, marginBottom: 12 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 8 },
  saveButton: { backgroundColor: '#1E90FF', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toast: { position: 'absolute', left: 16, right: 16, padding: 10, backgroundColor: '#28A745', borderRadius: 8, alignItems: 'center', top: 8, zIndex: 999, elevation: 6 },
});
