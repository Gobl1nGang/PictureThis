import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onExit: () => void;
}

export const ReferenceModeIndicator: React.FC<Props> = ({ onExit }) => {
  return (
    <TouchableOpacity style={styles.indicator} onPress={onExit}>
      <Text style={styles.text}>📸 Reference Mode</Text>
      <Text style={styles.subtext}>Tap to exit</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: 'rgba(0,122,255,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  subtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
});