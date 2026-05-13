import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Masco Intel v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 16, overflow: 'hidden' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', padding: 16, paddingBottom: 8 },
  setting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  settingLabel: { fontSize: 16, color: '#1f2937' },
  button: { backgroundColor: '#ef4444', padding: 16, alignItems: 'center', margin: 16 },
  buttonText: { color: '#fff', fontWeight: '600' },
  version: { textAlign: 'center', color: '#9ca3af', marginTop: 'auto' },
});
