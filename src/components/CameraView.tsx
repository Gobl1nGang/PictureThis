
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform, Image, Dimensions, Alert, Modal, ScrollView, SafeAreaView, TouchableWithoutFeedback } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { analyzeImage } from '../services/bedrock';
import { analyzePhotoForEditing } from '../services/editingAnalysis';
import { useReferencePhoto, ReferenceAnalysisModal } from '../features/reference-photo';
import { StyleSuggestionModal } from './StyleSuggestionModal';
import EditingScreen from '../screens/EditingScreen';

const { width, height } = Dimensions.get('window');

declare global {
  var referenceImageUri: string | null;
}

export default function AppCamera() {
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [feedback, setFeedback] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [zoom, setZoom] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const lastAnalysisTime = useRef<number>(0);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Reference photo functionality
  const { referencePhoto, isAnalyzing, setReference, clearReference } = useReferencePhoto();
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);

  // Photo thumbnail preview
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [showThumbnail, setShowThumbnail] = useState(false);
  
  // Editing screen
  const [showEditingScreen, setShowEditingScreen] = useState(false);
  const [editingPhotoUri, setEditingPhotoUri] = useState<string | null>(null);
  
  // Debug editing screen state changes
  useEffect(() => {
    console.log('showEditingScreen changed to:', showEditingScreen);
    if (showEditingScreen) {
      console.log('Editing screen opened with URI:', editingPhotoUri);
    }
  }, [showEditingScreen, editingPhotoUri]);

  useEffect(() => {
    if (permission?.granted) {
      requestMediaPermission();

      // Check for reference image from other screens
      if (global.referenceImageUri) {
        setReference(global.referenceImageUri);
        setShowAnalysisModal(true);
        global.referenceImageUri = null; // Clear after use
      }
    }
  }, [permission, setReference]);

  const toggleGrid = () => setShowGrid(!showGrid);

  const toggleFlash = () => {
    setEnableTorch(current => !current);
  };

  // Manual analysis trigger
  const handleGetFeedback = async () => {
    await analyzeScene();
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const analyzeScene = async () => {
    if (cameraRef.current && isCameraReady) {
      lastAnalysisTime.current = Date.now();
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
          skipProcessing: true,
        });

        if (photo?.uri) {
          const manipResult = await manipulateAsync(
            photo.uri,
            [{ resize: { width: 480 } }],
            { compress: 0.5, format: SaveFormat.JPEG, base64: true }
          );

          if (manipResult.base64) {
            const rawAdvice = await analyzeImage(manipResult.base64);

            try {
              const text = rawAdvice.trim();
              let newScore = 0;
              let newFeedback: string[] = [];

              // Extract Score
              const scoreMatch = text.match(/Score:\s*(\d+)/i);
              if (scoreMatch) {
                newScore = parseInt(scoreMatch[1], 10);
              }

              // Extract Feedback
              const feedbackMatch = text.match(/Feedback:\s*(.+)/is);
              if (feedbackMatch) {
                const feedbackText = feedbackMatch[1];
                newFeedback = feedbackText.split(/\.|,|\n/)
                  .map(s => s.trim())
                  .filter(s => s.length > 2) // Filter out tiny noise
                  .slice(0, 2);
              } else {
                // Fallback if "Feedback:" keyword is missing, treat whole text as feedback
                newFeedback = text.split(/\.|,|\n/)
                  .map(s => s.trim())
                  .filter(s => s.length > 2)
                  .slice(0, 2);
              }

              setScore(newScore);

              if (newScore >= 90 || text.toUpperCase().includes("PERFECT SHOT")) {
                setFeedback(["PERFECT SHOT!", "Take the picture!"]);
              } else {
                setFeedback(newFeedback.length > 0 ? newFeedback : ["Analyzing..."]);
              }

            } catch (e) {
              console.log("Analysis Parse Error:", e, "Raw:", rawAdvice);
              setFeedback(["Hold steady..."]);
            }
          }
        }
      } catch (error) {
        // Ignore capture errors (common when camera is initializing or busy)
      }
    }
  }

  const takeHighResPicture = async () => {
    console.log('takeHighResPicture called');
    
    if (!cameraRef.current) {
      console.log('No camera ref');
      return;
    }
    
    if (!isCameraReady) {
      console.log('Camera not ready yet');
      Alert.alert('Camera Loading', 'Please wait for camera to initialize');
      return;
    }
    
    try {
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        skipProcessing: false,
      });
      
      console.log('Photo taken:', photo?.uri);

      if (photo?.uri) {
        console.log('Setting thumbnail...');
        // Show thumbnail preview
        setLastPhotoUri(photo.uri);
        setShowThumbnail(true);
        
        // Hide thumbnail after 3 seconds
        setTimeout(() => setShowThumbnail(false), 3000);
      } else {
        console.log('No photo URI');
      }
    } catch (error) {
      console.log('Error taking picture:', error);
      Alert.alert("Error", "Failed to take photo.");
    }
  };



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
          zoom={zoom}
          autofocus="on"
          onCameraReady={() => {
            console.log('Camera ready');
            setIsCameraReady(true);
          }}
        />

        {/* Rule of Thirds Grid */}
        <View style={styles.gridContainer} pointerEvents="none">
          <View style={[styles.gridLineVertical, { left: width / 3 }]} />
          <View style={[styles.gridLineVertical, { left: width * 2 / 3 }]} />
          <View style={[styles.gridLineHorizontal, { top: height / 3 }]} />
          <View style={[styles.gridLineHorizontal, { top: height * 2 / 3 }]} />
        </View>

        <View style={styles.overlay}>
          {/* Top Bar: Score & Style */}
          <View style={styles.topBar}>
            <View style={styles.topRow}>
              <TouchableOpacity 
                style={styles.styleSuggestionButton} 
                onPress={() => setShowStyleModal(true)}
              >
                <Text style={styles.styleSuggestionText}>
                  {style || (referencePhoto ? 'Photo Referenced' : 'Style Suggestion')}
                </Text>
              </TouchableOpacity>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Score</Text>
                <Text style={[styles.scoreValue, { color: score > 80 ? '#4CD964' : score > 50 ? '#FFCC00' : '#FF3B30' }]}>
                  {score}
                </Text>
              </View>
              <View style={styles.adviceContainer}>
                {feedback.map((item, index) => (
                  <Text key={index} style={styles.adviceText}>{item}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Manual Feedback Button - Placed above bottom controls */}
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={handleGetFeedback}
            disabled={isAnalyzing}
          >
            <Ionicons name="sparkles" size={24} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.feedbackButtonText}>
              {isAnalyzing ? "Analyzing..." : "Get Feedback"}
            </Text>
          </TouchableOpacity>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <View style={styles.spacer} />

            <View style={styles.shutterContainer}>
              <TouchableOpacity
                style={styles.shutterButton}
                onPress={takeHighResPicture}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={32} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Photo Thumbnail Preview */}
          {showThumbnail && lastPhotoUri && (
            <TouchableOpacity 
              style={styles.thumbnailContainer}
              onPress={() => {
                console.log('Navigate to editing screen with:', lastPhotoUri);
                setEditingPhotoUri(lastPhotoUri);
                setShowEditingScreen(true);
              }}
            >
              <Image source={{ uri: lastPhotoUri }} style={styles.thumbnail} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Reference Analysis Modal */}
      <Modal
        visible={showAnalysisModal}
        analysis={referencePhoto?.analysis || null}
        isAnalyzing={isAnalyzing}
        onClose={() => setShowAnalysisModal(false)}
      />

      {/* Style Suggestion Modal */}
      <StyleSuggestionModal
        visible={showStyleModal}
        onClose={() => setShowStyleModal(false)}
        onStyleSelected={setStyle}
      />
      
      {/* Editing Screen Modal */}
      {showEditingScreen && editingPhotoUri && (
        <EditingScreen
          route={{ params: { photoUri: editingPhotoUri } }}
          navigation={{ goBack: () => setShowEditingScreen(false) }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  permButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
  },
  permText: {
    color: 'white',
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  uiContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  referenceIndicator: {
    position: 'absolute',
    top: 80,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#4CD964',
    backgroundColor: '#000',
  },
  referenceThumbnail: {
    width: '100%',
    height: '100%',
  },
  referenceLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(76, 217, 100, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 2,
  },
  referenceLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  gridLineVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridLineHorizontal: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  styleSuggestionButton: {
    height: 40,
    width: width * 0.5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  styleSuggestionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.3)',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  adviceContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  adviceText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  bottomControls: {
    paddingBottom: 50,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  spacer: {
    width: 50,
  },
  shutterContainer: {
    borderWidth: 4,
    borderColor: 'white',
    borderRadius: 42,
    padding: 4,
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'black',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackButton: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  feedbackButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
  },
  referenceImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    marginBottom: 20,
  },
  referenceImage: {
    width: '100%',
    height: '100%',
  },
  analysisDetails: {
    padding: 20,
    paddingTop: 0,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  analysisValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  summarySection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  analysisText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  thumbnailContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
});


