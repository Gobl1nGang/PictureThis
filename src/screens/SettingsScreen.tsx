import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const advancedAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
    Animated.timing(advancedAnim, {
      toValue: showAdvanced ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

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
      <Ionicons name="chevron-down" size={16} color="white" />
    </TouchableOpacity>
  );

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive', onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }]}>
        <Animated.Text style={[styles.headerText, {
          transform: [{ scale: scaleAnim }]
        }]}>Settings</Animated.Text>
      </Animated.View>

      {/* Basic Settings */}
      <Animated.View style={[styles.section, {
        opacity: fadeAnim,
        transform: [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 50],
            outputRange: [0, 30]
          })
        }]
      }]}>
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
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#4CD964' }}
          />
        </SettingRow>

        <SettingRow title="Photo Quality">
          <DropdownButton
            value={photoQuality}
            options={['High', 'Medium', 'Low']}
            onSelect={setPhotoQuality}
          />
        </SettingRow>
      </Animated.View>

      {/* Advanced Settings Toggle */}
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 50],
            outputRange: [0, 40]
          })
        }]
      }}>
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={toggleAdvanced}
          activeOpacity={0.8}
        >
          <Text style={styles.advancedToggleText}>Advanced Settings</Text>
          <Animated.View style={{
            transform: [{
              rotate: advancedAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg']
              })
            }]
          }}>
            <Ionicons
              name="chevron-down"
              size={20}
              color="white"
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Advanced Settings */}
      {showAdvanced && (
        <Animated.View style={[styles.section, {
          opacity: advancedAnim,
          transform: [{
            translateY: advancedAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0]
            })
          }]
        }]}>
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
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#4CD964' }}
            />
          </SettingRow>

          <SettingRow title="Sound Effects">
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#4CD964' }}
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
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#4CD964' }}
            />
          </SettingRow>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.clearButton} onPress={clearCache}>
              <Text style={styles.clearButtonText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    backgroundColor: '#050505',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 217, 100, 0.3)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(76, 217, 100, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 20,
    paddingVertical: 20,
    borderRadius: 35,
    marginHorizontal: width * 0.04,
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ccc',
    flex: 1,
    letterSpacing: 0.2,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 130,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: 'white',
    marginRight: 8,
  },
  advancedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 28,
    paddingVertical: 22,
    marginTop: 20,
    marginHorizontal: width * 0.04,
    borderRadius: 35,
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  advancedToggleText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.3,
  },
  buttonRow: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
});