import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StyleSuggestionModalProps {
  visible: boolean;
  onClose: () => void;
  onStyleSelected: (style: string) => void;
}

export const StyleSuggestionModal: React.FC<StyleSuggestionModalProps> = ({ 
  visible, 
  onClose, 
  onStyleSelected 
}) => {
  const [manualStyle, setManualStyle] = useState('');

  const handleManualStyle = () => {
    if (manualStyle.trim()) {
      onStyleSelected(manualStyle.trim());
      setManualStyle('');
      onClose();
    }
  };

  const handlePhotoReference = () => {
    console.log('Photo reference clicked, global.referenceImageUri:', global.referenceImageUri);
    if (global.referenceImageUri) {
      console.log('Setting style to Photo Referenced');
      onStyleSelected('Photo Referenced');
      onClose();
    } else {
      console.log('No reference photo found');
      Alert.alert(
        'No Reference Photo', 
        'Please set a reference photo in Photos or Inspo tab first.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Style Suggestion</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.option} onPress={handlePhotoReference}>
              <Ionicons name="image" size={24} color="#007AFF" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Photo Reference</Text>
                <Text style={styles.optionSubtitle}>Use uploaded reference photo</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.manualOption}>
              <View style={styles.manualHeader}>
                <Ionicons name="create" size={24} color="#007AFF" />
                <Text style={styles.optionTitle}>Manual Style</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Cinematic, Portrait, Minimalist..."
                value={manualStyle}
                onChangeText={setManualStyle}
                onSubmitEditing={handleManualStyle}
              />
              <TouchableOpacity 
                style={[styles.submitButton, !manualStyle.trim() && styles.disabledButton]} 
                onPress={handleManualStyle}
                disabled={!manualStyle.trim()}
              >
                <Text style={styles.submitButtonText}>Apply Style</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsContainer: {
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 16,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  manualOption: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});