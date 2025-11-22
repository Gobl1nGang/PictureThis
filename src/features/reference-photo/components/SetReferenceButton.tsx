import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

export const SetReferenceButton: React.FC<Props> = ({ onPress, disabled = false }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, disabled && styles.disabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name="camera" size={20} color="white" />
      <Text style={styles.text}>Set Reference</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,122,255,0.9)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabled: {
    backgroundColor: 'rgba(128,128,128,0.5)',
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});