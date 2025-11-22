import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyzeReferencePhoto } from '../services/analysisService';
import { ReferenceAnalysis } from '../types';

interface AnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ visible, onClose, imageUri }) => {
  const [analysis, setAnalysis] = useState<ReferenceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeReferencePhoto(imageUri);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAnalysis(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Photo Analysis</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {!analysis && !loading && (
            <View style={styles.startContainer}>
              <Text style={styles.startText}>Analyze this photo to understand its composition, lighting, and style</Text>
              <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
                <Text style={styles.analyzeButtonText}>Analyze Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Analyzing photo...</Text>
            </View>
          )}

          {analysis && (
            <ScrollView style={styles.analysisContainer}>
              <View style={styles.analysisItem}>
                <Text style={styles.label}>Type</Text>
                <Text style={styles.value}>{analysis.pictureType}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.label}>Style</Text>
                <Text style={styles.value}>{analysis.style}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.label}>Subject</Text>
                <Text style={styles.value}>{analysis.subject}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.label}>Composition</Text>
                <Text style={styles.value}>{analysis.composition}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.label}>Lighting</Text>
                <Text style={styles.value}>{analysis.lighting}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.label}>Lens</Text>
                <Text style={styles.value}>{analysis.lens}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.label}>Color Tone</Text>
                <Text style={styles.value}>{analysis.colorTone}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.label}>Summary</Text>
                <Text style={styles.value}>{analysis.summary}</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  startContainer: {
    padding: 20,
    alignItems: 'center',
  },
  startText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  analysisContainer: {
    padding: 20,
  },
  analysisItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});