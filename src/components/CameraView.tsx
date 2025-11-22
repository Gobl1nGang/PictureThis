
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform, Dimensions, Alert, TouchableWithoutFeedback } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { analyzeImage } from '../services/bedrock';
import { useReferencePhoto, ReferenceAnalysisModal } from '../features/reference-photo';

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
  const [style, setStyle] = useState<string>("");
  const [isLooping, setIsLooping] = useState(false);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const lastAnalysisTime = useRef<number>(0);

  // Reference photo functionality
  const { referencePhoto, isAnalyzing, setReference } = useReferencePhoto();
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLooping) {
      interval = setInterval(async () => {
        const now = Date.now();
        if (now - lastAnalysisTime.current > 2000) {
          await analyzeScene();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLooping, style]);

  useEffect(() => {
    if (permission?.granted) {
      setIsLooping(true);
      requestMediaPermission();

      // Check for reference image from other screens
      if (global.referenceImageUri) {
        setReference(global.referenceImageUri);
        setShowAnalysisModal(true);
        global.referenceImageUri = null; // Clear after use
      }
    }
  }, [permission, setReference]);

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
            const rawAdvice = await analyzeImage(manipResult.base64, style);

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
        // console.log("Silent analysis error:", error);
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
              <TextInput
                style={styles.styleInput}
                placeholder="Style..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={style}
                onChangeText={setStyle}
              />
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>PRO SCORE</Text>
                <Text style={[styles.scoreValue, { color: score > 80 ? '#4CD964' : score > 50 ? '#FFCC00' : '#FF3B30' }]}>
                  {score}
                </Text>
              </View>
            </View>

            {/* Feedback at the TOP */}
            <View style={styles.feedbackArea}>
              {feedback.map((item, index) => (
                <View key={index} style={styles.bubble}>
                  <Text style={styles.bubbleText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
              <Text style={styles.iconText}>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shutterButton} onPress={takeHighResPicture}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            {/* Zoom Control (Simple Toggle for now) */}
            <TouchableOpacity style={styles.iconButton} onPress={() => setZoom(z => z === 0 ? 0.01 : 0)}>
              <Text style={styles.iconText}>{zoom === 0 ? "1x" : "2x"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Reference Analysis Modal */}
      <ReferenceAnalysisModal
        visible={showAnalysisModal}
        analysis={referencePhoto?.analysis || null}
        isAnalyzing={isAnalyzing}
        onClose={() => setShowAnalysisModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
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
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    // flexDirection: 'row', // Removed as lines are positioned absolutely
    // flexWrap: 'wrap', // Removed
    // justifyContent: 'center', // Removed
    // alignItems: 'center', // Removed
    pointerEvents: 'none', // Ensure it doesn't block touches
  },
  gridLineVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    // left: '33.33%', // Handled dynamically in JSX
  },
  gridLineHorizontal: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    // top: '33.33%', // Handled dynamically in JSX
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: 20,
    // alignItems: 'center', // Removed
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  styleInput: {
    height: 40,
    width: width * 0.5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    paddingHorizontal: 15,
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  feedbackArea: {
    // flex: 1, // Removed
    // justifyContent: 'center', // Removed
    alignItems: 'center',
    // paddingHorizontal: 40, // Removed
    marginTop: 10,
  },
  bubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    // shadowColor: "#000", // Removed
    // shadowOffset: { width: 0, height: 4 }, // Removed
    // shadowOpacity: 0.3, // Removed
    // shadowRadius: 4.65, // Removed
    // elevation: 8, // Removed
    // transform: [{ scale: 1 }], // Removed
  },
  // perfectBubble: { // Removed
  //   backgroundColor: '#4CD964', // Green
  //   transform: [{ scale: 1.1 }],
  // },
  bubbleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // perfectText: { // Removed
  //   color: 'white',
  //   fontWeight: 'bold',
  // },
  bottomBar: {
    paddingBottom: 50,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#333',
  },
});

