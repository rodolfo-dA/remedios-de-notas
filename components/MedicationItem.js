// components/MedicationItem.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';

// Recebe item, onDelete(id), onEdit(id)
export default function MedicationItem({ item, onDelete, onEdit }) {
  if (!item) return null;

  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const globalStyles = useGlobalStyles(scheme);

  // Helper: transforma "HH:MM" em minutos do dia
  const toMinutes = (t) => {
    if (!t || typeof t !== 'string') return 24 * 60;
    const [hh, mm] = t.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return 24 * 60;
    return hh * 60 + mm;
  };

  // Calcula próximo horário válido a partir de item.horarios (lista). Retorna string "HH:MM" ou undefined
  const calculateNextFromHorarios = () => {
    if (!item.horarios) return item.proximoHorario || undefined;
    const parts = item.horarios.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.length) return item.proximoHorario || undefined;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // transformar em array de minutos e encontrar primeiro >= now
    const minutesArr = parts.map(p => ({ raw: p, min: toMinutes(p) })).filter(x => x.min < 24 * 60);
    // ordenar
    minutesArr.sort((a, b) => a.min - b.min);

    // encontrar o primeiro que ainda vai ocorrer hoje
    const upcoming = minutesArr.find(x => x.min >= nowMinutes);
    if (upcoming) return upcoming.raw;

    // se nenhum for >= agora, retornar o primeiro do dia seguinte (o menor)
    return minutesArr.length ? minutesArr[0].raw : (item.proximoHorario || undefined);
  };

  const nextHorario = calculateNextFromHorarios() || item.proximoHorario || '—';

  // isTimeNear: dentro das próximas 4 horas
  const isTimeNear = (() => {
    if (!nextHorario || nextHorario === '—') return false;
    const [h, m] = nextHorario.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return false;
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    // se target for antes de now, considerar para amanhã
    if (target < now) target.setDate(target.getDate() + 1);
    const diffHours = (target - now) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 4;
  })();

  const alertColor = isTimeNear ? '#FFD700' : (dark ? globalStyles.input.borderColor : '#E0E0E0');
  const borderWidth = isTimeNear ? 2 : 1;

  return (
    <View style={[styles.itemContainer, { borderColor: alertColor, borderWidth, backgroundColor: dark ? '#0F1724' : '#fff' }]}>
      {isTimeNear && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>💊 HORA DO REMÉDIO CHEGANDO! ⏰</Text>
        </View>
      )}

      <View style={styles.itemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: dark ? globalStyles.sectionTitle.color : '#444' }]}>{item.nome} - {item.dose}</Text>
          <Text style={[styles.small, { color: dark ? globalStyles.smallMuted.color : '#777' }]}>{`⏰ Próximo: ${nextHorario} • ${item.frequencia || ''}`}</Text>
        </View>

        <View style={{ flexDirection: 'column' }}>
          <TouchableOpacity style={styles.editButton} onPress={() => onEdit && onEdit(item.id)}>
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete && onDelete(item.id)}>
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: dark ? globalStyles.smallMuted.color : '#555' }]}>Horários:</Text>
        <Text style={[styles.infoValue, { color: dark ? globalStyles.sectionTitle.color : '#000' }]}>{item.horarios || '—'}</Text>
      </View>

      {item.anotacoes ? (
        <>
          <Text style={[styles.notesTitle, { color: dark ? globalStyles.headerTitle.color : '#1E90FF' }]}>Observações:</Text>
          <Text style={[styles.notesText, { color: dark ? globalStyles.smallMuted.color : '#666' }]}>{item.anotacoes}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: { padding: 15, borderRadius: 10, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontSize: 18, fontWeight: '700', marginRight: 10 },
  small: { fontSize: 12, color: '#777' },
  editButton: { backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginBottom: 6, alignItems: 'center' },
  editButtonText: { color: '#fff', fontWeight: '600' },
  deleteButton: { backgroundColor: '#B22222', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontWeight: '600' },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoLabel: { fontWeight: '600', marginRight: 6, color: '#555' },
  infoValue: { color: '#000' },
  notesTitle: { fontSize: 14, fontWeight: '600', marginTop: 8, color: '#1E90FF' },
  notesText: { fontSize: 14, color: '#666', marginTop: 4, fontStyle: 'italic' },
  alertBanner: { backgroundColor: '#FFEB3B', padding: 8, borderRadius: 6, marginBottom: 10, alignItems: 'center' },
  alertText: { color: '#8B4B00', fontWeight: 'bold', fontSize: 14 },
});