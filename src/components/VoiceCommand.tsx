import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { ELEVENLABS_API_KEY } from '@env';
import { askQuestion } from '../services/bedrock';

interface VoiceCommandProps {
  currentImage: string;
  voiceId?: string;
}

export default function VoiceCommand({ currentImage, voiceId = "pNInz6obpgDQGcFmaJgB" }: VoiceCommandProps) {
  const [isListening, setIsListening] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const startVoiceCommand = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow microphone access to use voice commands.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopVoiceCommand = async () => {
    if (!recording) return;

    setIsListening(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri && currentImage) {
      // Transcribe the recorded audio to text
      const userQuestion = await transcribeAudio(uri);
      
      if (userQuestion) {
        // Get AI advice based on user's question and photo
        const aiAdvice = await askQuestion(userQuestion, currentImage);
        
        // Convert AI advice to speech using ElevenLabs
        await textToSpeechWithElevenLabs(aiAdvice);
      }
    }
  };

  const transcribeAudio = async (audioUri: string): Promise<string> => {
    try {
      console.log('Skipping transcription, using default question');
      // For now, skip transcription and use a default question
      // The user can speak, but we'll use a generic photography question
      return "What can I improve about this photo?";
    } catch (error) {
      console.error('Transcription error:', error);
      return "What can I improve about this photo?";
    }
  };

  const textToSpeechWithElevenLabs = async (text: string) => {
    try {
      if (!text || text.trim().length === 0) {
        console.log('No text to speak');
        return;
      }
      
      console.log('Generating speech for AI advice:', text);
      console.log('ElevenLabs API Key:', ELEVENLABS_API_KEY?.substring(0, 10) + '...');
      console.log('Voice ID:', voiceId);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Convert to base64 in chunks to avoid stack overflow
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      const chunkSize = 8192;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode(...chunk);
      }
      
      const base64Audio = btoa(binaryString);
      const audioUri = `data:audio/mpeg;base64,${base64Audio}`;
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      console.log('AI advice audio playing...');
    } catch (error) {
      console.error('ElevenLabs text-to-speech error:', error);
      Alert.alert('Error', `Failed to generate voice advice: ${(error as Error).message}`);
    }
  };

  const toggleVoiceCommand = () => {
    if (isListening) {
      stopVoiceCommand();
    } else {
      startVoiceCommand();
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.aiButton, isListening && styles.listeningButton]} 
      onPress={toggleVoiceCommand}
    >
      <Text style={styles.buttonText}>{isListening ? 'STOP' : 'AI ADVICE'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  aiButton: {
    position: 'absolute',
    bottom: 140,
    right: 30,
    width: 70,
    height: 35,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  listeningButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
});