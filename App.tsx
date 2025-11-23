import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Image, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { UserProfileProvider, useUserProfile } from './src/contexts/UserProfileContext';
import { PhotoContextProvider } from './src/contexts/PhotoContextContext';

const { width } = Dimensions.get('window');
const tabWidth = width / 4;

import CameraScreen from './src/screens/CameraScreen';
import PhotosScreen from './src/screens/PhotosScreen';
import InspoScreen from './src/screens/InspoScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingFlow from './src/screens/OnboardingFlow';

function MainApp() {
  const { hasCompletedOnboarding, loading } = useUserProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('Camera');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const tabs = ['Camera', 'Photos', 'Inspo', 'Settings'];

  useEffect(() => {
    if (!loading && !hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [loading, hasCompletedOnboarding]);

  useEffect(() => {
    const tabIndex = tabs.indexOf(activeTab);
    Animated.spring(slideAnim, {
      toValue: tabIndex * tabWidth,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeTab]);

  const getTabIcon = (tabName: string) => {
    switch (tabName) {
      case 'Camera': return 'camera';
      case 'Photos': return 'images';
      case 'Inspo': return 'bulb';
      case 'Settings': return 'settings';
      default: return 'circle';
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Camera':
        return <CameraScreen />;
      case 'Photos':
        return <PhotosScreen />;
      case 'Inspo':
        return <InspoScreen />;
      case 'Settings':
        return <SettingsScreen />;
      default:
        return <CameraScreen />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderScreen()}

      <View style={styles.tabBar}>
        <Animated.View
          style={[
            styles.slideIndicator,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        />

        {tabs.map((tabName) => (
          <TouchableOpacity
            key={tabName}
            style={styles.tab}
            onPress={() => setActiveTab(tabName)}
          >
            <Ionicons
              name={getTabIcon(tabName) as any}
              size={22}
              color={activeTab === tabName ? '#fff' : '#fff'}
            />
            <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
              {tabName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <UserProfileProvider>
      <PhotoContextProvider>
        <MainApp />
      </PhotoContextProvider>
    </UserProfileProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#b19068',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingBottom: 0,
    paddingTop: 15,
    position: 'relative',
  },
  slideIndicator: {
    position: 'absolute',
    top: 0,
    width: tabWidth,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  tabText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
});
