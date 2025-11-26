import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SocialSharingService, SOCIAL_PLATFORMS, ShareOptions } from '../services/socialSharing';

interface SocialShareModalProps {
    visible: boolean;
    onClose: () => void;
    imageUri: string;
}

export function SocialShareModal({ visible, onClose, imageUri }: SocialShareModalProps) {
    const [selectedPlatform, setSelectedPlatform] = useState(SOCIAL_PLATFORMS[0]);
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [customHashtag, setCustomHashtag] = useState('');
    const [includeWatermark, setIncludeWatermark] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const handleAddHashtag = () => {
        if (customHashtag.trim() && !hashtags.includes(customHashtag.trim())) {
            setHashtags([...hashtags, customHashtag.trim()]);
            setCustomHashtag('');
        }
    };

    const removeHashtag = (tagToRemove: string) => {
        setHashtags(hashtags.filter(tag => tag !== tagToRemove));
    };

    const addRecommendedHashtag = (tag: string) => {
        if (!hashtags.includes(tag)) {
            setHashtags([...hashtags, tag]);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const shareOptions: ShareOptions = {
                platform: selectedPlatform.id,
                caption,
                hashtags,
                includeWatermark,
            };

            const success = await SocialSharingService.shareToSocial(imageUri, shareOptions);
            
            if (success) {
                Alert.alert('Success', 'Photo shared successfully!');
                onClose();
            } else {
                Alert.alert('Error', 'Failed to share photo. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while sharing.');
        } finally {
            setIsSharing(false);
        }
    };

    const recommendedHashtags = SocialSharingService.getRecommendedHashtags(selectedPlatform.id);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Share Photo</Text>
                    <TouchableOpacity 
                        onPress={handleShare}
                        disabled={isSharing}
                        style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
                    >
                        {isSharing ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <Text style={styles.shareButtonText}>Share</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* Platform Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Choose Platform</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformScroll}>
                            {SOCIAL_PLATFORMS.map(platform => (
                                <TouchableOpacity
                                    key={platform.id}
                                    style={[
                                        styles.platformButton,
                                        selectedPlatform.id === platform.id && styles.platformButtonActive
                                    ]}
                                    onPress={() => setSelectedPlatform(platform)}
                                >
                                    <Ionicons 
                                        name={platform.icon as any} 
                                        size={24} 
                                        color={selectedPlatform.id === platform.id ? '#007AFF' : '#666'} 
                                    />
                                    <Text style={[
                                        styles.platformText,
                                        selectedPlatform.id === platform.id && styles.platformTextActive
                                    ]}>
                                        {platform.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Platform Info */}
                    {selectedPlatform.aspectRatio && (
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={20} color="#007AFF" />
                            <Text style={styles.infoText}>
                                Optimized for {selectedPlatform.name} 
                                {selectedPlatform.aspectRatio === 1 ? ' (Square)' : 
                                 selectedPlatform.aspectRatio === 9/16 ? ' (Vertical)' : 
                                 ' (Landscape)'}
                            </Text>
                        </View>
                    )}

                    {/* Caption */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Caption</Text>
                        <TextInput
                            style={styles.captionInput}
                            placeholder="Write a caption for your photo..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            value={caption}
                            onChangeText={setCaption}
                        />
                    </View>

                    {/* Hashtags */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Hashtags</Text>
                        
                        {/* Current Hashtags */}
                        {hashtags.length > 0 && (
                            <View style={styles.hashtagContainer}>
                                {hashtags.map((tag, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.hashtagChip}
                                        onPress={() => removeHashtag(tag)}
                                    >
                                        <Text style={styles.hashtagText}>#{tag}</Text>
                                        <Ionicons name="close-circle" size={16} color="#666" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Add Custom Hashtag */}
                        <View style={styles.hashtagInputContainer}>
                            <TextInput
                                style={styles.hashtagInput}
                                placeholder="Add hashtag..."
                                placeholderTextColor="#999"
                                value={customHashtag}
                                onChangeText={setCustomHashtag}
                                onSubmitEditing={handleAddHashtag}
                            />
                            <TouchableOpacity 
                                style={styles.addHashtagButton}
                                onPress={handleAddHashtag}
                                disabled={!customHashtag.trim()}
                            >
                                <Ionicons name="add" size={20} color="#007AFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Recommended Hashtags */}
                        <Text style={styles.recommendedTitle}>Recommended:</Text>
                        <View style={styles.recommendedContainer}>
                            {recommendedHashtags.map((tag, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.recommendedChip,
                                        hashtags.includes(tag.replace('#', '')) && styles.recommendedChipSelected
                                    ]}
                                    onPress={() => addRecommendedHashtag(tag.replace('#', ''))}
                                    disabled={hashtags.includes(tag.replace('#', ''))}
                                >
                                    <Text style={[
                                        styles.recommendedText,
                                        hashtags.includes(tag.replace('#', '')) && styles.recommendedTextSelected
                                    ]}>
                                        {tag}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Options */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Options</Text>
                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => setIncludeWatermark(!includeWatermark)}
                        >
                            <View style={styles.optionLeft}>
                                <Ionicons name="water" size={20} color="#666" />
                                <Text style={styles.optionText}>Include PictureThis watermark</Text>
                            </View>
                            <View style={[styles.checkbox, includeWatermark && styles.checkboxActive]}>
                                {includeWatermark && (
                                    <Ionicons name="checkmark" size={16} color="white" />
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    shareButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    shareButtonDisabled: {
        opacity: 0.5,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: 'white',
        marginBottom: 12,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    platformScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    platformButton: {
        alignItems: 'center',
        padding: 12,
        marginRight: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        minWidth: 80,
    },
    platformButtonActive: {
        borderColor: '#007AFF',
        backgroundColor: '#f0f8ff',
    },
    platformText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    platformTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 20,
        marginBottom: 12,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#007AFF',
    },
    captionInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        textAlignVertical: 'top',
        minHeight: 80,
    },
    hashtagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    hashtagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    hashtagText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    hashtagInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 12,
    },
    hashtagInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    addHashtagButton: {
        padding: 12,
    },
    recommendedTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
    },
    recommendedContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    recommendedChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    recommendedChipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    recommendedText: {
        fontSize: 14,
        color: '#666',
    },
    recommendedTextSelected: {
        color: 'white',
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
});