import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { ReferenceAnalysis } from '../types';

interface Props {
  visible: boolean;
  analysis: ReferenceAnalysis | null;
  isAnalyzing: boolean;
  onClose: () => void;
  onStartCoaching: () => void;
  onContinueWithoutCoaching: () => void;
}

export const ReferenceAnalysisModal: React.FC<Props> = ({ 
  visible, 
  analysis, 
  isAnalyzing,
  onClose, 
  onStartCoaching,
  onContinueWithoutCoaching
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modal}>
          <Text style={styles.title}>Reference Analysis</Text>
          
          {isAnalyzing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Analyzing reference photo...</Text>
            </View>
          ) : analysis ? (
            <>
              <View style={styles.content}>
                <AnalysisRow label="Style" value={analysis.style} />
                <AnalysisRow label="Subject" value={analysis.subject} />
                <AnalysisRow label="Composition" value={analysis.composition} />
                <AnalysisRow label="Lighting" value={analysis.lighting} />
                <AnalysisRow label="Lens" value={analysis.lens} />
                <AnalysisRow label="Color Tone" value={analysis.colorTone} />
                
                <View style={styles.summarySection}>
                  <Text style={styles.summaryTitle}>What to look for:</Text>
                  <Text style={styles.summaryText}>{analysis.summary}</Text>
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={onStartCoaching}
                >
                  <Text style={styles.startButtonText}>Start Live Coaching</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={onContinueWithoutCoaching}
                >
                  <Text style={styles.continueButtonText}>Continue Without Coaching</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to analyze reference photo</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const AnalysisRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
    width: '90%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  summarySection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  continueButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});