// components/MedicationItem.js
import React, { useState, useEffect, useCallback } from 'react'; 
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { MaterialIcons } from '@expo/vector-icons'; 

// 🚀 MUDANÇA: Limite de tempo para o alerta 'PRÓXIMO' (Antes era 4h)
const NEAR_TIME_MINUTES = 2 * 60; // 3 horas antes
const WINDOW_BEFORE_MINUTES = 5; // 5 minutos antes
const WINDOW_AFTER_MINUTES = 5;  // 5 minutos depois
const TAKEN_DISPLAY_MINUTES = 10; 

// --- FUNÇÃO DE AJUDA: Formata minutos em "Xh Ym" ou "Xm" ---
function formatMinutes(minutes) {
    if (minutes <= 0) return 'Agora!';
    if (minutes >= 60) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    }
    return `${Math.ceil(minutes)}m`; // Arredonda para cima para ser mais útil em minutos
}

// --- LÓGICA DE ESTADO DA DOSE ---
function useDoseStatus(item, currentTimeTick) {
  const [lastDoseRegistered, setLastDoseRegistered] = useState(null);
  
  const toMinutes = useCallback((t) => {
    if (!t || typeof t !== 'string') return 24 * 60;
    const [hh, mm] = t.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return 24 * 60;
    return hh * 60 + mm;
  }, []);

  const calculateNextFromHorarios = useCallback(() => {
    if (!item.horarios) return null;
    const parts = item.horarios.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.length) return null;

    const now = new Date(currentTimeTick);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const minutesArr = parts.map(p => ({ raw: p, min: toMinutes(p) })).filter(x => x.min < 24 * 60);
    minutesArr.sort((a, b) => a.min - b.min);

    const upcoming = minutesArr.find(x => x.min > nowMinutes); 

    if (upcoming) return upcoming.raw;

    // Se todas passaram, retorna a primeira do dia seguinte
    return minutesArr.length ? minutesArr[0].raw : null;
  }, [item.horarios, currentTimeTick, toMinutes]);
  
  // Função para buscar o histórico da última dose tomada para este horário
  const checkLastRegisteredDose = useCallback(async (nextTimeStr) => {
      try {
          const rawHistory = await AsyncStorage.getItem(`@med_history_${item.id}`);
          const history = JSON.parse(rawHistory || '[]');
          
          if (history.length === 0) {
              setLastDoseRegistered(null);
              return;
          }
          
          const lastTaken = history[history.length - 1];
          setLastDoseRegistered(lastTaken);
          
      } catch (e) {
          console.warn('Erro ao buscar histórico da dose:', e);
          setLastDoseRegistered(null);
      }
  }, [item.id]);

  useEffect(() => {
    const nextTimeStr = calculateNextFromHorarios();
    if (nextTimeStr) {
        checkLastRegisteredDose(nextTimeStr);
    }
  }, [item.id, currentTimeTick, calculateNextFromHorarios, checkLastRegisteredDose]);
  
  const nextHorarioStr = calculateNextFromHorarios();
  const nextHorarioMinutes = toMinutes(nextHorarioStr);
  const now = new Date(currentTimeTick);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  
  if (!nextHorarioStr) {
      return { 
          nextHorario: '—', 
          status: 'NORMAL', 
          alertColor: '#808080', 
          alertText: 'Nenhum horário definido', 
          canLogDose: false,
          timeRemainingMinutes: null, // 🚀 NOVO
      };
  }

  // Se a dose já passou no dia, ela é para amanhã.
  let minutesUntilNextDose = nextHorarioMinutes - nowMinutes;
  if (minutesUntilNextDose < 0) {
      minutesUntilNextDose += 24 * 60; // Passou para o dia seguinte
  }
  
  // 1. Verificar status 'TOMADO'
  if (lastDoseRegistered) {
      const takenTime = new Date(lastDoseRegistered.timestamp);
      const diffMinutes = (now.getTime() - takenTime.getTime()) / (1000 * 60);

      if (diffMinutes <= TAKEN_DISPLAY_MINUTES * 2) { 
          return { 
              nextHorario: nextHorarioStr, 
              status: 'TOMADO', 
              alertColor: '#1E90FF', // Azul
              alertText: '✅ REMÉDIO TOMADO!', 
              canLogDose: false,
              timeRemainingMinutes: null,
          };
      }
  }

  // 2. Verificar status 'HORA' (Janela de 5 min antes a 5 min depois)
  if (minutesUntilNextDose <= WINDOW_AFTER_MINUTES && minutesUntilNextDose >= -WINDOW_BEFORE_MINUTES) {
      // Tempo restante para a janela fechar: 
      // Se estamos 5min antes (minutosUntilNextDose = -5), restam 10min (5min para o horário + 5min de tolerância).
      // Se estamos 5min depois (minutosUntilNextDose = 5), restam 0min de tolerância.
      const minutesToWindowClose = WINDOW_AFTER_MINUTES - minutesUntilNextDose;

      return { 
          nextHorario: nextHorarioStr, 
          status: 'HORA', 
          alertColor: '#4CAF50', // Verde
          alertText: '🟢 HORA DO REMÉDIO!', 
          canLogDose: true,
          // 🚀 NOVO: Exibe o tempo restante para o fim da janela de 10 minutos
          timeRemainingMinutes: minutesToWindowClose, 
      };
  }
  
  // 3. Verificar status 'PRÓXIMO' (Janela de 3 horas até 5 min antes)
  // O limite inferior é 5 minutos (minutosUntilNextDose > WINDOW_AFTER_MINUTES)
  // O limite superior é 3 horas (minutesUntilNextDose <= NEAR_TIME_MINUTES)
  if (minutesUntilNextDose > WINDOW_AFTER_MINUTES && minutesUntilNextDose <= NEAR_TIME_MINUTES) {
      return { 
          nextHorario: nextHorarioStr, 
          status: 'PRÓXIMO', 
          alertColor: '#FFD700', // Amarelo
          alertText: '💊 REMÉDIO CHEGANDO!', 
          canLogDose: false,
          // 🚀 NOVO: Tempo restante até a hora da dose (em minutos)
          timeRemainingMinutes: minutesUntilNextDose, 
      };
  }
  
  // 4. Se não está em nenhum estado de alerta (tempo restante > 3h)
  return { 
      nextHorario: nextHorarioStr, 
      status: 'NORMAL', 
      alertColor: '#808080', 
      alertText: null, 
      canLogDose: false,
      timeRemainingMinutes: null,
  };
}
// --- FIM LÓGICA DE ESTADO DA DOSE ---


export default function MedicationItem({ item, onDelete, onEdit, onLogDose, onShowHistory, currentTimeTick, scheme }) { 
  if (!item) return null;

  const dark = scheme === 'dark';
  const globalStyles = useGlobalStyles(scheme);

  const { nextHorario, status, alertColor, alertText, canLogDose, timeRemainingMinutes } = useDoseStatus(item, currentTimeTick);

  // Define a cor da borda com base no status
  const borderWidth = (status === 'PRÓXIMO' || status === 'HORA' || status === 'TOMADO') ? 2 : 1;
  const borderColor = (status === 'NORMAL') ? (dark ? globalStyles.input.borderColor : '#E0E0E0') : alertColor;

  // 🚀 NOVO: Gera a string do timer
  const timerString = timeRemainingMinutes !== null 
    ? (status === 'HORA' 
        ? `🚨 Fim da janela: ${formatMinutes(timeRemainingMinutes)}`
        : `⏰ Restam: ${formatMinutes(timeRemainingMinutes)}`) 
    : '';
    
  // 🚀 NOVO: Define a cor do texto do banner (preto para amarelo/verde, branco para azul)
  const bannerTextColor = (status === 'PRÓXIMO' || status === 'HORA') ? '#000' : '#fff';

  return (
    <View style={[styles.itemContainer, { borderColor: borderColor, borderWidth, backgroundColor: dark ? '#0F1724' : '#fff' }]}>
      
      {(alertText && status !== 'NORMAL') && (
        <View style={[styles.alertBanner, { backgroundColor: alertColor }]}>
          <Text style={[styles.alertText, { color: bannerTextColor }]}>{alertText}</Text>
          {/* 🚀 NOVO: Exibe o timer dentro do banner de alerta */}
          {timerString && (
             <Text style={[styles.timerText, { color: bannerTextColor }]}>{timerString}</Text>
          )}
        </View>
      )}

      <View style={styles.itemHeader}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[styles.itemTitle, { color: dark ? globalStyles.sectionTitle.color : '#444' }]}>{item.nome} - {item.dose}</Text>
          <Text style={[styles.small, { color: dark ? globalStyles.smallMuted.color : '#777' }]}>{`⏰ Próximo: ${nextHorario} • ${item.frequencia || ''}`}</Text>
        </View>

        <View style={styles.actionsContainer}>
          {/* BOTÃO: HISTÓRICO/GRÁFICO */}
          <TouchableOpacity style={styles.historyButton} onPress={() => onShowHistory && onShowHistory(item)}>
            <MaterialIcons name="timeline" size={24} color="#fff" />
          </TouchableOpacity>
        
          <View style={{ flexDirection: 'column', marginLeft: 10 }}>
            <TouchableOpacity style={[styles.editButton, { marginBottom: 6 }]} onPress={() => onEdit && onEdit(item.id)}>
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete && onDelete(item.id)}>
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* BOTÃO DE REGISTRO DE DOSE (visível apenas quando canLogDose for true) */}
      {canLogDose && (
        <TouchableOpacity style={globalStyles.logDoseButton} onPress={() => onLogDose && onLogDose(item.id, nextHorario)}>
          <Text style={globalStyles.logDoseButtonText}>REGISTRAR DOSE TOMADA ({nextHorario})</Text>
        </TouchableOpacity>
      )}

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
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  actionsContainer: { flexDirection: 'row', alignItems: 'center' }, 
  itemTitle: { fontSize: 18, fontWeight: '700', marginRight: 10 },
  small: { fontSize: 12, color: '#777' },
  editButton: { backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  editButtonText: { color: '#fff', fontWeight: '600' },
  deleteButton: { backgroundColor: '#B22222', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontWeight: '600' },
  historyButton: {
    backgroundColor: '#8A2BE2', // Roxo
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: { flexDirection: 'row', marginBottom: 6, marginTop: 10 },
  infoLabel: { fontWeight: '600', marginRight: 6, color: '#555' },
  infoValue: { color: '#000' },
  notesTitle: { fontSize: 14, fontWeight: '600', marginTop: 8, color: '#1E90FF' },
  notesText: { fontSize: 14, color: '#666', marginTop: 4, fontStyle: 'italic' },
  alertBanner: { padding: 8, borderRadius: 6, marginBottom: 10, alignItems: 'center' },
  alertText: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  // 🚀 NOVO ESTILO: Texto do timer/emergência
  timerText: { 
      fontWeight: '600', 
      fontSize: 13, 
      marginTop: 4 
  },
});