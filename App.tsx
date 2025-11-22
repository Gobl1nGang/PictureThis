import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import CameraScreen from './src/screens/CameraScreen';
import AlbumsScreen from './src/screens/AlbumsScreen';
import InspoScreen from './src/screens/InspoScreen';
import AccountScreen from './src/screens/AccountScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('Camera');

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
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Camera' && styles.activeTab]} 
          onPress={() => setActiveTab('Camera')}
        >
          <Text style={[styles.tabText, activeTab === 'Camera' && styles.activeTabText]}>Camera</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Albums' && styles.activeTab]} 
          onPress={() => setActiveTab('Albums')}
        >
          <Text style={[styles.tabText, activeTab === 'Albums' && styles.activeTabText]}>Albums</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Inspo' && styles.activeTab]} 
          onPress={() => setActiveTab('Inspo')}
        >
          <Text style={[styles.tabText, activeTab === 'Inspo' && styles.activeTabText]}>Inspo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Account' && styles.activeTab]} 
          onPress={() => setActiveTab('Account')}
        >
          <Text style={[styles.tabText, activeTab === 'Account' && styles.activeTabText]}>Account</Text>
        </TouchableOpacity>
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
    paddingBottom: 50,
    paddingTop: 15,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
});
