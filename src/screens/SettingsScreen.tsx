import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TutorialSystem } from '../features/tutorials/TutorialSystem';

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
  const [showTutorials, setShowTutorials] = useState(false);

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

  const GroupedSection = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <View style={styles.groupedSectionContainer}>
      {title && <Text style={styles.groupedSectionTitle}>{title}</Text>}
      <View style={styles.groupedSection}>
        {children}
      </View>
    </View>
  );

  const GroupedRow = ({
    icon,
    title,
    value,
    isLast,
    onPress,
    type = 'arrow',
    switchValue,
    onSwitchChange
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value?: string;
    isLast?: boolean;
    onPress?: () => void;
    type?: 'arrow' | 'switch' | 'value';
    switchValue?: boolean;
    onSwitchChange?: (val: boolean) => void;
  }) => (
    <TouchableOpacity
      style={[styles.groupedRow, isLast && styles.lastGroupedRow]}
      onPress={onPress}
      disabled={type === 'switch'}
      activeOpacity={0.7}
    >
      <View style={styles.rowIconContainer}>
        <Ionicons name={icon} size={22} color="#4CD964" />
      </View>
      <View style={[styles.rowContent, isLast && styles.lastRowContent]}>
        <Text style={styles.rowTitle}>{title}</Text>
        <View style={styles.rowRight}>
          {type === 'switch' ? (
            <Switch
              value={switchValue}
              onValueChange={onSwitchChange}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#4CD964' }}
              thumbColor="white"
            />
          ) : (
            <>
              {value && <Text style={styles.rowValue}>{value}</Text>}
              {type === 'arrow' && <Ionicons name="chevron-forward" size={16} color="#666" style={{ marginLeft: 8 }} />}
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleSelect = (title: string, options: string[], current: string, onSelect: (val: string) => void) => {
    Alert.alert(
      title,
      '',
      options.map(opt => ({
        text: opt,
        style: opt === current ? 'default' : 'default',
        onPress: () => onSelect(opt)
      })),
      { cancelable: true }
    );
  };

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        {/* Pro Features Banner */}
        <View style={styles.proBanner}>
          <View style={styles.proContent}>
            <Text style={styles.proTitle}>Photon Pro</Text>
            <Text style={styles.proSubtitle}>Unlock RAW capture, 50MP mode, and advanced AI tools.</Text>
          </View>
          <TouchableOpacity style={styles.proButton}>
            <Text style={styles.proButtonText}>UPGRADE</Text>
          </TouchableOpacity>
        </View>

        <GroupedSection title="LEARNING">
          <GroupedRow
            icon="school-outline"
            title="Photography Tutorials"
            onPress={() => setShowTutorials(true)}
          />
          <GroupedRow
            icon="grid-outline"
            title="Grid Lines"
            value={gridLines}
            onPress={() => handleSelect('Grid Lines', ['Rule of Thirds', 'Golden Ratio', 'Off'], gridLines, setGridLines)}
          />
          <GroupedRow
            icon="school-outline"
            title="Coaching Style"
            value={coachingStyle}
            isLast
            onPress={() => handleSelect('Coaching Style', ['Beginner', 'Intermediate', 'Advanced'], coachingStyle, setCoachingStyle)}
          />
        </GroupedSection>

        <GroupedSection title="CAMERA">
          <GroupedRow
            icon="image-outline"
            title="Photo Quality"
            value={photoQuality}
            onPress={() => handleSelect('Photo Quality', ['High', 'Medium', 'Low'], photoQuality, setPhotoQuality)}
          />
          <GroupedRow
            icon="save-outline"
            title="Auto-Save"
            type="switch"
            switchValue={autoSave}
            onSwitchChange={setAutoSave}
          />
          <GroupedRow
            icon="flash-outline"
            title="Feedback Frequency"
            value={feedbackFrequency}
            isLast
            onPress={() => handleSelect('Feedback Frequency', ['1s', '2s', '3s'], feedbackFrequency, setFeedbackFrequency)}
          />
        </GroupedSection>

        <GroupedSection title="ADVANCED">
          <GroupedRow
            icon="finger-print-outline"
            title="Haptic Feedback"
            type="switch"
            switchValue={hapticFeedback}
            onSwitchChange={setHapticFeedback}
          />
          <GroupedRow
            icon="volume-high-outline"
            title="Sound Effects"
            type="switch"
            switchValue={soundEffects}
            onSwitchChange={setSoundEffects}
          />
          <GroupedRow
            icon="analytics-outline"
            title="Usage Analytics"
            type="switch"
            switchValue={usageAnalytics}
            onSwitchChange={setUsageAnalytics}
          />
          <GroupedRow
            icon="trash-outline"
            title="Clear Cache"
            isLast
            onPress={clearCache}
          />
        </GroupedSection>

        <View style={styles.footer}>
          <Text style={styles.versionText}>PictureThis v1.0.0 (Build 1024)</Text>
        </View>

      </ScrollView>

      <TutorialSystem
        visible={showTutorials}
        onClose={() => setShowTutorials(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 217, 100, 0.3)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  proBanner: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CD964',
    flexDirection: 'row',
    alignItems: 'center',
  },
  proContent: {
    flex: 1,
  },
  proTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CD964',
    marginBottom: 4,
  },
  proSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  proButton: {
    backgroundColor: '#4CD964',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  proButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  groupedSectionContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  groupedSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  groupedSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  lastGroupedRow: {
    borderBottomWidth: 0,
  },
  rowIconContainer: {
    width: 32,
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastRowContent: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  rowTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '400',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 16,
    color: '#666',
  },
  versionText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
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

});