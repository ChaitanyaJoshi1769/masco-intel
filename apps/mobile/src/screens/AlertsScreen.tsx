import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { apiClient } from '../services/api';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await apiClient.getDashboardAlerts();
      setAlerts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  return (
    <View style={styles.container}>
      {alerts.length > 0 ? (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.alert, styles[`severity_${item.severity}`]]}>
              <Text style={styles.message}>{item.message}</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No alerts</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  alert: { padding: 16, marginBottom: 12, marginHorizontal: 16, borderRadius: 8 },
  severity_critical: { backgroundColor: '#fee2e2' },
  severity_warning: { backgroundColor: '#fef3c7' },
  severity_info: { backgroundColor: '#dbeafe' },
  message: { fontSize: 14, color: '#1f2937' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
