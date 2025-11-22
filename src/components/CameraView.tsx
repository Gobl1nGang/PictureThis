
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions, Alert, Modal, ScrollView, SafeAreaView } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { analyzeImage } from '../services/bedrock';
import { useReferencePhoto } from '../features/reference-photo';
import { Ionicons } from '@expo/vector-icons';

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
  const cameraRef = useRef<CameraView>(null);

  // Reference photo functionality
  const { referencePhoto, isAnalyzing, setReference } = useReferencePhoto();
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

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
    if (cameraRef.current) {
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
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1.0,
          skipProcessing: false,
        });

        if (photo?.uri) {
          const asset = await MediaLibrary.createAssetAsync(photo.uri);
          const album = await MediaLibrary.getAlbumAsync('PictureThis');

          if (album == null) {
            await MediaLibrary.createAlbumAsync('PictureThis', asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }

          Alert.alert("Saved!", "Photo saved to PictureThis album.");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to save photo.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        zoom={zoom}
        autofocus="on"
      >
        <SafeAreaView style={styles.uiContainer}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity onPress={toggleGrid} style={styles.iconButton}>
              <Ionicons name={showGrid ? "grid" : "grid-outline"} size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="flash-off" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Grid Overlay */}
          {showGrid && (
            <View style={styles.gridContainer} pointerEvents="none">
              <View style={[styles.gridLineVertical, { left: width / 3 }]} />
              <View style={[styles.gridLineVertical, { left: width * 2 / 3 }]} />
              <View style={[styles.gridLineHorizontal, { top: height / 3 }]} />
              <View style={[styles.gridLineHorizontal, { top: height * 2 / 3 }]} />
            </View>
          )}

          {/* AI Feedback Overlay - Persistent */}
          {feedback.length > 0 && (
            <View style={styles.feedbackContainer}>
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
            <TouchableOpacity style={styles.galleryButton}>
              <View style={styles.galleryPreview} />
            </TouchableOpacity>

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

      {/* Reference Analysis Modal */}
      <Modal
        visible={showAnalysisModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reference Analysis</Text>
            <TouchableOpacity onPress={() => setShowAnalysisModal(false)}>
              <Ionicons name="close" size={28} color="black" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.analysisText}>{referencePhoto?.analysis?.summary || "No analysis available."}</Text>
          </ScrollView>
        </View>
      </Modal>
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
    padding: 20,
    paddingTop: 10,
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
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 3,
  },
  galleryPreview: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#333',
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  analysisText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});


