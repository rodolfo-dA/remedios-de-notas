import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const NEAR_TIME_MINUTES = 2 * 60;
const WINDOW_BEFORE_MINUTES = 5;
const WINDOW_AFTER_MINUTES = 5;
const TAKEN_DISPLAY_MINUTES = 10;

function formatMinutes(minutes) {
    if (minutes <= 0) return 'Agora!';
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${Math.ceil(minutes)}m`;
}

function useDoseStatus(item, currentTimeTick) {
  const [lastDoseRegistered, setLastDoseRegistered] = useState(null);

  const toMinutes = useCallback((t) => {
    if (!t || typeof t !== 'string') return 24 * 60;
    const [hh, mm] = t.split(':').map(Number);
    return (Number.isNaN(hh) || Number.isNaN(mm)) ? 24 * 60 : hh * 60 + mm;
  }, []);

  const calculateNextFromHorarios = useCallback(() => {
    if (!item.horarios) return null;
    const parts = item.horarios.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.length) return null;
    const now = new Date(currentTimeTick);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const minutesArr = parts.map(p => ({ raw: p, min: toMinutes(p) })).filter(x => x.min < 24 * 60).sort((a, b) => a.min - b.min);
    const upcoming = minutesArr.find(x => x.min > nowMinutes);
    return upcoming ? upcoming.raw : (minutesArr.length ? minutesArr[0].raw : null);
  }, [item.horarios, currentTimeTick, toMinutes]);

  const checkLastRegisteredDose = useCallback(async () => {
      try {
          const raw = await AsyncStorage.getItem(`@med_history_${item.id}`);
          const history = JSON.parse(raw || '[]');
          setLastDoseRegistered(history.length > 0 ? history[history.length - 1] : null);
      } catch (e) { setLastDoseRegistered(null); }
  }, [item.id]);

  useEffect(() => { if (calculateNextFromHorarios()) checkLastRegisteredDose(); }, [item.id, currentTimeTick, calculateNextFromHorarios, checkLastRegisteredDose]);

  const nextHorarioStr = calculateNextFromHorarios();
  const nextHorarioMinutes = toMinutes(nextHorarioStr);
  const now = new Date(currentTimeTick);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (!nextHorarioStr) return { nextHorario: '—', status: 'NORMAL', alertColor: '#808080', alertText: 'Nenhum horário', canLogDose: false, timeRemainingMinutes: null };

  let minutesUntilNextDose = nextHorarioMinutes - nowMinutes;
  if (minutesUntilNextDose < 0) minutesUntilNextDose += 24 * 60;

  if (lastDoseRegistered) {
      const diffMinutes = (now.getTime() - new Date(lastDoseRegistered.timestamp).getTime()) / (1000 * 60);
      if (diffMinutes <= TAKEN_DISPLAY_MINUTES * 2) return { nextHorario: nextHorarioStr, status: 'TOMADO', alertColor: '#1E90FF', alertText: '✅ REMÉDIO TOMADO!', canLogDose: false, timeRemainingMinutes: null };
  }

  if (minutesUntilNextDose <= WINDOW_AFTER_MINUTES && minutesUntilNextDose >= -WINDOW_BEFORE_MINUTES) {
      return { nextHorario: nextHorarioStr, status: 'HORA', alertColor: '#4CAF50', alertText: '🟢 HORA DO REMÉDIO!', canLogDose: true, timeRemainingMinutes: WINDOW_AFTER_MINUTES - minutesUntilNextDose };
  }
  
  if (minutesUntilNextDose > WINDOW_AFTER_MINUTES && minutesUntilNextDose <= NEAR_TIME_MINUTES) {
      return { nextHorario: nextHorarioStr, status: 'PRÓXIMO', alertColor: '#FFD700', alertText: '💊 REMÉDIO CHEGANDO!', canLogDose: false, timeRemainingMinutes: minutesUntilNextDose };
  }
  
  return { nextHorario: nextHorarioStr, status: 'NORMAL', alertColor: '#808080', alertText: null, canLogDose: false, timeRemainingMinutes: null };
}

export default function MedicationItem({ item, onDelete, onEdit, onLogDose, onShowHistory, currentTimeTick, scheme }) {
  if (!item) return null;
  const dark = scheme === 'dark';
  const globalStyles = useGlobalStyles(scheme);
  const { nextHorario, status, alertColor, alertText, canLogDose, timeRemainingMinutes } = useDoseStatus(item, currentTimeTick);
  const borderWidth = (status === 'PRÓXIMO' || status === 'HORA' || status === 'TOMADO') ? 2 : 1;
  const borderColor = (status === 'NORMAL') ? (dark ? globalStyles.input.borderColor : '#E0E0E0') : alertColor;
  const timerString = timeRemainingMinutes !== null ? (status === 'HORA' ? `🚨 Fim da janela: ${formatMinutes(timeRemainingMinutes)}` : `⏰ Restam: ${formatMinutes(timeRemainingMinutes)}`) : '';
  const bannerTextColor = (status === 'PRÓXIMO' || status === 'HORA') ? '#000' : '#fff';

  return (
    <View style={[styles.itemContainer, { borderColor, borderWidth, backgroundColor: dark ? '#0F1724' : '#fff' }]}>
      {(alertText && status !== 'NORMAL') && (
        <View style={[styles.alertBanner, { backgroundColor: alertColor }]}>
          <Text style={[styles.alertText, { color: bannerTextColor }]}>{alertText}</Text>
          {timerString && <Text style={[styles.timerText, { color: bannerTextColor }]}>{timerString}</Text>}
        </View>
      )}
      <View style={styles.itemHeader}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[styles.itemTitle, { color: dark ? globalStyles.sectionTitle.color : '#444' }]}>{item.nome} - {item.dose}</Text>
          <Text style={[styles.small, { color: dark ? globalStyles.smallMuted.color : '#777' }]}>{`⏰ Próximo: ${nextHorario} • ${item.frequencia || ''}`}</Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.historyButton} onPress={() => onShowHistory && onShowHistory(item)}><MaterialIcons name="timeline" size={24} color="#fff" /></TouchableOpacity>
          <View style={{ flexDirection: 'column', marginLeft: 10 }}>
            <TouchableOpacity style={[styles.editButton, { marginBottom: 6 }]} onPress={() => onEdit && onEdit(item.id)}><Text style={styles.editButtonText}>Editar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete && onDelete(item.id)}><Text style={styles.deleteButtonText}>Excluir</Text></TouchableOpacity>
          </View>
        </View>
      </View>
      {canLogDose && (
        <TouchableOpacity style={globalStyles.logDoseButton} onPress={() => onLogDose && onLogDose(item.id, nextHorario)}>
          <Text style={globalStyles.logDoseButtonText}>REGISTRAR DOSE TOMADA ({nextHorario})</Text>
        </TouchableOpacity>
      )}
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: dark ? globalStyles.smallMuted.color : '#555' }]}>Horários:</Text>
        <Text style={[styles.infoValue, { color: dark ? globalStyles.sectionTitle.color : '#000' }]}>{item.horarios || '—'}</Text>
      </View>
      {item.anotacoes ? <><Text style={[styles.notesTitle, { color: dark ? globalStyles.headerTitle.color : '#1E90FF' }]}>Observações:</Text><Text style={[styles.notesText, { color: dark ? globalStyles.smallMuted.color : '#666' }]}>{item.anotacoes}</Text></> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: { padding: 15, borderRadius: 10, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  actionsContainer: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: { fontSize: 18, fontWeight: '700', marginRight: 10 },
  small: { fontSize: 12, color: '#777' },
  editButton: { backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  editButtonText: { color: '#fff', fontWeight: '600' },
  deleteButton: { backgroundColor: '#B22222', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontWeight: '600' },
  historyButton: { backgroundColor: '#8A2BE2', width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  infoRow: { flexDirection: 'row', marginBottom: 6, marginTop: 10 },
  infoLabel: { fontWeight: '600', marginRight: 6, color: '#555' },
  infoValue: { color: '#000' },
  notesTitle: { fontSize: 14, fontWeight: '600', marginTop: 8, color: '#1E90FF' },
  notesText: { fontSize: 14, color: '#666', marginTop: 4, fontStyle: 'italic' },
  alertBanner: { padding: 8, borderRadius: 6, marginBottom: 10, alignItems: 'center' },
  alertText: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  timerText: { fontWeight: '600', fontSize: 13, marginTop: 4 },
});