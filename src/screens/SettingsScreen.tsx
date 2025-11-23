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
      <Ionicons name="chevron-down" size={16} color="#8B7355" />
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
            trackColor={{ false: '#E8DCC0', true: '#B8860B' }}
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
          color="#B8860B" 
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
              trackColor={{ false: '#E8DCC0', true: '#B8860B' }}
            />
          </SettingRow>

          <SettingRow title="Sound Effects">
            <Switch 
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: '#E8DCC0', true: '#B8860B' }}
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
              trackColor={{ false: '#E8DCC0', true: '#B8860B' }}
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
    backgroundColor: '#e5e0ca',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#d3c6a2',
    borderBottomWidth: 1,
    borderBottomColor: '#b19068',
  },
  headerText: {
    fontSize: 28,
    fontWeight: '400',
    fontFamily: 'Courier New',
    color: '#8B7355',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#d7d2bf',
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 10,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Courier New',
    color: '#8B7355',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC0',
    marginBottom: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EDD7',
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Courier New',
    color: '#6B5B47',
    flex: 1,
    letterSpacing: 0.5,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bba06b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#b19068',
  },
  dropdownText: {
    fontSize: 14,
    color: '#6B5B47',
    marginRight: 8,
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#d7d2bf',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 20,
    marginHorizontal: 10,
    borderRadius: 12,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  advancedToggleText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Courier New',
    color: '#B8860B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  buttonRow: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  clearButton: {
    backgroundColor: '#8b7355',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6b5b47',
  },
  clearButtonText: {
    color: '#FFFEF7',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Courier New',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Courier New',
    color: '#A0916B',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});