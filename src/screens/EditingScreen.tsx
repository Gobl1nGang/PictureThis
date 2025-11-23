import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Modal, ScrollView, Alert, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');

interface EditingScreenProps {
  route: {
    params: {
      photoUri: string;
    };
  };
  navigation: any;
}

export default function EditingScreen({ route, navigation }: EditingScreenProps) {
  const { photoUri } = route.params;

  // Editing values
  const [exposure, setExposure] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [whites, setWhites] = useState(0);
  const [blacks, setBlacks] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  const [vibrance, setVibrance] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [tint, setTint] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [vignette, setVignette] = useState(0);
  const [noiseReduction, setNoiseReduction] = useState(0);
  
  const [editedImageUri, setEditedImageUri] = useState(photoUri);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access to save');
        return;
      }
      
      const imageToSave = await captureEditedImage();
      await MediaLibrary.saveToLibraryAsync(imageToSave);
      Alert.alert('Success', 'Photo saved to gallery!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDiscard = () => {
    navigation.goBack();
  };

  const resetAll = () => {
    setExposure(0);
    setContrast(0);
    setHighlights(0);
    setShadows(0);
    setWhites(0);
    setBlacks(0);
    setSharpness(0);
    setVibrance(0);
    setSaturation(0);
    setTemperature(0);
    setTint(0);
    setClarity(0);
    setVignette(0);
    setNoiseReduction(0);
  };
  
  const captureEditedImage = async () => {
    // This would capture the filtered image for saving
    // For now, we'll save the original since capturing filtered images
    // requires additional setup with react-native-image-filter-kit
    return photoUri;
  };
  
  useEffect(() => {
    console.log('Filter values:', { exposure, contrast, saturation });
  }, [exposure, contrast, saturation]);

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard} style={styles.button}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Photo</Text>
        <TouchableOpacity onPress={handleSave} style={styles.button} disabled={isProcessing}>
          <Text style={[styles.buttonText, isProcessing && { opacity: 0.5 }]}>
            {isProcessing ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photoUri }}
            style={[
              styles.image,
              {
                opacity: Math.max(0.3, 1 + (exposure * 0.3)),
                transform: [
                  { 
                    scaleX: Math.max(0.8, 1 + (contrast * 0.002))
                  },
                  { 
                    scaleY: Math.max(0.8, 1 + (contrast * 0.002))
                  }
                ]
              }
            ]}
            resizeMode="contain"
            tintColor={saturation < -50 ? `rgba(128,128,128,${Math.abs(saturation) / 200})` : undefined}
          />
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
        <View style={styles.controlsHeader}>
          <Text style={styles.controlsTitle}>Editing Controls</Text>
          <TouchableOpacity onPress={resetAll} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Adjustments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic</Text>
          
          <View style={styles.control}>
            <Text style={styles.controlLabel}>Exposure</Text>
            <Slider
              style={styles.slider}
              minimumValue={-2}
              maximumValue={2}
              value={exposure}
              onValueChange={setExposure}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
              thumbTintColor="white"
            />
            <Text style={styles.value}>{exposure.toFixed(1)}</Text>
          </View>

          <View style={styles.control}>
            <Text style={styles.controlLabel}>Contrast</Text>
            <Slider
              style={styles.slider}
              minimumValue={-100}
              maximumValue={100}
              value={contrast}
              onValueChange={setContrast}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(contrast)}</Text>
          </View>

          <View style={styles.control}>
            <Text style={styles.controlLabel}>Highlights</Text>
            <Slider
              style={styles.slider}
              minimumValue={-100}
              maximumValue={100}
              value={highlights}
              onValueChange={setHighlights}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(highlights)}</Text>
          </View>

          <View style={styles.control}>
            <Text style={styles.controlLabel}>Shadows</Text>
            <Slider
              style={styles.slider}
              minimumValue={-100}
              maximumValue={100}
              value={shadows}
              onValueChange={setShadows}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(shadows)}</Text>
          </View>
        </View>

        {/* Tone Adjustments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tone</Text>
          
          <View style={styles.control}>
            <Text style={styles.controlLabel}>Whites</Text>
            <Slider
              style={styles.slider}
              minimumValue={-100}
              maximumValue={100}
              value={whites}
              onValueChange={setWhites}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(whites)}</Text>
          </View>

          <View style={styles.control}>
            <Text style={styles.controlLabel}>Blacks</Text>
            <Slider
              style={styles.slider}
              minimumValue={-100}
              maximumValue={100}
              value={blacks}
              onValueChange={setBlacks}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(blacks)}</Text>
          </View>
        </View>

        {/* Color Adjustments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color</Text>
          
          <View style={styles.control}>
            <Text style={styles.controlLabel}>Vibrance</Text>
            <Slider
              style={styles.slider}
              minimumValue={-100}
              maximumValue={100}
              value={vibrance}
              onValueChange={setVibrance}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(vibrance)}</Text>
          </View>

          <View style={styles.control}>
            <Text style={styles.controlLabel}>Saturation</Text>
            <Slider
              style={styles.slider}
              minimumValue={-100}
              maximumValue={100}
              value={saturation}
              onValueChange={setSaturation}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(saturation)}</Text>
          </View>

          <View style={styles.control}>
            <Text style={styles.controlLabel}>Temperature</Text>
            <Slider
              style={styles.slider}
              minimumValue={-100}
              maximumValue={100}
              value={temperature}
              onValueChange={setTemperature}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(temperature)}</Text>
          </View>

          <View style={styles.control}>
            <Text style={styles.controlLabel}>Tint</Text>
            <Slider
              style={styles.slider}
              minimumValue={-100}
              maximumValue={100}
              value={tint}
              onValueChange={setTint}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(tint)}</Text>
          </View>
        </View>

        {/* Detail Adjustments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detail</Text>
          
          <View style={styles.control}>
            <Text style={styles.controlLabel}>Sharpness</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={sharpness}
              onValueChange={setSharpness}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(sharpness)}</Text>
          </View>

          <View style={styles.control}>
            <Text style={styles.controlLabel}>Clarity</Text>
            <Slider
              style={styles.slider}
              minimumValue={-100}
              maximumValue={100}
              value={clarity}
              onValueChange={setClarity}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(clarity)}</Text>
          </View>

          <View style={styles.control}>
            <Text style={styles.controlLabel}>Noise Reduction</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={noiseReduction}
              onValueChange={setNoiseReduction}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(noiseReduction)}</Text>
          </View>
        </View>

        {/* Effects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Effects</Text>
          
          <View style={styles.control}>
            <Text style={styles.controlLabel}>Vignette</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={vignette}
              onValueChange={setVignette}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#333"
            />
            <Text style={styles.value}>{Math.round(vignette)}</Text>
          </View>
        </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  buttonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: width - 40,
    height: height * 0.5,
  },
  controls: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  controlsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  resetText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlLabel: {
    color: 'white',
    fontSize: 14,
    width: 80,
    fontWeight: '500',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 15,
  },

  value: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    width: 35,
    textAlign: 'right',
    fontWeight: '500',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});