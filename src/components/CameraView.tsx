import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, Image, Dimensions,
  Alert, Modal, ScrollView, SafeAreaView, Animated
} from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { analyzeImage, AnalyzeImageOptions } from '../services/bedrock';
import { processImageWithAI, AIProcessedImage } from '../services/aiImageProcessor';
import { useReferencePhoto } from '../features/reference-photo';
import { useUserProfile } from '../contexts/UserProfileContext';
import { usePhotoContext } from '../contexts/PhotoContextContext';
import InstructionEngine from '../features/camera/InstructionEngine';
import ContextSelector from './ContextSelector';
import PhotoEditor from '../screens/PhotoEditor';
import { Ionicons } from '@expo/vector-icons';
import { AIFeedback, AIInstruction } from '../types/index';

const { width, height } = Dimensions.get('window');

declare global {
  var referenceImageUri: string | null;
}

export default function AppCamera() {
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  // AI Feedback State
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [currentInstruction, setCurrentInstruction] = useState<AIInstruction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Camera Settings
  const [zoom, setZoom] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Context and Profile
  const { profile } = useUserProfile();
  const { currentContext, addReferencePhoto } = usePhotoContext();
  const { referencePhoto, setReference, clearReference } = useReferencePhoto();

  // UI State
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showContextSelector, setShowContextSelector] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [lastAIProcessedImage, setLastAIProcessedImage] = useState<AIProcessedImage | null>(null);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const thumbnailAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission?.granted) {
      requestMediaPermission();

      // Check for reference image from other screens
      if (global.referenceImageUri) {
        setReference(global.referenceImageUri);
        setShowAnalysisModal(true);
        global.referenceImageUri = null;
      }
    }
  }, [permission, setReference]);

  // Sync reference photo to context
  useEffect(() => {
    if (referencePhoto) {
      addReferencePhoto(referencePhoto);
    }
  }, [referencePhoto]);

  // Update current instruction when feedback changes
  useEffect(() => {
    if (aiFeedback) {
      const instruction = InstructionEngine.getPriorityInstruction(aiFeedback);
      setCurrentInstruction(instruction);
    }
  }, [aiFeedback]);

  const toggleGrid = () => setShowGrid(!showGrid);
  const toggleFlash = () => setEnableTorch(current => !current);
  const toggleCameraFacing = () => setFacing(current => (current === 'back' ? 'front' : 'back'));

  // Analyze scene with context awareness
  const analyzeScene = async () => {
    if (cameraRef.current || isAnalyzing) {
      setIsAnalyzing(true);
      try {
        const photo = await cameraRef.current!.takePictureAsync({
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
            // Build options from profile and context
            const options: AnalyzeImageOptions = {
              userSkillLevel: profile?.skillLevel || 'Intermediate',
              preferredStyle: profile?.preferredStyles[0] || 'General Professional',
              contextType: currentContext?.type,
              timeOfDay: currentContext?.timeOfDay,
              environment: currentContext?.environment,
            };

            // Add reference photo if available
            if (referencePhoto?.uri) {
              try {
                const refManipResult = await manipulateAsync(
                  referencePhoto.uri,
                  [{ resize: { width: 480 } }],
                  { compress: 0.5, format: SaveFormat.JPEG, base64: true }
                );
                if (refManipResult.base64) {
                  options.referencePhotoBase64 = refManipResult.base64;
                  if (referencePhoto.analysis) {
                    options.referenceAnalysis = JSON.stringify(referencePhoto.analysis);
                  }
                }
              } catch (error) {
                console.log('Error processing reference photo:', error);
              }
            }

            const rawAdvice = await analyzeImage(manipResult.base64, options);

            try {
              const text = rawAdvice.trim();
              let score = 0;

              // Extract Score
              const scoreMatch = text.match(/Score:\s*(\d+)/i);
              if (scoreMatch) {
                score = parseInt(scoreMatch[1], 10);
              }

              // Parse into structured instructions
              const feedback = InstructionEngine.parseInstructions(text, score);
              setAiFeedback(feedback);

            } catch (e) {
              console.log("Analysis Parse Error:", e, "Raw:", rawAdvice);
              setAiFeedback({
                score: 0,
                instructions: [{
                  id: 'default',
                  step: 1,
                  totalSteps: 1,
                  text: 'Hold steady...',
                  category: 'composition',
                  priority: 'medium',
                }],
                perfectShot: false,
                timestamp: Date.now(),
              });
            }
          }
        }
      } catch (error) {
        console.log('Analysis error:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  // Take high-res picture with AI enhancement
  const takeHighResPicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1.0,
          skipProcessing: false,
        });

        if (photo?.uri) {
          // Process image with AI recommendations
          const aiProcessedImage = await processImageWithAI(
            photo.uri,
            currentContext?.type,
            {
              colorGrading: profile?.editingPreferences.preferredColorGrading,
              style: profile?.preferredStyles[0],
            }
          );

          // Use the AI-enhanced image
          setLastPhotoUri(aiProcessedImage.enhancedUri);
          setLastAIProcessedImage(aiProcessedImage);
          setShowThumbnail(true);

          Animated.sequence([
            Animated.timing(thumbnailAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(2500),
            Animated.timing(thumbnailAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => setShowThumbnail(false));

          // Save the AI-enhanced image
          const asset = await MediaLibrary.createAssetAsync(aiProcessedImage.enhancedUri);
          const album = await MediaLibrary.getAlbumAsync('PictureThis');

          if (album == null) {
            await MediaLibrary.createAlbumAsync('PictureThis', asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }

          Alert.alert("Saved!", "AI-enhanced photo saved to PictureThis album.");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to save photo.");
      }
    }
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

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        zoom={zoom}
        autofocus="on"
        enableTorch={enableTorch}
      >
        <SafeAreaView style={styles.uiContainer}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity onPress={toggleGrid} style={styles.iconButton}>
              <Ionicons name={showGrid ? "grid" : "grid-outline"} size={28} color="white" />
            </TouchableOpacity>

            {/* Context Badge */}
            <TouchableOpacity
              style={styles.contextBadge}
              onPress={() => setShowContextSelector(true)}
            >
              <Text style={styles.contextBadgeText}>
                {currentContext?.type || 'Set Context'} • {currentContext?.timeOfDay || 'Auto'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
              <Ionicons
                name={enableTorch ? "flash" : "flash-off"}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {/* Reference Photo Indicator */}
          {referencePhoto && (
            <TouchableOpacity
              style={styles.referenceIndicator}
              onPress={() => setShowAnalysisModal(true)}
              onLongPress={() => {
                Alert.alert(
                  "Clear Reference",
                  "Remove the current reference photo?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear",
                      style: "destructive",
                      onPress: () => clearReference()
                    }
                  ]
                );
              }}
            >
              <Image
                source={{ uri: referencePhoto.uri }}
                style={styles.referenceThumbnail}
              />
              <View style={styles.referenceLabel}>
                <Ionicons name="image" size={12} color="white" />
                <Text style={styles.referenceLabelText}>REF</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Grid Overlay */}
          {showGrid && (
            <View style={styles.gridContainer} pointerEvents="none">
              <View style={[styles.gridLineVertical, { left: width / 3 }]} />
              <View style={[styles.gridLineVertical, { left: width * 2 / 3 }]} />
              <View style={[styles.gridLineHorizontal, { top: height / 3 }]} />
              <View style={[styles.gridLineHorizontal, { top: height * 2 / 3 }]} />
            </View>
          )}

          {/* AI Instruction Card */}
          {currentInstruction && (
            <View style={styles.instructionCard}>
              <View style={styles.instructionHeader}>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>Score</Text>
                  <Text style={[
                    styles.scoreValue,
                    { color: aiFeedback!.score > 80 ? '#4CD964' : aiFeedback!.score > 50 ? '#FFCC00' : '#FF3B30' }
                  ]}>
                    {aiFeedback?.score}
                  </Text>
                </View>
                <View style={styles.progressDots}>
                  {aiFeedback?.instructions.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        idx === currentInstruction.step - 1 && styles.dotActive
                      ]}
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.instructionText}>
                {currentInstruction.text}
              </Text>

              {aiFeedback?.perfectShot && (
                <View style={styles.perfectShotBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CD964" />
                  <Text style={styles.perfectShotText}>PERFECT SHOT!</Text>
                </View>
              )}
            </View>
          )}

          {/* Manual Feedback Button */}
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={analyzeScene}
            disabled={isAnalyzing}
          >
            <Ionicons name="sparkles" size={24} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.feedbackButtonText}>
              {isAnalyzing ? "Analyzing..." : "Get Feedback"}
            </Text>
          </TouchableOpacity>

          {/* Photo Thumbnail Preview */}
          {showThumbnail && lastPhotoUri && (
            <Animated.View
              style={[
                styles.thumbnailPreview,
                {
                  opacity: thumbnailAnim,
                  transform: [{
                    scale: thumbnailAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity onPress={() => setShowPhotoEditor(true)}>
                <Image source={{ uri: lastPhotoUri }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            </Animated.View>
          )}

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

        </SafeAreaView>
      </CameraView>

      {/* Context Selector Modal */}
      <ContextSelector
        visible={showContextSelector}
        onClose={() => setShowContextSelector(false)}
      />

      {/* Reference Analysis Modal */}
      <Modal
        visible={showAnalysisModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reference Photo Analysis</Text>
            <TouchableOpacity onPress={() => setShowAnalysisModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {referencePhoto?.uri && (
              <View style={styles.referenceImageContainer}>
                <Image
                  source={{ uri: referencePhoto.uri }}
                  style={styles.referenceImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {referencePhoto?.analysis && (
              <View style={styles.analysisDetails}>
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Type</Text>
                  <Text style={styles.analysisValue}>{referencePhoto.analysis.pictureType}</Text>
                </View>

                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Style</Text>
                  <Text style={styles.analysisValue}>{referencePhoto.analysis.style}</Text>
                </View>

                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Subject</Text>
                  <Text style={styles.analysisValue}>{referencePhoto.analysis.subject}</Text>
                </View>

                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Composition</Text>
                  <Text style={styles.analysisValue}>{referencePhoto.analysis.composition}</Text>
                </View>

                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Lighting</Text>
                  <Text style={styles.analysisValue}>{referencePhoto.analysis.lighting}</Text>
                </View>

                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Lens</Text>
                  <Text style={styles.analysisValue}>{referencePhoto.analysis.lens}</Text>
                </View>

                <View style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>Color Tone</Text>
                  <Text style={styles.analysisValue}>{referencePhoto.analysis.colorTone}</Text>
                </View>

                <View style={styles.summarySection}>
                  <Text style={styles.summaryLabel}>Summary</Text>
                  <Text style={styles.summaryText}>{referencePhoto.analysis.summary}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Photo Editor Modal */}
      {showPhotoEditor && lastPhotoUri && (
        <Modal
          visible={showPhotoEditor}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowPhotoEditor(false)}
        >
          <PhotoEditor
            imageUri={lastPhotoUri}
            aiProcessedImage={lastAIProcessedImage}
            onClose={() => setShowPhotoEditor(false)}
            onSave={(editedUri) => {
              setLastPhotoUri(editedUri);
              setShowPhotoEditor(false);
            }}
          />
        </Modal>
      )}
    </View>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  contextBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
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
  instructionCard: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
  },
  perfectShotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  perfectShotText: {
    color: '#4CD964',
    fontSize: 16,
    fontWeight: 'bold',
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
  thumbnailPreview: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  bottomControls: {
    paddingBottom: 50,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
