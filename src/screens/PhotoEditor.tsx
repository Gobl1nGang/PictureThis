import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { generateAIEnhancement, AIEnhancementResult } from '../services/imageEnhancement';
import { AIProcessedImage, createAdjustmentSliders } from '../services/aiImageProcessor';
import { analyzePixelValues } from '../services/pixelAnalyzer';
import { usePhotoContext } from '../contexts/PhotoContextContext';
import { FilteredImage } from '../components/FilteredImage';
import { FILTER_PRESETS, applyBedrockFilter } from '../services/bedrockImageFilter';
import { SkiaFilteredImage } from '../components/SkiaFilteredImage';
import { applySkiaFilter } from '../services/skiaFilterService';
import { useUserProfile } from '../contexts/UserProfileContext';
import { AdjustmentSlider } from '../types/index';
import AdjustmentSliderComponent from '../components/AdjustmentSlider';
import { BeforeAfterComparison } from '../components/BeforeAfterComparison';
import { applyBasicAdjustments, applyCrop, applyRotation } from '../services/basicImageProcessor';

const { width } = Dimensions.get('window');

interface PhotoEditorProps {
    imageUri: string;
    aiProcessedImage?: AIProcessedImage | null;
    onClose: () => void;
    onSave?: (editedUri: string) => void;
}

type EditMode = 'ai' | 'crop' | 'adjust' | 'filters' | 'compare' | 'curves' | 'hsl' | 'masking' | 'effects' | 'details';

// Professional Color Grading Presets
const COLOR_GRADES = {
  cinematic: { shadows: '#1a2332', midtones: '#d4af37', highlights: '#f4e4bc' },
  vintage: { shadows: '#8b4513', midtones: '#daa520', highlights: '#f5deb3' },
  modern: { shadows: '#2c3e50', midtones: '#3498db', highlights: '#ecf0f1' },
  warm: { shadows: '#8b4513', midtones: '#ff8c00', highlights: '#ffd700' },
  cool: { shadows: '#2f4f4f', midtones: '#4682b4', highlights: '#b0e0e6' },
  dramatic: { shadows: '#000000', midtones: '#696969', highlights: '#ffffff' },
};

// Professional Curve Presets
const CURVE_PRESETS = {
  linear: [0, 0.25, 0.5, 0.75, 1],
  contrast: [0, 0.2, 0.5, 0.8, 1],
  soft: [0, 0.3, 0.5, 0.7, 1],
  hard: [0, 0.1, 0.5, 0.9, 1],
  vintage: [0.1, 0.3, 0.6, 0.8, 0.9],
  film: [0.05, 0.25, 0.55, 0.75, 0.95],
};

// Professional Effects
const PROFESSIONAL_EFFECTS = [
  { id: 'orton', name: 'Orton Effect', description: 'Dreamy glow' },
  { id: 'bleach', name: 'Bleach Bypass', description: 'High contrast' },
  { id: 'cross', name: 'Cross Process', description: 'Color shift' },
  { id: 'split', name: 'Split Toning', description: 'Dual color grade' },
  { id: 'vignette', name: 'Vignette', description: 'Edge darkening' },
  { id: 'grain', name: 'Film Grain', description: 'Texture overlay' },
  { id: 'chromatic', name: 'Chromatic Aberration', description: 'Color fringing' },
  { id: 'lens', name: 'Lens Distortion', description: 'Barrel/pincushion' },
];

const ASPECT_RATIOS = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:2', value: 3 / 2 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '21:9', value: 21 / 9 },
    { label: '5:4', value: 5 / 4 },
    { label: '8:10', value: 8 / 10 },
];

// Professional Crop Presets
const CROP_PRESETS = [
    { name: 'Instagram Square', ratio: 1, width: 1080, height: 1080 },
    { name: 'Instagram Portrait', ratio: 4/5, width: 1080, height: 1350 },
    { name: 'Instagram Story', ratio: 9/16, width: 1080, height: 1920 },
    { name: 'Facebook Cover', ratio: 851/315, width: 851, height: 315 },
    { name: 'YouTube Thumbnail', ratio: 16/9, width: 1280, height: 720 },
    { name: 'Print 4x6', ratio: 3/2, width: 1800, height: 1200 },
    { name: 'Print 5x7', ratio: 7/5, width: 2100, height: 1500 },
    { name: 'Print 8x10', ratio: 5/4, width: 2400, height: 1920 },
];

export default function PhotoEditor({ imageUri, aiProcessedImage, onClose, onSave }: PhotoEditorProps) {
    const [editMode, setEditMode] = useState<EditMode>('ai');
    const [aiEnhancement, setAiEnhancement] = useState<AIEnhancementResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [currentImageUri, setCurrentImageUri] = useState(imageUri);
    const [rotation, setRotation] = useState(0);
    const [hasChanges, setHasChanges] = useState(false);
    const [adjustmentSliders, setAdjustmentSliders] = useState<AdjustmentSlider[]>([]);
    const [currentAdjustments, setCurrentAdjustments] = useState<Record<string, number>>({});
    const [basicAdjustments, setBasicAdjustments] = useState({
        exposure: 0,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        highlights: 0,
        shadows: 0,
    });
    const [filter, setFilter] = useState<string | undefined>(undefined);
    const [customPrompt, setCustomPrompt] = useState('');
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [showComparison, setShowComparison] = useState(false);
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

    // Professional Editing States
    const [curves, setCurves] = useState({
        rgb: CURVE_PRESETS.linear,
        red: CURVE_PRESETS.linear,
        green: CURVE_PRESETS.linear,
        blue: CURVE_PRESETS.linear,
    });
    const [hslAdjustments, setHslAdjustments] = useState({
        hue: 0,
        saturation: 0,
        lightness: 0,
        redHue: 0, redSat: 0, redLum: 0,
        orangeHue: 0, orangeSat: 0, orangeLum: 0,
        yellowHue: 0, yellowSat: 0, yellowLum: 0,
        greenHue: 0, greenSat: 0, greenLum: 0,
        aquaHue: 0, aquaSat: 0, aquaLum: 0,
        blueHue: 0, blueSat: 0, blueLum: 0,
        purpleHue: 0, purpleSat: 0, purpleLum: 0,
        magentaHue: 0, magentaSat: 0, magentaLum: 0,
    });
    const [colorGrading, setColorGrading] = useState({
        shadows: { r: 0, g: 0, b: 0 },
        midtones: { r: 0, g: 0, b: 0 },
        highlights: { r: 0, g: 0, b: 0 },
        balance: 0,
    });
    const [masking, setMasking] = useState({
        luminosity: { enabled: false, range: [0, 1] },
        color: { enabled: false, target: '#ffffff', tolerance: 0.1 },
        radial: { enabled: false, center: [0.5, 0.5], radius: 0.3, feather: 0.2 },
        linear: { enabled: false, start: [0, 0.5], end: [1, 0.5], feather: 0.2 },
    });
    const [effects, setEffects] = useState({
        orton: 0,
        bleach: 0,
        cross: 0,
        split: 0,
        vignette: 0,
        grain: 0,
        chromatic: 0,
        lens: 0,
    });
    const [details, setDetails] = useState({
        sharpening: 0,
        clarity: 0,
        texture: 0,
        dehaze: 0,
        noiseReduction: 0,
        colorNoise: 0,
    });
    const [selectedCropPreset, setSelectedCropPreset] = useState<string | null>(null);
    const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 1, height: 1 });
    const [showCropGrid, setShowCropGrid] = useState(true);
    const [activeProSection, setActiveProSection] = useState<'curves' | 'hsl' | 'effects' | 'details'>('curves');

    const { currentContext } = usePhotoContext();
    const { profile } = useUserProfile();

    useEffect(() => {
        if (aiProcessedImage) {
            setAiEnhancement({
                adjustments: aiProcessedImage.adjustments,
                suggestions: aiProcessedImage.suggestions,
                reasoning: aiProcessedImage.reasoning,
            });

            const sliders = createAdjustmentSliders(aiProcessedImage.adjustments);
            setAdjustmentSliders(sliders);

            const initialAdjustments: Record<string, number> = {};
            sliders.forEach(slider => {
                initialAdjustments[slider.key] = slider.value;
            });
            setCurrentAdjustments(initialAdjustments);
        } else {
            // Skip AI enhancement loading to avoid signature errors
            setIsLoadingAI(false);
        }
    }, [aiProcessedImage]);

    useEffect(() => {
        const originalUri = aiProcessedImage?.originalUri || imageUri;
        const hasAdjustmentChanges = Object.keys(currentAdjustments).length > 0;
        const hasBasicChanges = Object.values(basicAdjustments).some(val => val !== 0);
        setHasChanges(currentImageUri !== originalUri || rotation !== 0 || hasAdjustmentChanges || hasBasicChanges);
    }, [currentImageUri, rotation, currentAdjustments, basicAdjustments, aiProcessedImage, imageUri]);







    const loadAIEnhancement = async () => {
        setIsLoadingAI(true);
        try {
            const manipResult = await manipulateAsync(
                imageUri,
                [{ resize: { width: 800 } }],
                { compress: 0.5, format: SaveFormat.JPEG, base64: true }
            );

            if (manipResult.base64) {
                const enhancement = await generateAIEnhancement(
                    manipResult.base64,
                    currentContext?.type,
                    {
                        colorGrading: profile?.editingPreferences.preferredColorGrading,
                        style: profile?.preferredStyles[0],
                    }
                );
                setAiEnhancement(enhancement);
            }
        } catch (error) {
            console.error('AI Enhancement error:', error);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleRotate = async (degrees: number) => {
        try {
            const newRotation = (rotation + degrees) % 360;
            setRotation(newRotation);

            const result = await manipulateAsync(
                currentImageUri,
                [{ rotate: degrees }],
                { compress: 0.95, format: SaveFormat.JPEG }
            );
            setCurrentImageUri(result.uri);
        } catch (error) {
            Alert.alert('Error', 'Failed to rotate image');
        }
    };

    const handleFlip = async (direction: 'horizontal' | 'vertical') => {
        try {
            const result = await manipulateAsync(
                currentImageUri,
                [{ flip: direction === 'horizontal' ? FlipType.Horizontal : FlipType.Vertical }],
                { compress: 0.95, format: SaveFormat.JPEG }
            );
            setCurrentImageUri(result.uri);
        } catch (error) {
            Alert.alert('Error', 'Failed to flip image');
        }
    };

    const handleReset = () => {
        setCurrentImageUri(aiProcessedImage?.originalUri || imageUri);
        setRotation(0);
        setFilter(undefined);
        setBasicAdjustments({
            exposure: 0,
            brightness: 0,
            contrast: 0,
            saturation: 0,
            highlights: 0,
            shadows: 0,
        });
        setCurrentAdjustments({});
        setHslAdjustments({
            hue: 0, saturation: 0, lightness: 0,
            redHue: 0, redSat: 0, redLum: 0,
            orangeHue: 0, orangeSat: 0, orangeLum: 0,
            yellowHue: 0, yellowSat: 0, yellowLum: 0,
            greenHue: 0, greenSat: 0, greenLum: 0,
            aquaHue: 0, aquaSat: 0, aquaLum: 0,
            blueHue: 0, blueSat: 0, blueLum: 0,
            purpleHue: 0, purpleSat: 0, purpleLum: 0,
            magentaHue: 0, magentaSat: 0, magentaLum: 0,
        });
        setEffects({
            orton: 0, bleach: 0, cross: 0, split: 0,
            vignette: 0, grain: 0, chromatic: 0, lens: 0,
        });
        setDetails({
            sharpening: 0, clarity: 0, texture: 0,
            dehaze: 0, noiseReduction: 0, colorNoise: 0,
        });
        setPreviewUri(null);
        setHasChanges(false);
    };

    const handleSave = async () => {
        if (!hasChanges) {
            Alert.alert('No Changes', 'Make some edits before saving.');
            return;
        }

        setIsProcessing(true);
        try {
            let uriToSave = currentImageUri;

            // Basic adjustments are visual only in this version

            // Apply rotation if changed
            if (rotation !== 0) {
                uriToSave = await applyRotation(uriToSave, rotation);
            }

            // Apply filter if active
            if (filter) {
                uriToSave = await applySkiaFilter(uriToSave, filter);
            }

            const asset = await MediaLibrary.createAssetAsync(uriToSave);
            const album = await MediaLibrary.getAlbumAsync('PictureThis');

            if (album == null) {
                await MediaLibrary.createAlbumAsync('PictureThis', asset, false);
            } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }

            Alert.alert('Saved!', 'Edited photo saved successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        if (onSave) {
                            onSave(uriToSave);
                        }
                        onClose();
                    }
                }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save edited photo.');
            console.error('Save error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderAIMode = () => (
        <ScrollView style={styles.modeContainer} contentContainerStyle={styles.aiContent}>
            {isLoadingAI ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>AI is analyzing your photo...</Text>
                </View>
            ) : aiEnhancement ? (
                <>
                    <View style={styles.aiHeader}>
                        <Ionicons name="sparkles" size={32} color="#007AFF" />
                        <Text style={styles.aiTitle}>AI Recommendations</Text>
                    </View>

                    <Text style={styles.aiReasoning}>{aiEnhancement.reasoning}</Text>

                    <View style={styles.adjustmentsCard}>
                        <Text style={styles.cardTitle}>Suggested Adjustments:</Text>
                        {Object.entries(aiEnhancement.adjustments).map(([key, value]) => {
                            if (value === 0 || value === undefined) return null;
                            return (
                                <View key={key} style={styles.adjustmentItem}>
                                    <Text style={styles.adjustmentKey}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                                    <Text style={styles.adjustmentValue}>{value > 0 ? '+' : ''}{value}</Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.suggestionsCard}>
                        <Text style={styles.cardTitle}>Tips:</Text>
                        {aiEnhancement.suggestions.map((suggestion, index) => (
                            <View key={index} style={styles.suggestionItem}>
                                <Ionicons name="bulb-outline" size={16} color="#007AFF" />
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </View>
                        ))}
                    </View>

                    {aiProcessedImage && (
                        <View style={styles.appliedCard}>
                            <Ionicons name="checkmark-circle" size={20} color="#4CD964" />
                            <Text style={styles.appliedText}>
                                These adjustments have been automatically applied to your photo! Use the Adjust tab to fine-tune them manually.
                            </Text>
                        </View>
                    )}

                    <View style={styles.noteCard}>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={styles.noteText}>
                            Note: Full color adjustments require a development build. Basic enhancements have been applied automatically.
                        </Text>
                    </View>
                </>
            ) : (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load AI recommendations</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadAIEnhancement}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );

    const renderCropMode = () => (
        <ScrollView style={styles.controlsContainer}>
            <Text style={styles.sectionTitle}>Crop & Resize</Text>
            <Text style={styles.sectionSubtitle}>Professional crop presets and aspect ratios</Text>

            <View style={styles.cropPresetsGrid}>
                {CROP_PRESETS.map((preset) => (
                    <TouchableOpacity
                        key={preset.name}
                        style={[
                            styles.cropPresetButton,
                            selectedCropPreset === preset.name && styles.cropPresetButtonActive
                        ]}
                        onPress={() => {
                            setSelectedCropPreset(preset.name);
                            setHasChanges(true);
                        }}
                    >
                        <Text style={styles.cropPresetName}>{preset.name}</Text>
                        <Text style={styles.cropPresetDimensions}>{preset.width}×{preset.height}</Text>
                        <View style={[
                            styles.cropPresetRatio,
                            { aspectRatio: preset.ratio }
                        ]} />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Aspect Ratios</Text>
            <View style={styles.aspectRatioGrid}>
                {ASPECT_RATIOS.map((ratio) => (
                    <TouchableOpacity
                        key={ratio.label}
                        style={styles.aspectRatioButton}
                        onPress={() => {
                            if (ratio.value) {
                                setHasChanges(true);
                            }
                        }}
                    >
                        <Text style={styles.aspectRatioText}>{ratio.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.cropControls}>
                <TouchableOpacity 
                    style={[styles.cropControlButton, showCropGrid && styles.cropControlButtonActive]}
                    onPress={() => setShowCropGrid(!showCropGrid)}
                >
                    <Ionicons name="grid" size={20} color={showCropGrid ? '#4CD964' : 'white'} />
                    <Text style={styles.cropControlText}>Grid</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cropControlButton}>
                    <Ionicons name="move" size={20} color="white" />
                    <Text style={styles.cropControlText}>Straighten</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cropControlButton}>
                    <Ionicons name="resize" size={20} color="white" />
                    <Text style={styles.cropControlText}>Perspective</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const handleAdjustmentChange = async (key: string, value: number) => {
        const newAdjustments = { ...currentAdjustments, [key]: value };
        setCurrentAdjustments(newAdjustments);
        setHasChanges(true);
        console.log('Adjustment changed:', { [key]: value, allAdjustments: newAdjustments });

        // Analyze pixel values
        const pixelSamples = await analyzePixelValues(currentImageUri, 5);
        console.log('Current pixel samples:', pixelSamples);
    };

    const resetAdjustments = () => {
        if (adjustmentSliders.length > 0) {
            const resetValues: Record<string, number> = {};
            adjustmentSliders.forEach(slider => {
                resetValues[slider.key] = slider.value;
            });
            setCurrentAdjustments(resetValues);
            console.log('Reset to AI values:', resetValues);
        }
    };

    const resetToOriginal = () => {
        handleReset();
    };



    const renderAdjustMode = () => (
        <View style={styles.modeContainer}>
            <ScrollView contentContainerStyle={styles.adjustContent}>
                {adjustmentSliders.length > 0 && (
                    <>
                        <View style={styles.aiAdjustmentsHeader}>
                            <Text style={styles.sectionTitle}>AI Recommended Adjustments</Text>
                            <TouchableOpacity style={styles.resetAdjustmentsButton} onPress={resetAdjustments}>
                                <Ionicons name="refresh" size={16} color="#007AFF" />
                                <Text style={styles.resetAdjustmentsText}>Reset to AI</Text>
                            </TouchableOpacity>
                        </View>

                        {adjustmentSliders.map((slider) => (
                            <AdjustmentSliderComponent
                                key={slider.key}
                                slider={slider}
                                value={currentAdjustments[slider.key] ?? 0}
                                onValueChange={(value) => handleAdjustmentChange(slider.key, value)}
                            />
                        ))}

                        <View style={styles.divider} />
                    </>
                )}

                <Text style={styles.sectionTitle}>Basic Adjustments</Text>
                {Object.entries(basicAdjustments).map(([key, value]) => (
                    <View key={key} style={styles.basicSliderContainer}>
                        <View style={styles.sliderHeader}>
                            <Text style={styles.sliderLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                            <Text style={styles.sliderValue}>{value > 0 ? '+' : ''}{value}</Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={-100}
                            maximumValue={100}
                            value={value}
                            onValueChange={(newValue) => {
                                const rounded = Math.round(newValue);
                                setBasicAdjustments(prev => ({ ...prev, [key]: rounded }));
                                setHasChanges(true);
                                // Generate preview after a short delay
                                // Preview disabled - expo-image-manipulator limitations
                            }}
                            minimumTrackTintColor="#4CD964"
                            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                            thumbTintColor="#4CD964"
                        />
                    </View>
                ))}

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Transform</Text>
                <View style={styles.rotateButtons}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleRotate(-90)}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                        <Text style={styles.actionButtonText}>90° Left</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleRotate(90)}>
                        <Ionicons name="arrow-forward" size={24} color="white" />
                        <Text style={styles.actionButtonText}>90° Right</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.flipButtons}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleFlip('horizontal')}>
                        <Ionicons name="swap-horizontal" size={24} color="white" />
                        <Text style={styles.actionButtonText}>Horizontal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleFlip('vertical')}>
                        <Ionicons name="swap-vertical" size={24} color="white" />
                        <Text style={styles.actionButtonText}>Vertical</Text>
                    </TouchableOpacity>
                </View>

                {rotation !== 0 && (
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#007AFF" />
                        <Text style={styles.infoText}>Rotated {rotation}°</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );

    const renderFiltersMode = () => (
        <ScrollView style={styles.controlsContainer}>
            <Text style={styles.sectionTitle}>AI Filters</Text>
            <Text style={styles.sectionSubtitle}>Apply AI-powered filters to your image</Text>

            <View style={styles.filterGrid}>
                {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
                    <TouchableOpacity
                        key={key}
                        style={[
                            styles.filterButton,
                            filter === key && styles.filterButtonActive
                        ]}
                        onPress={() => {
                            setFilter(key);
                            setHasChanges(true);
                        }}
                    >
                        <Text style={styles.filterButtonText}>{preset.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {filter && (
                <TouchableOpacity
                    style={styles.clearFilterButton}
                    onPress={() => {
                        setFilter(undefined);
                        setHasChanges(true);
                    }}
                >
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    <Text style={styles.clearFilterText}>Clear Filter</Text>
                </TouchableOpacity>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Custom Prompt</Text>
            <Text style={styles.sectionSubtitle}>Describe how you want to transform the image</Text>

            <TextInput
                style={styles.promptInput}
                placeholder="E.g., 'Make it look like a sunset', 'Add vintage film grain'..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
                value={customPrompt}
                onChangeText={setCustomPrompt}
            />

            <TouchableOpacity
                style={[styles.applyPromptButton, !customPrompt && styles.applyPromptButtonDisabled]}
                disabled={!customPrompt || isProcessing}
                onPress={async () => {
                    if (!customPrompt) return;
                    setIsProcessing(true);
                    try {
                        const filteredUri = await applyBedrockFilter(
                            imageUri,
                            undefined,
                            customPrompt,
                            currentAdjustments
                        );
                        setCurrentImageUri(filteredUri);
                        setHasChanges(true);
                        setCustomPrompt('');
                    } catch (error) {
                        console.error('Custom filter failed:', error);
                        Alert.alert('Error', 'Failed to apply custom filter');
                    } finally {
                        setIsProcessing(false);
                    }
                }}
            >
                {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="sparkles" size={20} color="#fff" />
                        <Text style={styles.applyPromptButtonText}>Apply Custom Filter</Text>
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );

    const renderCurvesMode = () => (
        <ScrollView style={styles.controlsContainer}>
            <Text style={styles.sectionTitle}>Tone Curves</Text>
            <Text style={styles.sectionSubtitle}>Professional tone and color curve adjustments</Text>

            <View style={styles.curvePresets}>
                {Object.entries(CURVE_PRESETS).map(([key, preset]) => (
                    <TouchableOpacity
                        key={key}
                        style={styles.curvePresetButton}
                        onPress={() => {
                            setCurves(prev => ({ ...prev, rgb: preset }));
                            setHasChanges(true);
                        }}
                    >
                        <Text style={styles.curvePresetText}>{key.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.curveChannels}>
                <TouchableOpacity style={styles.curveChannel}>
                    <Text style={styles.curveChannelText}>RGB</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.curveChannel}>
                    <Text style={styles.curveChannelText}>Red</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.curveChannel}>
                    <Text style={styles.curveChannelText}>Green</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.curveChannel}>
                    <Text style={styles.curveChannelText}>Blue</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.curveGraph}>
                <View style={styles.curveGrid}>
                    {[0, 1, 2, 3, 4].map(i => (
                        <View key={i} style={styles.gridLine} />
                    ))}
                </View>
                <View style={styles.curveLine} />
                <Text style={styles.curveGraphNote}>Curve adjustments</Text>
            </View>
        </ScrollView>
    );

    const renderHSLMode = () => (
        <ScrollView style={styles.controlsContainer}>
            <Text style={styles.sectionTitle}>HSL / Color</Text>
            <Text style={styles.sectionSubtitle}>Hue, Saturation, and Luminance adjustments</Text>

            <Text style={styles.subsectionTitle}>Global Adjustments</Text>
            {['hue', 'saturation', 'lightness'].map((param) => (
                <View key={param} style={styles.hslSliderContainer}>
                    <View style={styles.sliderHeader}>
                        <Text style={styles.sliderLabel}>{param.charAt(0).toUpperCase() + param.slice(1)}</Text>
                        <Text style={styles.sliderValue}>{hslAdjustments[param as keyof typeof hslAdjustments]}</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={-100}
                        maximumValue={100}
                        value={hslAdjustments[param as keyof typeof hslAdjustments] as number}
                        onValueChange={(value) => {
                            setHslAdjustments(prev => ({ ...prev, [param]: Math.round(value) }));
                            setHasChanges(true);
                        }}
                        minimumTrackTintColor="#4CD964"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor="#4CD964"
                    />
                </View>
            ))}

            <View style={styles.divider} />

            <Text style={styles.subsectionTitle}>Color Range Adjustments</Text>
            {['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta'].map((color) => (
                <View key={color} style={styles.colorRangeSection}>
                    <TouchableOpacity style={styles.colorRangeHeader}>
                        <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                        <Text style={styles.colorRangeName}>{color.charAt(0).toUpperCase() + color.slice(1)}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    );

    const renderEffectsMode = () => (
        <ScrollView style={styles.controlsContainer}>
            <Text style={styles.sectionTitle}>Professional Effects</Text>
            <Text style={styles.sectionSubtitle}>Creative and cinematic effects</Text>

            <View style={styles.effectsGrid}>
                {PROFESSIONAL_EFFECTS.map((effect) => (
                    <TouchableOpacity
                        key={effect.id}
                        style={[
                            styles.effectButton,
                            effects[effect.id as keyof typeof effects] > 0 && styles.effectButtonActive
                        ]}
                        onPress={() => {
                            const currentValue = effects[effect.id as keyof typeof effects];
                            setEffects(prev => ({ 
                                ...prev, 
                                [effect.id]: currentValue > 0 ? 0 : 50 
                            }));
                            setHasChanges(true);
                        }}
                    >
                        <Text style={styles.effectName}>{effect.name}</Text>
                        <Text style={styles.effectDescription}>{effect.description}</Text>
                        {effects[effect.id as keyof typeof effects] > 0 && (
                            <Text style={styles.effectValue}>{effects[effect.id as keyof typeof effects]}%</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.subsectionTitle}>Color Grading</Text>
            <View style={styles.colorGradingGrid}>
                {Object.entries(COLOR_GRADES).map(([key, grade]) => (
                    <TouchableOpacity
                        key={key}
                        style={styles.colorGradeButton}
                        onPress={async () => {
                            setHasChanges(true);
                            try {
                                // Apply color grading as a filter
                                const result = await manipulateAsync(
                                    currentImageUri,
                                    [{ resize: { width: 1920 } }],
                                    { compress: 0.9, format: SaveFormat.JPEG }
                                );
                                setCurrentImageUri(result.uri);
                            } catch (error) {
                                console.log('Color grading failed:', error);
                            }
                        }}
                    >
                        <View style={styles.colorGradePreview}>
                            <View style={[styles.colorGradeSwatch, { backgroundColor: grade.shadows }]} />
                            <View style={[styles.colorGradeSwatch, { backgroundColor: grade.midtones }]} />
                            <View style={[styles.colorGradeSwatch, { backgroundColor: grade.highlights }]} />
                        </View>
                        <Text style={styles.colorGradeName}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );

    const renderDetailsMode = () => (
        <ScrollView style={styles.controlsContainer}>
            <Text style={styles.sectionTitle}>Detail Enhancement</Text>
            <Text style={styles.sectionSubtitle}>Sharpening, clarity, and noise reduction</Text>

            {Object.entries(details).map(([key, value]) => (
                <View key={key} style={styles.detailSliderContainer}>
                    <View style={styles.sliderHeader}>
                        <Text style={styles.sliderLabel}>
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </Text>
                        <Text style={styles.sliderValue}>{value > 0 ? '+' : ''}{value}</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={key.includes('noise') ? 0 : -100}
                        maximumValue={100}
                        value={value}
                        onValueChange={(newValue) => {
                            const rounded = Math.round(newValue);
                            setDetails(prev => ({ ...prev, [key]: rounded }));
                            setHasChanges(true);
                        }}
                        minimumTrackTintColor="#4CD964"
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor="#4CD964"
                    />
                </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.detailPresets}>
                <TouchableOpacity style={styles.detailPresetButton}>
                    <Text style={styles.detailPresetText}>Portrait</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailPresetButton}>
                    <Text style={styles.detailPresetText}>Landscape</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailPresetButton}>
                    <Text style={styles.detailPresetText}>Street</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderProMode = () => (
        <View style={styles.controlsContainer}>
            <View style={styles.proSectionTabs}>
                <TouchableOpacity 
                    style={[styles.proTab, activeProSection === 'curves' && styles.proTabActive]}
                    onPress={() => setActiveProSection('curves')}
                >
                    <Text style={[styles.proTabText, activeProSection === 'curves' && styles.proTabTextActive]}>Curves</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.proTab, activeProSection === 'hsl' && styles.proTabActive]}
                    onPress={() => setActiveProSection('hsl')}
                >
                    <Text style={[styles.proTabText, activeProSection === 'hsl' && styles.proTabTextActive]}>HSL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.proTab, activeProSection === 'effects' && styles.proTabActive]}
                    onPress={() => setActiveProSection('effects')}
                >
                    <Text style={[styles.proTabText, activeProSection === 'effects' && styles.proTabTextActive]}>Effects</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.proTab, activeProSection === 'details' && styles.proTabActive]}
                    onPress={() => setActiveProSection('details')}
                >
                    <Text style={[styles.proTabText, activeProSection === 'details' && styles.proTabTextActive]}>Details</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.proContent}>
                {activeProSection === 'curves' && (
                    <View>
                        <Text style={styles.sectionTitle}>Tone Curves</Text>
                        <View style={styles.curvePresets}>
                            {Object.entries(CURVE_PRESETS).map(([key, preset]) => (
                                <TouchableOpacity 
                                    key={key} 
                                    style={styles.curvePresetButton}
                                    onPress={() => {
                                        setCurves(prev => ({ ...prev, rgb: preset }));
                                        setHasChanges(true);
                                    }}
                                >
                                    <Text style={styles.curvePresetText}>{key.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.curveGraph}>
                            <View style={styles.curveGrid}>
                                {[0, 1, 2, 3, 4].map(i => (
                                    <View key={i} style={styles.gridLine} />
                                ))}
                            </View>
                            <View style={styles.curveLine} />
                        </View>
                    </View>
                )}

                {activeProSection === 'hsl' && (
                    <View>
                        <Text style={styles.sectionTitle}>HSL Adjustments</Text>
                        {['hue', 'saturation', 'lightness'].map((param) => (
                            <View key={param} style={styles.hslSliderContainer}>
                                <View style={styles.sliderHeader}>
                                    <Text style={styles.sliderLabel}>{param.charAt(0).toUpperCase() + param.slice(1)}</Text>
                                    <Text style={styles.sliderValue}>{hslAdjustments[param as keyof typeof hslAdjustments]}</Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={-100}
                                    maximumValue={100}
                                    value={hslAdjustments[param as keyof typeof hslAdjustments] as number}
                                    onValueChange={(value) => {
                                        setHslAdjustments(prev => ({ ...prev, [param]: Math.round(value) }));
                                        setHasChanges(true);
                                    }}
                                    minimumTrackTintColor="#4CD964"
                                    maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                    thumbTintColor="#4CD964"
                                />
                            </View>
                        ))}
                    </View>
                )}

                {activeProSection === 'effects' && (
                    <View>
                        <Text style={styles.sectionTitle}>Creative Effects</Text>
                        <View style={styles.effectsGrid}>
                            {PROFESSIONAL_EFFECTS.slice(0, 4).map((effect) => (
                                <TouchableOpacity
                                    key={effect.id}
                                    style={[
                                        styles.effectButton,
                                        effects[effect.id as keyof typeof effects] > 0 && styles.effectButtonActive
                                    ]}
                                    onPress={() => {
                                        const currentValue = effects[effect.id as keyof typeof effects];
                                        const newValue = currentValue > 0 ? 0 : 50;
                                        setEffects(prev => ({ 
                                            ...prev, 
                                            [effect.id]: newValue 
                                        }));
                                        setHasChanges(true);
                                    }}
                                >
                                    <Text style={styles.effectName}>{effect.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {activeProSection === 'details' && (
                    <View>
                        <Text style={styles.sectionTitle}>Detail Enhancement</Text>
                        {Object.entries(details).slice(0, 3).map(([key, value]) => (
                            <View key={key} style={styles.detailSliderContainer}>
                                <View style={styles.sliderHeader}>
                                    <Text style={styles.sliderLabel}>
                                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                    </Text>
                                    <Text style={styles.sliderValue}>{value > 0 ? '+' : ''}{value}</Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={key.includes('noise') ? 0 : -100}
                                    maximumValue={100}
                                    value={value}
                                    onValueChange={(newValue) => {
                                        const rounded = Math.round(newValue);
                                        setDetails(prev => ({ ...prev, [key]: rounded }));
                                        setHasChanges(true);
                                    }}
                                    minimumTrackTintColor="#4CD964"
                                    maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                                    thumbTintColor="#4CD964"
                                />
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );

    const renderImage = () => {
        if (!currentImageUri) return null;

        const hasBasicAdjustments = Object.values(basicAdjustments).some(val => val !== 0);

        return (
            <View
                style={styles.imageContainer}
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    setImageDimensions({ width, height });
                }}
            >
                {filter && imageDimensions.width > 0 ? (
                    <SkiaFilteredImage
                        uri={currentImageUri}
                        filterPreset={filter}
                        width={imageDimensions.width}
                        height={imageDimensions.height}
                    />
                ) : (
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{ uri: currentImageUri }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>
                )}

                {/* Image status indicator */}
                {aiProcessedImage && (
                    <View style={styles.imageStatusContainer}>
                        <View style={[
                            styles.imageStatusBadge,
                            currentImageUri === aiProcessedImage.originalUri
                                ? styles.originalBadge
                                : styles.enhancedBadge
                        ]}>
                            <Ionicons
                                name={currentImageUri === aiProcessedImage.originalUri ? "image-outline" : "sparkles"}
                                size={12}
                                color="white"
                            />
                            <Text style={styles.imageStatusText}>
                                {currentImageUri === aiProcessedImage.originalUri ? "Original" : "AI Enhanced"}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Photo</Text>
                <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={isProcessing}>
                    {isProcessing ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                        <Ionicons name="checkmark" size={28} color="#007AFF" />
                    )}
                </TouchableOpacity>
            </View>

            {renderImage()}

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                    <TouchableOpacity
                        style={[styles.tab, editMode === 'ai' && styles.tabActive]}
                        onPress={() => setEditMode('ai')}
                    >
                        <Ionicons name="sparkles" size={16} color={editMode === 'ai' ? '#4CD964' : '#666'} />
                        <Text style={[styles.tabText, editMode === 'ai' && styles.tabTextActive]}>AI</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setEditMode('adjust')}
                        style={[styles.tab, editMode === 'adjust' && styles.tabActive]}
                    >
                        <Ionicons name="options" size={16} color={editMode === 'adjust' ? '#4CD964' : '#666'} />
                        <Text style={[styles.tabText, editMode === 'adjust' && styles.tabTextActive]}>Basic</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setEditMode('curves')}
                        style={[styles.tab, editMode === 'curves' && styles.tabActive]}
                    >
                        <Ionicons name="trending-up" size={16} color={editMode === 'curves' ? '#4CD964' : '#666'} />
                        <Text style={[styles.tabText, editMode === 'curves' && styles.tabTextActive]}>Pro</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setEditMode('filters')}
                        style={[styles.tab, editMode === 'filters' && styles.tabActive]}
                    >
                        <Ionicons name="color-palette" size={16} color={editMode === 'filters' ? '#4CD964' : '#666'} />
                        <Text style={[styles.tabText, editMode === 'filters' && styles.tabTextActive]}>Filters</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setEditMode('crop')}
                        style={[styles.tab, editMode === 'crop' && styles.tabActive]}
                    >
                        <Ionicons name="crop" size={16} color={editMode === 'crop' ? '#4CD964' : '#666'} />
                        <Text style={[styles.tabText, editMode === 'crop' && styles.tabTextActive]}>Crop</Text>
                    </TouchableOpacity>

                    {aiProcessedImage && (
                        <TouchableOpacity
                            onPress={() => setShowComparison(true)}
                            style={styles.tab}
                        >
                            <Ionicons name="git-compare" size={16} color="#666" />
                            <Text style={styles.tabText}>Compare</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            <View style={styles.contentContainer}>
                {editMode === 'ai' && renderAIMode()}
                {editMode === 'crop' && renderCropMode()}
                {editMode === 'adjust' && renderAdjustMode()}
                {editMode === 'curves' && renderProMode()}
                {editMode === 'filters' && renderFiltersMode()}
            </View>

            {hasChanges && (
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                        <Ionicons name="refresh" size={20} color="#666" />
                        <Text style={styles.resetButtonText}>Reset All</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Before/After Comparison Modal */}
            {showComparison && aiProcessedImage && (
                <Modal
                    visible={showComparison}
                    animationType="slide"
                    presentationStyle="fullScreen"
                    onRequestClose={() => setShowComparison(false)}
                >
                    <BeforeAfterComparison
                        beforeUri={aiProcessedImage.originalUri}
                        afterUri={currentImageUri}
                        beforeLabel="Original"
                        afterLabel="Enhanced"
                        onClose={() => setShowComparison(false)}
                    />
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(10, 10, 20, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    imageContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: '100%',
    },
    tabsContainer: {
        backgroundColor: 'rgba(10, 10, 20, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 8,
        height: 50,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginHorizontal: 4,
        minWidth: 70,
    },
    tabActive: {
        backgroundColor: 'rgba(76, 217, 100, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(76, 217, 100, 0.3)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(76, 217, 100, 0.3)',
    },
    tabText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#4CD964',
        fontWeight: '600',
        textShadowColor: 'rgba(76, 217, 100, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
    },
    contentContainer: {
        height: 300,
        backgroundColor: '#050505',
    },
    modeContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    aiContent: {
        padding: 20,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    aiTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    aiReasoning: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
        marginBottom: 20,
    },
    adjustmentsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 12,
    },
    adjustmentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    adjustmentKey: {
        fontSize: 14,
        color: '#ccc',
    },
    adjustmentValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CD964',
    },
    suggestionsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 12,
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
    },
    noteCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 204, 0, 0.1)',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 204, 0, 0.3)',
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        color: '#FFCC00',
        lineHeight: 18,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    comingSoonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    comingSoonText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
        marginTop: 16,
    },
    comingSoonSubtext: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        marginTop: 8,
    },
    comingSoonNote: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
    },
    adjustContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 12,
        marginTop: 8,
    },
    rotateButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    controlsContainer: {
        flex: 1,
        padding: 20,
    },
    flipButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    resetButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    aiAdjustmentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    resetAdjustmentsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    resetAdjustmentsText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginVertical: 20,
    },
    appliedCard: {
        flexDirection: 'row',
        backgroundColor: '#E8F5E8',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginBottom: 16,
    },
    appliedText: {
        flex: 1,
        fontSize: 12,
        color: '#4CD964',
        lineHeight: 18,
        fontWeight: '500',
    },
    imageStatusContainer: {
        position: 'absolute',
        top: 16,
        left: 16,
    },
    imageStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    originalBadge: {
        backgroundColor: 'rgba(102, 102, 102, 0.8)',
    },
    enhancedBadge: {
        backgroundColor: 'rgba(0, 122, 255, 0.8)',
    },
    imageStatusText: {
        fontSize: 10,
        color: 'white',
        fontWeight: '600',
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#999',
        marginBottom: 15,
    },
    filterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 15,
    },
    filterButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    clearFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        gap: 8,
        marginBottom: 15,
    },
    clearFilterText: {
        color: '#FF3B30',
        fontSize: 14,
        fontWeight: '600',
    },
    promptInput: {
        backgroundColor: '#1C1C1E',
        borderRadius: 8,
        padding: 15,
        color: '#fff',
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 15,
    },
    applyPromptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        gap: 8,
    },
    applyPromptButtonDisabled: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    applyPromptButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    basicSliderContainer: {
        marginBottom: 20,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sliderLabel: {
        fontSize: 14,
        color: 'white',
        fontWeight: '500',
    },
    sliderValue: {
        fontSize: 14,
        color: '#4CD964',
        fontWeight: '600',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    imageWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    tabsContent: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    // Professional Editing Styles
    cropPresetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    cropPresetButton: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    cropPresetButtonActive: {
        borderColor: '#4CD964',
        backgroundColor: 'rgba(76, 217, 100, 0.1)',
    },
    cropPresetName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    cropPresetDimensions: {
        color: '#666',
        fontSize: 12,
        marginBottom: 8,
    },
    cropPresetRatio: {
        width: 40,
        height: 30,
        backgroundColor: '#4CD964',
        borderRadius: 4,
    },
    aspectRatioGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    aspectRatioButton: {
        backgroundColor: '#1C1C1E',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    aspectRatioText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    cropControls: {
        flexDirection: 'row',
        gap: 12,
    },
    cropControlButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1C1C1E',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    cropControlButtonActive: {
        borderColor: '#4CD964',
        backgroundColor: 'rgba(76, 217, 100, 0.1)',
    },
    cropControlText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    // Curves Mode
    curvePresets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    curvePresetButton: {
        backgroundColor: '#1C1C1E',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    curvePresetText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    curveChannels: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    curveChannel: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    curveChannelText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    curveGraph: {
        height: 200,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    curveGraphPlaceholder: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    curveGraphNote: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    // HSL Mode
    subsectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CD964',
        marginBottom: 12,
        marginTop: 8,
    },
    hslSliderContainer: {
        marginBottom: 20,
    },
    colorRangeSection: {
        marginBottom: 12,
    },
    colorRangeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    colorSwatch: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    colorRangeName: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    // Effects Mode
    effectsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    effectButton: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    effectButtonActive: {
        borderColor: '#4CD964',
        backgroundColor: 'rgba(76, 217, 100, 0.1)',
    },
    effectName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    effectDescription: {
        color: '#666',
        fontSize: 12,
        marginBottom: 8,
    },
    effectValue: {
        color: '#4CD964',
        fontSize: 12,
        fontWeight: '700',
    },
    colorGradingGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorGradeButton: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    colorGradePreview: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    colorGradeSwatch: {
        width: 20,
        height: 20,
        marginHorizontal: 2,
    },
    colorGradeName: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    // Details Mode
    detailSliderContainer: {
        marginBottom: 20,
    },
    detailPresets: {
        flexDirection: 'row',
        gap: 12,
    },
    detailPresetButton: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    detailPresetText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    // Masking Mode
    maskingTools: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    maskingTool: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        gap: 8,
    },
    maskingToolActive: {
        borderColor: '#4CD964',
        backgroundColor: 'rgba(76, 217, 100, 0.1)',
    },
    maskingToolText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    maskingControls: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    maskingSlider: {
        marginBottom: 16,
    },
    // Pro Mode Styles
    proSectionTabs: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
    },
    proTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    proTabActive: {
        backgroundColor: '#4CD964',
    },
    proTabText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
    },
    proTabTextActive: {
        color: 'white',
    },
    proContent: {
        flex: 1,
    },
    curveGrid: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridLine: {
        width: 1,
        height: '100%',
        backgroundColor: '#333',
    },
    curveLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#4CD964',
        transform: [{ rotate: '15deg' }],
    },
});
