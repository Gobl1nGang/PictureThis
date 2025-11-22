import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

interface EditingPopupProps {
  visible: boolean;
  onClose: () => void;
  suggestions: string;
  isAnalyzing: boolean;
  photoUri: string | null;
  onEditPhoto: (uri: string) => void;
}

export function EditingPopup({ visible, onClose, suggestions, isAnalyzing, photoUri, onEditPhoto }: EditingPopupProps) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    console.log('EditingPopup visible changed:', visible);
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      
      // Auto-hide after 6 seconds for debugging
      const timer = setTimeout(() => {
        hidePopup();
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hidePopup = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  console.log('EditingPopup render - visible:', visible, 'suggestions:', suggestions);

  if (!visible) return null;

  const handleEditPhoto = () => {
    if (photoUri) {
      onEditPhoto(photoUri);
      hidePopup();
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={handleEditPhoto}
      style={[
        styles.popup,
        {
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>✨ Editing Suggestions</Text>
          <TouchableOpacity onPress={hidePopup} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.suggestions}>
          {isAnalyzing ? 'Analyzing your photo...' : suggestions}
        </Text>
        
        {!isAnalyzing && (
          <Text style={styles.tapHint}>Tap to edit photo</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1000,
    elevation: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  suggestions: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  tapHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});