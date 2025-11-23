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
} from 'react-native';
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

const { width } = Dimensions.get('window');

interface PhotoEditorProps {
    imageUri: string;
    aiProcessedImage?: AIProcessedImage | null;
    onClose: () => void;
    onSave?: (editedUri: string) => void;
}

type EditMode = 'ai' | 'crop' | 'adjust' | 'filters';

const ASPECT_RATIOS = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
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
    const [filter, setFilter] = useState<string | undefined>(undefined);
    const [customPrompt, setCustomPrompt] = useState('');
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

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
        setHasChanges(currentImageUri !== originalUri || rotation !== 0 || hasAdjustmentChanges);
    }, [currentImageUri, rotation, currentAdjustments, aiProcessedImage, imageUri]);

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
        console.log('handleReset called');
        resetToOriginal();
    };

    const handleSave = async () => {
        if (!hasChanges) {
            Alert.alert('No Changes', 'Make some edits before saving.');
            return;
        }

        setIsProcessing(true);
        try {
            let uriToSave = currentImageUri;

            // If a preset filter is active, we need to bake it into the image
            if (filter) {
                console.log('Baking filter into image before saving:', filter);
                uriToSave = await applySkiaFilter(currentImageUri, filter);
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
        <View style={styles.modeContainer}>
            <View style={styles.comingSoonContainer}>
                <Ionicons name="crop" size={48} color="#007AFF" />
                <Text style={styles.comingSoonText}>Crop Tool</Text>
                <Text style={styles.comingSoonSubtext}>
                    Interactive crop with aspect ratio presets coming soon!
                </Text>
                <Text style={styles.comingSoonNote}>
                    For now, use the Adjust tab for rotate and flip.
                </Text>
            </View>
        </View>
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
        console.log('Reset button clicked');
        console.log('Current adjustmentSliders:', adjustmentSliders);
        console.log('Current adjustments before reset:', currentAdjustments);

        if (adjustmentSliders.length > 0) {
            const resetValues: Record<string, number> = {};
            adjustmentSliders.forEach(slider => {
                resetValues[slider.key] = 0;
            });
            setCurrentAdjustments(resetValues);
            console.log('Reset values set to:', resetValues);
        } else {
            console.log('No adjustment sliders found');
        }
        setRotation(0);
        console.log('Reset completed');
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
                            // Option 1: Client-side Skia filter (Instant)
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

    const renderImage = () => {
        if (!currentImageUri) return null;

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
                    <Image
                        source={{ uri: currentImageUri }}
                        style={styles.image}
                        resizeMode="contain"
                    />
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
                <TouchableOpacity
                    style={[styles.tab, editMode === 'ai' && styles.tabActive]}
                    onPress={() => setEditMode('ai')}
                >
                    <Ionicons name="sparkles" size={20} color={editMode === 'ai' ? '#007AFF' : '#666'} />
                    <Text style={[styles.tabText, editMode === 'ai' && styles.tabTextActive]}>AI Guide</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setEditMode('adjust')}
                    style={[styles.tab, editMode === 'adjust' && styles.tabActive]}
                >
                    <Ionicons name="options" size={20} color={editMode === 'adjust' ? '#007AFF' : '#666'} />
                    <Text style={[styles.tabText, editMode === 'adjust' && styles.tabTextActive]}>Adjust</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setEditMode('filters')}
                    style={[styles.tab, editMode === 'filters' && styles.tabActive]}
                >
                    <Ionicons name="color-palette" size={20} color={editMode === 'filters' ? '#007AFF' : '#666'} />
                    <Text style={[styles.tabText, editMode === 'filters' && styles.tabTextActive]}>Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setEditMode('crop')}
                    style={[styles.tab, editMode === 'crop' && styles.tabActive]}
                >
                    <Ionicons name="crop" size={20} color={editMode === 'crop' ? '#007AFF' : '#666'} />
                    <Text style={[styles.tabText, editMode === 'crop' && styles.tabTextActive]}>Crop</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
                {editMode === 'ai' && renderAIMode()}
                {editMode === 'crop' && renderCropMode()}
                {editMode === 'adjust' && renderAdjustMode()}
                {editMode === 'filters' && renderFiltersMode()}
            </View>

            {hasChanges && (
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.resetButton} onPress={() => {
                        console.log('Reset button pressed');
                        handleReset();
                    }}>
                        <Ionicons name="refresh" size={20} color="#666" />
                        <Text style={styles.resetButtonText}>Reset to Original</Text>
                    </TouchableOpacity>
                </View>
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
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
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
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    contentContainer: {
        height: 300,
        backgroundColor: '#f8f8f8',
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
        color: '#333',
    },
    aiReasoning: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 20,
    },
    adjustmentsCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    adjustmentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    adjustmentKey: {
        fontSize: 14,
        color: '#666',
    },
    adjustmentValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    suggestionsCard: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
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
        color: '#666',
        lineHeight: 20,
    },
    noteCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF9E6',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        color: '#666',
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
        color: '#333',
        marginTop: 16,
    },
    comingSoonSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    comingSoonNote: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 16,
    },
    adjustContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
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
});
