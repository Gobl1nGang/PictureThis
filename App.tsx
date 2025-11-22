import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const tabWidth = width / 4;

import CameraScreen from './src/screens/CameraScreen';
import AlbumsScreen from './src/screens/AlbumsScreen';
import InspoScreen from './src/screens/InspoScreen';
import AccountScreen from './src/screens/AccountScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('Camera');
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const tabs = ['Camera', 'Albums', 'Inspo', 'Account'];
  
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
      case 'Albums': return 'images';
      case 'Inspo': return 'bulb';
      case 'Account': return 'person';
      default: return 'circle';
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Camera':
        return <CameraScreen />;
      case 'Albums':
        return <AlbumsScreen />;
      case 'Inspo':
        return <InspoScreen />;
      case 'Account':
        return <AccountScreen />;
      default:
        return <CameraScreen />;
    }
  };

  return (
    <View style={styles.container}>
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
              color={activeTab === tabName ? '#fff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
              {tabName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingBottom: 40,
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
    color: '#666',
    fontSize: 11,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
});
