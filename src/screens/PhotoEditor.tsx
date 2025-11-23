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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { generateAIEnhancement, AIEnhancementResult } from '../services/imageEnhancement';
import { usePhotoContext } from '../contexts/PhotoContextContext';
import { useUserProfile } from '../contexts/UserProfileContext';

const { width } = Dimensions.get('window');

interface PhotoEditorProps {
    imageUri: string;
    onClose: () => void;
    onSave?: (editedUri: string) => void;
}

type EditMode = 'ai' | 'crop' | 'adjust';

const ASPECT_RATIOS = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
];

export default function PhotoEditor({ imageUri, onClose, onSave }: PhotoEditorProps) {
    const [editMode, setEditMode] = useState<EditMode>('ai');
    const [aiEnhancement, setAiEnhancement] = useState<AIEnhancementResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [currentImageUri, setCurrentImageUri] = useState(imageUri);
    const [rotation, setRotation] = useState(0);
    const [hasChanges, setHasChanges] = useState(false);

    const { currentContext } = usePhotoContext();
    const { profile } = useUserProfile();

    useEffect(() => {
        loadAIEnhancement();
    }, []);

    useEffect(() => {
        setHasChanges(currentImageUri !== imageUri || rotation !== 0);
    }, [currentImageUri, rotation]);

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
        setCurrentImageUri(imageUri);
        setRotation(0);
    };

    const handleSave = async () => {
        if (!hasChanges) {
            Alert.alert('No Changes', 'Make some edits before saving.');
            return;
        }

        setIsProcessing(true);
        try {
            const asset = await MediaLibrary.createAssetAsync(currentImageUri);
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
                            onSave(currentImageUri);
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

                    <View style={styles.noteCard}>
                        <Ionicons name="information-circle-outline" size={20} color="#666" />
                        <Text style={styles.noteText}>
                            Note: Color adjustments require a development build. Use these recommendations as a guide for editing in other apps, or use the Adjust tab for basic edits.
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

    const renderAdjustMode = () => (
        <View style={styles.modeContainer}>
            <ScrollView contentContainerStyle={styles.adjustContent}>
                <Text style={styles.sectionTitle}>Rotate</Text>
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

                <Text style={styles.sectionTitle}>Flip</Text>
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

            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: currentImageUri }}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, editMode === 'ai' && styles.tabActive]}
                    onPress={() => setEditMode('ai')}
                >
                    <Ionicons name="sparkles" size={20} color={editMode === 'ai' ? '#007AFF' : '#666'} />
                    <Text style={[styles.tabText, editMode === 'ai' && styles.tabTextActive]}>AI Guide</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, editMode === 'adjust' && styles.tabActive]}
                    onPress={() => setEditMode('adjust')}
                >
                    <Ionicons name="options" size={20} color={editMode === 'adjust' ? '#007AFF' : '#666'} />
                    <Text style={[styles.tabText, editMode === 'adjust' && styles.tabTextActive]}>Adjust</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, editMode === 'crop' && styles.tabActive]}
                    onPress={() => setEditMode('crop')}
                >
                    <Ionicons name="crop" size={20} color={editMode === 'crop' ? '#007AFF' : '#666'} />
                    <Text style={[styles.tabText, editMode === 'crop' && styles.tabTextActive]}>Crop</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
                {editMode === 'ai' && renderAIMode()}
                {editMode === 'crop' && renderCropMode()}
                {editMode === 'adjust' && renderAdjustMode()}
            </View>

            {hasChanges && (
                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                        <Ionicons name="refresh" size={20} color="#666" />
                        <Text style={styles.resetButtonText}>Reset</Text>
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
});
