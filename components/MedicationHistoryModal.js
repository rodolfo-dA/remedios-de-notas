import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import useGlobalStyles from '../styles/globalStyles';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

function formatDoseDate(isoString) {
  const date = new Date(isoString);
  return `${date.toLocaleDateString('pt-BR')} as ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function MedicationHistoryModal({ medication, onClose, scheme }) {
  const styles = useGlobalStyles(scheme);
  const isDark = scheme === 'dark';
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
        if (!medication) return;
        setIsLoading(true);
        try {
            const raw = await AsyncStorage.getItem(`@med_history_${medication.id}`);
            const parsed = JSON.parse(raw || '[]');
            setHistory(parsed.reverse().slice(0, 30));
        } catch (e) { setHistory([]); } finally { setIsLoading(false); }
    })();
  }, [medication?.id]);

  const getChartData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dataPoints = Array(7).fill(0).map((_, i) => ({ date: new Date(today.getTime() - i * 86400000), count: 0 })).reverse();
    history.forEach(dose => {
      const d = new Date(dose.timestamp);
      d.setHours(0, 0, 0, 0);
      const found = dataPoints.find(dp => dp.date.getTime() === d.getTime());
      if (found) found.count += 1;
    });
    return {
      labels: dataPoints.map(dp => dp.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
      datasets: [{ data: dataPoints.map(dp => dp.count), color: (opacity = 1) => `rgba(30, 144, 255, ${opacity})`, strokeWidth: 2 }]
    };
  };
  
  const chartData = getChartData();
  if (!medication) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={true} onRequestClose={onClose}>
        <View style={[localStyles.fullScreenContainer, { backgroundColor: styles.container.backgroundColor }]}>
            <ScrollView contentContainerStyle={localStyles.scrollContainer}>
            <TouchableOpacity onPress={onClose} style={localStyles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={isDark ? styles.sectionTitle.color : '#333'} />
                <Text style={[styles.sectionTitle, { marginLeft: 5, color: isDark ? styles.sectionTitle.color : '#333' }]}>Voltar</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { marginBottom: 10, marginTop: 10 }]}>Historico de Doses</Text>
            <Text style={[styles.sectionTitle, { color: isDark ? styles.headerTitle.color : '#1E90FF', marginBottom: 20 }]}>{medication.nome} - {medication.dose}</Text>
            {isLoading ? (<ActivityIndicator size="large" color={styles.headerTitle.color} style={{ marginTop: 50 }} />) : (
                <>
                <Text style={[styles.sectionTitle, { color: isDark ? styles.sectionTitle.color : '#333', marginBottom: 10 }]}>Ultimos 7 Dias</Text>
                <ScrollView horizontal style={{ marginVertical: 10 }}>
                    <LineChart data={chartData} width={Math.max(screenWidth - 30, chartData.labels.length * 60)} height={220} yAxisInterval={1}
                    formatYLabel={(y) => Math.round(y).toString()}
                    chartConfig={{ backgroundColor: isDark ? '#1F2A37' : '#F7F9FC', backgroundGradientFrom: isDark ? '#0F1724' : '#fff', backgroundGradientTo: isDark ? '#1F2A37' : '#E6E6E6', decimalPlaces: 0, color: (opacity = 1) => `rgba(30, 144, 255, ${opacity})`, labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`, propsForDots: { r: "6", strokeWidth: "2", stroke: "#1E90FF" }, formatXLabel: (l) => l.replace(/[^0-9/]/g, '') }}
                    bezier style={{ marginVertical: 8, borderRadius: 16 }} />
                </ScrollView>
                <Text style={[styles.sectionTitle, { color: isDark ? styles.sectionTitle.color : '#333', marginTop: 20, marginBottom: 10 }]}>Historico Detalhado (Ultimas 30)</Text>
                {history.length > 0 ? (history.map((dose) => (
                    <View key={dose.id} style={[localStyles.doseItem, { borderBottomColor: styles.input.borderColor }]}>
                        <Text style={[styles.sectionTitle, { fontSize: 16, color: styles.logDoseButton.backgroundColor }]}>Tomada: {formatDoseDate(dose.timestamp)}</Text>
                        <Text style={[styles.smallMuted, { marginTop: 4, color: isDark ? styles.smallMuted.color : '#666' }]}>Dose Programada: {dose.targetTime}</Text>
                    </View>
                ))) : (<Text style={styles.emptyListText}>Nenhuma dose registrada ainda.</Text>)}
                </>
            )}
            </ScrollView>
        </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
    fullScreenContainer: { flex: 1 },
    scrollContainer: { paddingBottom: 40, paddingHorizontal: 15, paddingTop: 60 },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    doseItem: { paddingVertical: 10, borderBottomWidth: 1 }
});