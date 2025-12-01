// components/MedicationHistoryModal.js
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit'; 

const screenWidth = Dimensions.get('window').width;

// Fun??o utilit¨¢ria para formatar a data
function formatDoseDate(isoString) {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString('pt-BR');
  const timePart = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} ¨¤s ${timePart}`;
}

// ?? NOVO COMPONENTE
export default function MedicationHistoryModal({ medication, onClose, scheme }) {
  const styles = useGlobalStyles(scheme);
  const isDark = scheme === 'dark';
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fun??o para carregar o hist¨®rico do AsyncStorage
  const loadHistory = async () => {
    if (!medication) return;
    setIsLoading(true);
    try {
      const STORAGE_KEY_HISTORY = `@med_history_${medication.id}`;
      const rawHistory = await AsyncStorage.getItem(STORAGE_KEY_HISTORY);
      const parsedHistory = JSON.parse(rawHistory || '[]');
      // Limita a exibi??o aos ¨²ltimos 30 registros
      setHistory(parsedHistory.reverse().slice(0, 30)); 
    } catch (e) {
      console.error('Erro ao carregar hist¨®rico de doses:', e);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [medication?.id]);

  // --- L¨®gica do Gr¨¢fico de Frequ¨ºncia ---
  const getChartData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dataPoints = Array(7).fill(0).map((_, i) => ({
      date: new Date(today.getTime() - i * 24 * 60 * 60 * 1000), // Dia 0 ¨¦ hoje, Dia 6 ¨¦ 7 dias atr¨¢s
      count: 0
    })).reverse(); // Inverte para ter a ordem: 7 dias atr¨¢s -> Hoje

    history.forEach(dose => {
      const doseDate = new Date(dose.timestamp);
      doseDate.setHours(0, 0, 0, 0);

      const foundDay = dataPoints.find(dp => dp.date.getTime() === doseDate.getTime());
      if (foundDay) {
        foundDay.count += 1;
      }
    });

    return {
      labels: dataPoints.map(dp => 
        // Uso de DD/MM
        dp.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      ),
      datasets: [
        {
          data: dataPoints.map(dp => dp.count),
          color: (opacity = 1) => `rgba(30, 144, 255, ${opacity})`, // Azul
          strokeWidth: 2
        }
      ]
    };
  };
  
  const chartData = getChartData();
  // ----------------------------------------
  
  if (!medication) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true} // <-- MUDAN?A: Agora ¨¦ transparente
      visible={true}
      onRequestClose={onClose}
    >
        {/* ?? CORRE??O CR¨ªTICA: View que cobre toda a tela e usa a cor de fundo do tema */}
        <View style={[localStyles.fullScreenContainer, { backgroundColor: styles.container.backgroundColor }]}>
            <ScrollView contentContainerStyle={localStyles.scrollContainer}>
            
            <TouchableOpacity onPress={onClose} style={localStyles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={isDark ? styles.sectionTitle.color : '#333'} />
                <Text style={[styles.sectionTitle, { marginLeft: 5, color: isDark ? styles.sectionTitle.color : '#333' }]}>Voltar</Text>
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { marginBottom: 10, marginTop: 10 }]}>Historico de Doses</Text>
            <Text style={[styles.sectionTitle, { color: isDark ? styles.headerTitle.color : '#1E90FF', marginBottom: 20 }]}>{medication.nome} - {medication.dose}</Text>

            {isLoading ? (
                <ActivityIndicator size="large" color={styles.headerTitle.color} style={{ marginTop: 50 }} />
            ) : (
                <>
                <Text style={[styles.sectionTitle, { color: isDark ? styles.sectionTitle.color : '#333', marginBottom: 10 }]}>Doses Tomadas nos Ultimos 7 Dias</Text>
                
                <ScrollView horizontal style={{ marginVertical: 10 }}>
                    <LineChart
                    data={chartData}
                    width={Math.max(screenWidth - 30, chartData.labels.length * 60)} // Largura m¨ªnima para 7 pontos
                    height={220}
                    yAxisInterval={1} 
                    formatYLabel={(yValue) => Math.round(yValue).toString()}
                    chartConfig={{
                        backgroundColor: isDark ? '#1F2A37' : '#F7F9FC',
                        backgroundGradientFrom: isDark ? '#0F1724' : '#fff',
                        backgroundGradientTo: isDark ? '#1F2A37' : '#E6E6E6',
                        decimalPlaces: 0, // Sem casas decimais
                        color: (opacity = 1) => `rgba(30, 144, 255, ${opacity})`,
                        labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                        style: {
                        borderRadius: 16
                        },
                        propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: "#1E90FF"
                        },
                        // Adicionando formatXLabel para sanitizar o r¨®tulo
                        formatXLabel: (label) => {
                            return label.replace(/[^0-9/]/g, ''); 
                        },
                    }}
                    bezier
                    style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                </ScrollView>
                
                <Text style={[styles.sectionTitle, { color: isDark ? styles.sectionTitle.color : '#333', marginTop: 20, marginBottom: 10 }]}>Historico Detalhado (Ultimas 30)</Text>

                {history.length > 0 ? (
                    history.map((dose, index) => (
                    <View key={dose.id} style={[localStyles.doseItem, { borderBottomColor: styles.input.borderColor }]}>
                        <Text style={[styles.sectionTitle, { fontSize: 16, color: styles.logDoseButton.backgroundColor }]}>
                        Tomada: {formatDoseDate(dose.timestamp)}
                        </Text>
                        <Text style={[styles.smallMuted, { marginTop: 4, color: isDark ? styles.smallMuted.color : '#666' }]}>
                        Dose Programada: {dose.targetTime}
                        </Text>
                    </View>
                    ))
                ) : (
                    <Text style={styles.emptyListText}>Nenhuma dose registrada ainda.</Text>
                )}
                </>
            )}
            </ScrollView>
        </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
    fullScreenContainer: {
        flex: 1,
    },
    scrollContainer: {
        paddingBottom: 40,
        paddingHorizontal: 15,
        paddingTop: 60, // Para respeitar a ¨¢rea segura, j¨¢ que a view principal do modal n?o tem padding top
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    doseItem: {
      paddingVertical: 10,
      borderBottomWidth: 1,
    }
});