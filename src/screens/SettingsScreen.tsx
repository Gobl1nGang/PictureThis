import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  // Basic Settings State
  const [feedbackFrequency, setFeedbackFrequency] = useState('2s');
  const [coachingStyle, setCoachingStyle] = useState('Intermediate');
  const [gridLines, setGridLines] = useState('Rule of Thirds');
  const [autoSave, setAutoSave] = useState(true);
  const [photoQuality, setPhotoQuality] = useState('High');
  
  // Advanced Settings State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [analysisFocus, setAnalysisFocus] = useState('Both');
  const [scoreSensitivity, setScoreSensitivity] = useState('Normal');
  const [storageLocation, setStorageLocation] = useState('Camera Roll');
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState('Local only');
  const [usageAnalytics, setUsageAnalytics] = useState(false);

  const SettingRow = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingTitle}>{title}</Text>
      {children}
    </View>
  );

  const DropdownButton = ({ value, options, onSelect }: { value: string; options: string[]; onSelect: (value: string) => void }) => (
    <TouchableOpacity 
      style={styles.dropdown}
      onPress={() => {
        Alert.alert(
          'Select Option',
          '',
          options.map(option => ({
            text: option,
            onPress: () => onSelect(option)
          }))
        );
      }}
    >
      <Text style={styles.dropdownText}>{value}</Text>
      <Ionicons name="chevron-down" size={16} color="#666" />
    </TouchableOpacity>
  );

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          Alert.alert('Success', 'Cache cleared successfully');
        }}
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
      </View>

      {/* Basic Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Settings</Text>
        
        <SettingRow title="AI Feedback Frequency">
          <DropdownButton 
            value={feedbackFrequency}
            options={['1s', '2s', '3s']}
            onSelect={setFeedbackFrequency}
          />
        </SettingRow>

        <SettingRow title="Coaching Style">
          <DropdownButton 
            value={coachingStyle}
            options={['Beginner', 'Intermediate', 'Advanced']}
            onSelect={setCoachingStyle}
          />
        </SettingRow>

        <SettingRow title="Grid Lines">
          <DropdownButton 
            value={gridLines}
            options={['Rule of Thirds', 'Off']}
            onSelect={setGridLines}
          />
        </SettingRow>

        <SettingRow title="Auto-Save Photos">
          <Switch 
            value={autoSave}
            onValueChange={setAutoSave}
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </SettingRow>

        <SettingRow title="Photo Quality">
          <DropdownButton 
            value={photoQuality}
            options={['High', 'Medium', 'Low']}
            onSelect={setPhotoQuality}
          />
        </SettingRow>
      </View>

      {/* Advanced Settings Toggle */}
      <TouchableOpacity 
        style={styles.advancedToggle}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text style={styles.advancedToggleText}>Advanced Settings</Text>
        <Ionicons 
          name={showAdvanced ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#007AFF" 
        />
      </TouchableOpacity>

      {/* Advanced Settings */}
      {showAdvanced && (
        <View style={styles.section}>
          <SettingRow title="Analysis Focus">
            <DropdownButton 
              value={analysisFocus}
              options={['Composition', 'Lighting', 'Both']}
              onSelect={setAnalysisFocus}
            />
          </SettingRow>

          <SettingRow title="Pro Score Sensitivity">
            <DropdownButton 
              value={scoreSensitivity}
              options={['Strict', 'Normal', 'Lenient']}
              onSelect={setScoreSensitivity}
            />
          </SettingRow>

          <SettingRow title="Storage Location">
            <DropdownButton 
              value={storageLocation}
              options={['Camera Roll', 'App Folder']}
              onSelect={setStorageLocation}
            />
          </SettingRow>

          <SettingRow title="Haptic Feedback">
            <Switch 
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </SettingRow>

          <SettingRow title="Sound Effects">
            <Switch 
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </SettingRow>

          <SettingRow title="Photo Analysis">
            <DropdownButton 
              value={photoAnalysis}
              options={['Local only', 'Cloud-enhanced']}
              onSelect={setPhotoAnalysis}
            />
          </SettingRow>

          <SettingRow title="Usage Analytics">
            <Switch 
              value={usageAnalytics}
              onValueChange={setUsageAnalytics}
              trackColor={{ false: '#ccc', true: '#007AFF' }}
            />
          </SettingRow>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.clearButton} onPress={clearCache}>
              <Text style={styles.clearButtonText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>PictureThis v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  advancedToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  buttonRow: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});