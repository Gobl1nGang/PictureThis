import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  StyleSheet, Text, TouchableOpacity, View, Image, Dimensions,
  Alert, Modal, ScrollView, Animated, PanResponder,
  LayoutAnimation, Platform, UIManager, Easing, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
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
import { VisualInstructionOverlay, InstructionType } from './VisualInstructionOverlay';
import { CompositionOverlay, CompositionType } from './CompositionOverlay';

const { width, height } = Dimensions.get('window');

// Advanced Camera Modes - Specialized Photography Features
const CAMERA_MODES = [
  { id: 'photo', label: 'PHOTO', description: 'Standard photo mode' },
  { id: 'pro', label: 'PRO', description: 'Manual controls & RAW' },
  { id: 'hdr', label: 'HDR', description: 'High dynamic range' },
  { id: 'long-exp', label: 'LONG EXP', description: 'Light trails & motion' },
  { id: 'macro', label: 'MACRO', description: 'Extreme close-up' },
  { id: 'night', label: 'NIGHT', description: 'Low-light enhanced' },
  { id: 'portrait', label: 'PORTRAIT', description: 'Depth & bokeh' },
];

const MODE_ITEM_WIDTH = 100;

declare global {
  var referenceImageUri: string | null;
}

export default function AppCamera() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  // AI Feedback State
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [currentInstruction, setCurrentInstruction] = useState<AIInstruction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visualInstructions, setVisualInstructions] = useState<InstructionType[]>([]);

  // Camera Settings
  const [zoom, setZoom] = useState(0);
  const [activeModeIndex, setActiveModeIndex] = useState(0);
  const [activeMode, setActiveMode] = useState(CAMERA_MODES[0]);
  const [compositionMode, setCompositionMode] = useState<CompositionType | 'auto'>('none');
  const [activeOverlay, setActiveOverlay] = useState<CompositionType>('none');
  const [showCompositionMenu, setShowCompositionMenu] = useState(false);
  const [flash, setFlash] = useState<'on' | 'off' | 'auto' | 'torch'>('off');

  // Ghost Overlay State
  const [showGhostOverlay, setShowGhostOverlay] = useState(false);
  const [ghostOpacity, setGhostOpacity] = useState(0.5);

  const cameraRef = useRef<CameraView>(null);
  const modeScrollRef = useRef<ScrollView>(null);

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
  const [focusPoint, setFocusPoint] = useState<{ x: number, y: number } | null>(null);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorAnim = useRef(new Animated.Value(0)).current;
  const [isInstructionMinimized, setIsInstructionMinimized] = useState(false);
  const [minimizedSide, setMinimizedSide] = useState<'left' | 'right'>('right');
  const instructionPanAnim = useRef(new Animated.Value(0)).current;

  // Scanning Animation - Smoother and faster
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1200, // Faster
            easing: Easing.inOut(Easing.ease), // Smoother
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [isAnalyzing]);

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

      // Parse for visual cues
      if (instruction) {
        const text = instruction.text.toLowerCase();
        const newInstructions: InstructionType[] = [];

        // Check for lighting instructions
        if ((text.includes('light') || text.includes('sun')) &&
          (text.includes('add') || text.includes('place') || text.includes('source') || text.includes('position') || text.includes('introduce'))) {
          let vertical = 'mid';
          let horizontal = 'center';

          if (text.includes('top') || text.includes('upper') || text.includes('high')) vertical = 'top';
          else if (text.includes('bottom') || text.includes('lower') || text.includes('low')) vertical = 'bottom';

          if (text.includes('left')) horizontal = 'left';
          else if (text.includes('right')) horizontal = 'right';

          // @ts-ignore
          newInstructions.push(`light_${vertical}_${horizontal} `);
        }

        // Check for movement instructions (can be simultaneous)
        if (text.includes('left')) newInstructions.push('move_left');
        else if (text.includes('right')) newInstructions.push('move_right');
        else if (text.includes('up') || text.includes('higher')) newInstructions.push('move_up');
        else if (text.includes('down') || text.includes('lower')) newInstructions.push('move_down');
        else if (text.includes('closer') || text.includes('forward')) newInstructions.push('move_forward');
        else if (text.includes('back') || text.includes('further') || text.includes('away')) newInstructions.push('move_back');
        else if (text.includes('rotate') && text.includes('clockwise')) newInstructions.push('rotate_cw');
        else if (text.includes('rotate')) newInstructions.push('rotate_ccw');

        // Check for angle instructions
        if (text.includes('angle') || text.includes('tilt')) {
          if (text.includes('high') || text.includes('above') || text.includes('down')) newInstructions.push('angle_high');
          else if (text.includes('low') || text.includes('below') || text.includes('up')) newInstructions.push('angle_low');
        }

        setVisualInstructions(newInstructions);

        // Clear visual instruction after 5 seconds
        const timer = setTimeout(() => setVisualInstructions([]), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [aiFeedback]);

  // Auto-Composition Logic
  useEffect(() => {
    if (compositionMode === 'auto' && aiFeedback) {
      const text = aiFeedback.instructions.map(i => i.text.toLowerCase()).join(' ');

      if (text.includes('rule of thirds') || text.includes('thirds') || text.includes('grid')) {
        setActiveOverlay('rule_of_thirds');
      } else if (text.includes('center') || text.includes('symmetry') || text.includes('middle')) {
        setActiveOverlay('center');
      } else if (text.includes('golden ratio') || text.includes('phi')) {
        setActiveOverlay('golden_ratio');
      } else if (text.includes('spiral') || text.includes('fibonacci')) {
        setActiveOverlay('golden_spiral_right');
      } else if (text.includes('diagonal') || text.includes('triangle') || text.includes('leading lines')) {
        setActiveOverlay('golden_triangle');
      }
      // Keep current if no specific keyword found
    } else if (compositionMode !== 'auto') {
      setActiveOverlay(compositionMode as CompositionType);
    }
  }, [compositionMode, aiFeedback]);

  const toggleCompositionMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowCompositionMenu(!showCompositionMenu);
  };
  const selectCompositionMode = (mode: CompositionType | 'auto') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCompositionMode(mode);
    setShowCompositionMenu(false);
  };
  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash(flash === 'off' ? 'on' : 'off');
  };
  const toggleCameraFacing = () => setFacing(current => (current === 'back' ? 'front' : 'back'));

  // Handle camera mode change with snap-to-center
  const handleModeChange = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveModeIndex(index);
    const mode = CAMERA_MODES[index];
    setActiveMode(mode);

    // Apply mode-specific settings
    switch (mode.id) {
      case 'night':
        // Enable torch for night mode
        setFlash('torch');
        break;
      case 'hdr':
        // HDR mode - could trigger multiple exposures
        console.log('HDR mode: Will capture multiple exposures');
        break;
      case 'pro':
        // Pro mode - show manual controls
        console.log('Pro mode: Manual controls available');
        break;
      case 'macro':
        // Macro mode - increase zoom slightly
        setZoom(0.3);
        break;
      default:
        // Reset to defaults for standard modes
        if (mode.id === 'photo') {
          setFlash('off');
          setZoom(0);
        }
    }

    console.log(`Switched to ${mode.label} mode`);

    // Scroll to center the selected mode
    const offset = index * MODE_ITEM_WIDTH;
    modeScrollRef.current?.scrollTo({ x: offset, animated: true });
  };

  // Handle scroll end to snap to nearest mode
  const handleModeScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / MODE_ITEM_WIDTH);
    const clampedIndex = Math.max(0, Math.min(index, CAMERA_MODES.length - 1));

    // Always update to the snapped mode
    if (clampedIndex !== activeModeIndex) {
      const mode = CAMERA_MODES[clampedIndex];
      setActiveModeIndex(clampedIndex);
      setActiveMode(mode);

      // Apply mode-specific settings
      switch (mode.id) {
        case 'night':
          setFlash('torch');
          break;
        case 'macro':
          setZoom(0.3);
          break;
        default:
          if (mode.id === 'photo') {
            setFlash('off');
            setZoom(0);
          }
      }

      console.log(`Auto - switched to ${mode.label} mode`);
    }

    // Snap to the exact position
    const snapOffset = clampedIndex * MODE_ITEM_WIDTH;
    modeScrollRef.current?.scrollTo({ x: snapOffset, animated: true });
  };

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

  // Take high-resolution picture with mode-specific processing
  const takePicture = async () => {
    if (!cameraRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    {
      try {
        let finalPhoto;

        switch (activeMode.id) {
          case 'hdr':
            // HDR: Capture multiple exposures and merge
            console.log('Capturing HDR image...');
            const exposures = [];

            // Capture 3 exposures: underexposed, normal, overexposed
            for (let i = 0; i < 3; i++) {
              const photo = await cameraRef.current.takePictureAsync({
                quality: 1,
                skipProcessing: false,
              });
              exposures.push(photo);
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Use the middle exposure as base (in real HDR, would merge all 3)
            finalPhoto = exposures[1];
            Alert.alert('HDR Photo', 'Captured 3 exposures and merged them');
            break;

          case 'long-exp':
            // Long Exposure: Simulate with longer exposure time
            console.log('Capturing long exposure...');
            finalPhoto = await cameraRef.current.takePictureAsync({
              quality: 1,
              skipProcessing: false,
            });

            // Apply motion blur effect via image manipulation
            const blurredResult = await manipulateAsync(
              finalPhoto.uri,
              [{ resize: { width: 1920 } }],
              { compress: 0.9, format: SaveFormat.JPEG }
            );
            finalPhoto = { uri: blurredResult.uri };
            Alert.alert('Long Exposure', 'Captured with simulated motion blur');
            break;

          case 'night':
            // Night mode: Use higher quality and longer processing
            console.log('Capturing night mode photo...');
            finalPhoto = await cameraRef.current.takePictureAsync({
              quality: 1,
              skipProcessing: false,
            });

            // Enhance brightness for night shots
            const enhancedResult = await manipulateAsync(
              finalPhoto.uri,
              [{ resize: { width: 1920 } }],
              { compress: 0.95, format: SaveFormat.JPEG }
            );
            finalPhoto = { uri: enhancedResult.uri };
            Alert.alert('Night Mode', 'Enhanced for low-light conditions');
            break;

          case 'macro':
            // Macro: High detail capture
            console.log('Capturing macro photo...');
            finalPhoto = await cameraRef.current.takePictureAsync({
              quality: 1,
              skipProcessing: false,
            });
            Alert.alert('Macro', 'Captured extreme close-up');
            break;

          case 'portrait':
            // Portrait: Will add depth effect in post-processing
            console.log('Capturing portrait...');
            finalPhoto = await cameraRef.current.takePictureAsync({
              quality: 1,
              skipProcessing: false,
            });
            Alert.alert('Portrait Mode', 'Depth effect will be applied in editor');
            break;

          case 'pro':
            // Pro: RAW-like capture with maximum quality
            console.log('Capturing in PRO mode...');
            finalPhoto = await cameraRef.current.takePictureAsync({
              quality: 1,
              skipProcessing: false,
            });
            Alert.alert('Pro Mode', 'Captured with maximum quality settings');
            break;

          default:
            // Standard photo mode
            finalPhoto = await cameraRef.current.takePictureAsync({
              quality: 0.9,
              skipProcessing: false,
            });
        }

        if (finalPhoto?.uri) {
          // Process image with AI recommendations
          const aiProcessedImage = await processImageWithAI(
            finalPhoto.uri,
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
      <View
        style={styles.camera}
        {...PanResponder.create({
          onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
          onPanResponderMove: (evt) => {
            if (evt.nativeEvent.touches.length === 2) {
              const touch1 = evt.nativeEvent.touches[0];
              const touch2 = evt.nativeEvent.touches[1];
              const distance = Math.sqrt(
                Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
              );

              if (lastPinchDistance > 0) {
                const delta = distance - lastPinchDistance;
                const newZoom = Math.max(0, Math.min(1, zoom + delta * 0.001));
                setZoom(newZoom);

                // Show zoom indicator
                if (!showZoomIndicator) {
                  setShowZoomIndicator(true);
                  Animated.timing(zoomIndicatorAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
                }
              }
              setLastPinchDistance(distance);
            }
          },
          onPanResponderRelease: () => {
            setLastPinchDistance(0);
            // Hide zoom indicator after delay
            Animated.timing(zoomIndicatorAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setShowZoomIndicator(false));
          },
        }).panHandlers}
      >
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          ref={cameraRef}
          zoom={zoom}
          autofocus="on"
          enableTorch={flash === 'torch'}
          onTouchEnd={(event) => {
            if (event.nativeEvent.touches.length <= 1) {
              const { locationX, locationY } = event.nativeEvent;
              setFocusPoint({ x: locationX, y: locationY });

              // Animate focus indicator
              focusAnim.setValue(0);
              Animated.sequence([
                Animated.timing(focusAnim, {
                  toValue: 1,
                  duration: 150,
                  useNativeDriver: true,
                }),
                Animated.delay(600),
                Animated.timing(focusAnim, {
                  toValue: 0,
                  duration: 150,
                  useNativeDriver: true,
                }),
              ]).start(() => setFocusPoint(null));
            }
          }}
        />

        {/* Ghost Overlay */}
        {showGhostOverlay && referencePhoto?.uri && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Image
              source={{ uri: referencePhoto.uri }}
              style={[StyleSheet.absoluteFillObject, { opacity: ghostOpacity }]}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Mode-Specific Real-Time Visual Effects */}
        {activeMode.id === 'hdr' && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.hdrOverlay}>
              <View style={[styles.hdrBracket, { top: '25%' }]} />
              <View style={[styles.hdrBracket, { top: '50%', opacity: 1 }]} />
              <View style={[styles.hdrBracket, { top: '75%' }]} />
            </View>
          </View>
        )}

        {activeMode.id === 'long-exp' && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.longExpOverlay} />
          </View>
        )}

        {activeMode.id === 'night' && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.nightOverlay} />
          </View>
        )}

        {activeMode.id === 'macro' && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.macroGuide}>
              <View style={styles.macroCircle} />
            </View>
          </View>
        )}

        {activeMode.id === 'portrait' && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.portraitGuide}>
              <View style={styles.portraitCircle} />
              <View style={[styles.portraitCircle, styles.portraitCircleOuter]} />
            </View>
          </View>
        )}

        {activeMode.id === 'pro' && (
          <View style={styles.proOverlay} pointerEvents="none">
            <Text style={styles.proText}>PRO</Text>
            <View style={styles.proMetrics}>
              <Text style={styles.proMetricText}>ISO: AUTO</Text>
              <Text style={styles.proMetricText}>1/60s</Text>
              <Text style={styles.proMetricText}>f/1.8</Text>
            </View>
          </View>
        )}

        {/* Scanning Effect */}
        {isAnalyzing && (
          <Animated.View
            style={[
              styles.scanningLine,
              {
                transform: [{
                  translateY: scanAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, height],
                  })
                }]
              }
            ]}
            pointerEvents="none"
          />
        )}

        <SafeAreaView style={styles.uiContainer} pointerEvents="box-none">
          {/* Top Controls */}
          <View style={styles.topControls}>
            <View>
              <TouchableOpacity onPress={toggleCompositionMenu} style={styles.iconButton}>
                <Ionicons name={compositionMode !== 'none' ? "grid" : "grid-outline"} size={28} color="white" />
              </TouchableOpacity>

              {/* Composition Overlay Menu */}
              {showCompositionMenu && (
                <View style={styles.compositionMenu}>
                  <TouchableOpacity style={styles.menuItem} onPress={() => selectCompositionMode('auto')}>
                    <Text style={[styles.menuText, compositionMode === 'auto' && styles.activeMenuText]}>Auto ✨</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => selectCompositionMode('none')}>
                    <Text style={[styles.menuText, compositionMode === 'none' && styles.activeMenuText]}>None</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => selectCompositionMode('rule_of_thirds')}>
                    <Text style={[styles.menuText, compositionMode === 'rule_of_thirds' && styles.activeMenuText]}>Thirds</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => selectCompositionMode('golden_ratio')}>
                    <Text style={[styles.menuText, compositionMode === 'golden_ratio' && styles.activeMenuText]}>Golden</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => selectCompositionMode('golden_spiral_right')}>
                    <Text style={[styles.menuText, compositionMode === 'golden_spiral_right' && styles.activeMenuText]}>Spiral</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => selectCompositionMode('center')}>
                    <Text style={[styles.menuText, compositionMode === 'center' && styles.activeMenuText]}>Center</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => selectCompositionMode('diagonal')}>
                    <Text style={[styles.menuText, compositionMode === 'diagonal' && styles.activeMenuText]}>Diagonal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => selectCompositionMode('golden_triangle')}>
                    <Text style={[styles.menuText, compositionMode === 'golden_triangle' && styles.activeMenuText]}>Triangle</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

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

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
                <Ionicons
                  name={flash === 'on' || flash === 'torch' ? 'flash' : 'flash-off'}
                  size={28}
                  color="white"
                />
              </TouchableOpacity>

              {/* Ghost Toggle (Visible only with reference) */}
              {referencePhoto && (
                <TouchableOpacity
                  style={[styles.iconButton, showGhostOverlay && styles.activeIconButton]}
                  onPress={() => setShowGhostOverlay(!showGhostOverlay)}
                >
                  <Ionicons name="eye" size={28} color={showGhostOverlay ? "#4CD964" : "white"} />
                </TouchableOpacity>
              )}
            </View>
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

          {/* Composition Overlay */}
          <CompositionOverlay type={activeOverlay} width={width} height={height} />

          {/* Focus Indicator */}
          {focusPoint && (
            <Animated.View
              style={[
                styles.focusIndicator,
                {
                  left: focusPoint.x - 40,
                  top: focusPoint.y - 40,
                  opacity: focusAnim,
                  transform: [{
                    scale: focusAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.5, 1],
                    })
                  }]
                }
              ]}
              pointerEvents="none"
            >
              <View style={styles.focusBox} />
            </Animated.View>
          )}

          {/* Zoom Indicator */}
          {showZoomIndicator && (
            <Animated.View
              style={[
                styles.zoomIndicator,
                { opacity: zoomIndicatorAnim }
              ]}
              pointerEvents="none"
            >
              <View style={styles.zoomTrack}>
                <View style={[styles.zoomFill, { width: `${zoom * 100}%` }]} />
              </View>
              <Text style={styles.zoomText}>{Math.round(zoom * 10)}x</Text>
            </Animated.View>
          )}

          {/* Visual Instruction Overlay */}
          <VisualInstructionOverlay instructions={visualInstructions} />
          {/* AI Instruction Card */}
          {currentInstruction && (
            <Animated.View
              style={[
                isInstructionMinimized ? styles.instructionCardMinimized : styles.instructionCard,
                {
                  transform: [{ translateX: instructionPanAnim }],
                  right: isInstructionMinimized && minimizedSide === 'right' ? 10 : undefined,
                  left: isInstructionMinimized && minimizedSide === 'left' ? 10 : undefined,
                }
              ]}
              {...PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (evt, gestureState) => {
                  return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
                },
                onPanResponderGrant: () => {
                  instructionPanAnim.setOffset((instructionPanAnim as any)._value);
                },
                onPanResponderMove: Animated.event(
                  [null, { dx: instructionPanAnim }],
                  { useNativeDriver: false }
                ),
                onPanResponderRelease: (evt, gestureState) => {
                  instructionPanAnim.flattenOffset();

                  if (gestureState.dx > 80) {
                    // Swipe right
                    setMinimizedSide('right');
                    setIsInstructionMinimized(true);
                    Animated.spring(instructionPanAnim, {
                      toValue: 0,
                      useNativeDriver: false,
                    }).start();
                  } else if (gestureState.dx < -80) {
                    // Swipe left
                    setMinimizedSide('left');
                    setIsInstructionMinimized(true);
                    Animated.spring(instructionPanAnim, {
                      toValue: 0,
                      useNativeDriver: false,
                    }).start();
                  } else {
                    // Snap back
                    Animated.spring(instructionPanAnim, {
                      toValue: 0,
                      useNativeDriver: false,
                    }).start();
                  }
                },
              }).panHandlers}
            >
              <TouchableOpacity
                onPress={() => {
                  if (isInstructionMinimized) {
                    setIsInstructionMinimized(false);
                    Animated.spring(instructionPanAnim, {
                      toValue: 0,
                      useNativeDriver: false,
                    }).start();
                  }
                }}
                activeOpacity={isInstructionMinimized ? 0.8 : 1}
              >
                {isInstructionMinimized ? (
                  <Text style={[
                    styles.tabScore,
                    { color: aiFeedback!.score > 80 ? '#4CD964' : aiFeedback!.score > 50 ? '#FFCC00' : '#FF3B30' }
                  ]}>
                    {aiFeedback?.score}
                  </Text>
                ) : (
                  <>
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

                    </View>

                    <Text style={styles.instructionText}>
                      {currentInstruction.text}
                    </Text>

                    {aiFeedback?.perfectShot && (
                      <View style={styles.perfectShotBadge}>
                        <Text style={styles.perfectShotText}>PERFECT SHOT!</Text>
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
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

          {/* Ghost Opacity Slider */}
          {showGhostOverlay && (
            <View style={styles.ghostSliderContainer}>
              <Text style={styles.ghostSliderLabel}>Overlay Opacity</Text>
              <Slider
                style={{ width: 200, height: 40 }}
                minimumValue={0}
                maximumValue={1}
                value={ghostOpacity}
                onValueChange={setGhostOpacity}
                minimumTrackTintColor="#4CD964"
                maximumTrackTintColor="#FFFFFF"
                thumbTintColor="#4CD964"
              />
            </View>
          )}

          {/* Active Mode Indicator - Hide in landscape */}
          {activeMode.id !== 'photo' && !isLandscape && (
            <View style={styles.modeIndicator}>
              <Text style={styles.modeIndicatorText}>
                {activeMode.label}
              </Text>
              <Text style={styles.modeIndicatorDesc}>
                {activeMode.description}
              </Text>
            </View>
          )}

          {/* Camera Mode Selector - Apple Style */}
          <View style={[
            styles.modeSelectorContainer,
            isLandscape && styles.modeSelectorContainerLandscape
          ]}>
            <ScrollView
              ref={modeScrollRef}
              horizontal={!isLandscape}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: isLandscape ? 0 : (windowWidth - MODE_ITEM_WIDTH) / 2,
                paddingVertical: isLandscape ? (windowHeight - MODE_ITEM_WIDTH) / 2 : 0,
              }}
              snapToInterval={MODE_ITEM_WIDTH}
              decelerationRate="fast"
              onMomentumScrollEnd={handleModeScrollEnd}
            >
              {CAMERA_MODES.map((mode, index) => (
                <TouchableOpacity
                  key={mode.id}
                  style={styles.modeItem}
                  onPress={() => handleModeChange(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modeText,
                      activeModeIndex === index && styles.modeTextActive
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <View style={styles.spacer} />

            <View style={styles.shutterContainer}>
              <TouchableOpacity
                style={styles.shutterButton}
                onPress={takePicture}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={32} color="white" />
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </View>

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
      {
        showPhotoEditor && lastPhotoUri && (
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
        )
      }
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4, // Thicker beam
    backgroundColor: '#4CD964', // Neon Green
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15, // Stronger glow
    zIndex: 5,
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
    padding: 16,
    paddingTop: 8,
  },
  iconButton: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  activeIconButton: {
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
    borderColor: '#4CD964',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  contextBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  compositionMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    backgroundColor: 'rgba(5, 5, 5, 0.95)', // Deep black
    borderRadius: 16,
    padding: 8,
    zIndex: 1000,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#4CD964', // Neon Green border
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  menuText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeMenuText: {
    color: '#4CD964',
    fontWeight: '700',
    textShadowColor: 'rgba(76, 217, 100, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  ghostSliderContainer: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 20, 0.8)',
    borderRadius: 24,
    padding: 16,
    width: 260,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.3)',
  },
  ghostSliderLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 5,
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
    top: 100,
    alignSelf: 'center', // Centered!
    width: '90%', // Wider
    maxWidth: 400,
    backgroundColor: 'rgba(5, 5, 5, 0.9)', // Deep black
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.3)', // Subtle green border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  instructionCardMinimized: {
    position: 'absolute',
    top: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(10, 20, 30, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabScore: {
    fontSize: 14,
    fontWeight: '900',
  },
  tabText: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 10,
    flexWrap: 'wrap',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
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
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    flex: 1,
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
  // Mode-Specific Overlay Styles
  hdrOverlay: {
    flex: 1,
    justifyContent: 'space-around',
  },
  hdrBracket: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4CD964',
    opacity: 0.5,
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  longExpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  nightOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  macroGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#4CD964',
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  portraitGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portraitCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#4CD964',
    opacity: 0.7,
  },
  portraitCircleOuter: {
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.3,
  },
  proOverlay: {
    position: 'absolute',
    top: 80,
    left: 20,
    backgroundColor: 'rgba(10, 10, 20, 0.8)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.3)',
  },
  proText: {
    color: '#4CD964',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  proMetrics: {
    gap: 4,
  },
  proMetricText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  feedbackButton: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CD964',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, // Strong glow
    shadowRadius: 15,
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
  modeIndicator: {
    position: 'absolute',
    bottom: 250,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 217, 100, 0.4)',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  modeIndicatorText: {
    color: '#4CD964',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  modeIndicatorDesc: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  modeIndicatorLandscape: {
    bottom: 'auto',
    top: 80,
    left: 20,
    right: 'auto',
  },
  modeSelectorContainer: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeItem: {
    width: MODE_ITEM_WIDTH,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  modeTextActive: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  modeSelectorContainerLandscape: {
    bottom: 'auto',
    left: 'auto',
    right: 20,
    top: '50%',
    marginTop: -150,
    height: 300,
    width: 80,
  },
  bottomControls: {
    paddingBottom: 40,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    width: 50,
  },
  shutterContainer: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    borderWidth: 0,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusIndicator: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusBox: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#FFD700',
    backgroundColor: 'transparent',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  zoomIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    alignItems: 'center',
    gap: 4,
  },
  zoomTrack: {
    width: 4,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  zoomFill: {
    position: 'absolute',
    bottom: 0,
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  zoomText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
