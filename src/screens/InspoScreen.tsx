import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  SafeAreaView,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { SetReferenceButton, AnalysisModal } from '../features/reference-photo';

const { width, height } = Dimensions.get('window');
const numColumns = 2;
const spacing = 12;
const imageSize = (width - spacing * 3) / numColumns;

const TAGS = [
  'Curated', 'Portrait', 'Landscape', 'Neon', 'Black & White',
  'Street', 'Nature', 'Architecture', 'Minimal', 'Vintage'
];

// Pexels API configuration
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'tWfZiBvUEg9yR3BRR74ZUylDykEVQs3Cr3UbDg10ssbz3G34Ne6pZ8rF';
const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

// TypeScript interfaces for Pexels API response
interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
  next_page?: string;
}

export default function InspoScreen() {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PexelsPhoto | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [analysisImageUri, setAnalysisImageUri] = useState<string>('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [likedPhotos, setLikedPhotos] = useState<Set<number>>(new Set());
  const [dislikedPhotos, setDislikedPhotos] = useState<Set<number>>(new Set());
  const [selectedTag, setSelectedTag] = useState('Curated');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Load default curated photos on component mount
  useEffect(() => {
    loadCuratedPhotos();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load curated photos (Instagram-style feed)
  const loadCuratedPhotos = async () => {
    setLoading(true);
    setError(null);
    setIsSearchMode(false);

    try {
      const response = await fetch(
        `${PEXELS_BASE_URL}/curated?per_page=30`,
        {
          headers: {
            'Authorization': PEXELS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PexelsResponse = await response.json();
      setPhotos(data.photos);
    } catch (err) {
      console.error('Error fetching curated photos:', err);
      setError('Failed to load photos. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch photos from Pexels API
  const searchPhotos = async (query: string) => {
    if (!query.trim()) {
      // If search is cleared, return to curated feed
      loadCuratedPhotos();
      return;
    }

    setLoading(true);
    setError(null);
    setIsSearchMode(true);

    try {
      let allPhotos: PexelsPhoto[] = [];
      let page = 1;
      const seenPhotographers = new Set<string>();

      // Fetch multiple pages until we have 30 unique photographers
      while (allPhotos.length < 30 && page <= 5) {
        const response = await fetch(
          `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=80&page=${page}`,
          {
            headers: {
              'Authorization': PEXELS_API_KEY,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PexelsResponse = await response.json();

        if (data.photos.length === 0) break;

        // Add photos from unique photographers
        for (const photo of data.photos) {
          if (!seenPhotographers.has(photo.photographer) && allPhotos.length < 30) {
            seenPhotographers.add(photo.photographer);
            allPhotos.push(photo);
          }
        }

        page++;
      }

      if (allPhotos.length === 0) {
        setError('No photos found for this search term');
        setPhotos([]);
      } else {
        setPhotos(allPhotos);
      }
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to fetch photos. Please check your internet connection.');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search button press
  const handleSearch = () => {
    searchPhotos(searchQuery);
  };

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setSelectedTag('Curated');
      loadCuratedPhotos();
    } else {
      setSelectedTag('');
    }
  };

  const handleTagPress = (tag: string) => {
    setSelectedTag(tag);
    setSearchQuery('');
    if (tag === 'Curated') {
      loadCuratedPhotos();
    } else {
      searchPhotos(tag);
    }
  };

  // Open photo in fullscreen modal
  const openPhotoModal = (photo: PexelsPhoto) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  // Close fullscreen modal
  const closePhotoModal = () => {
    setModalVisible(false);
    setSelectedPhoto(null);
  };

  // Save photo to device library
  const savePhoto = async (photo: PexelsPhoto) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save photos to your library.');
        return;
      }

      await MediaLibrary.saveToLibraryAsync(photo.src.large);
      Alert.alert('Success', 'Photo saved to your library!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    }
  };

  const handleSetReference = (photo: PexelsPhoto) => {
    setAnalysisImageUri(photo.src.large);
    setAnalysisModalVisible(true);
    closePhotoModal();
  };

  // Handle like/unlike photo
  const toggleLike = (photoId: number) => {
    setLikedPhotos(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(photoId)) {
        newLiked.delete(photoId);
      } else {
        newLiked.add(photoId);
        // Remove from disliked if it was disliked
        setDislikedPhotos(prevDisliked => {
          const newDisliked = new Set(prevDisliked);
          newDisliked.delete(photoId);
          return newDisliked;
        });
      }
      return newLiked;
    });
  };

  // Handle dislike photo (removes from screen)
  const toggleDislike = (photoId: number) => {
    setDislikedPhotos(prev => {
      const newDisliked = new Set(prev);
      newDisliked.add(photoId);
      return newDisliked;
    });
    // Remove from liked if it was liked
    setLikedPhotos(prevLiked => {
      const newLiked = new Set(prevLiked);
      newLiked.delete(photoId);
      return newLiked;
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inspiration</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ideas..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={TAGS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsContainer}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tagButton,
              selectedTag === item && styles.selectedTagButton
            ]}
            onPress={() => handleTagPress(item)}
          >
            <Text style={[
              styles.tagText,
              selectedTag === item && styles.selectedTagText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderPhotoItem = ({ item, index }: { item: PexelsPhoto, index: number }) => (
    <TouchableOpacity
      style={[
        styles.photoContainer,
        {
          height: index % 2 === 0 ? imageSize * 1.5 : imageSize * 1.2,
          marginTop: index % 2 !== 0 ? 20 : 0
        }
      ]}
      onPress={() => openPhotoModal(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.src.large }}
        style={styles.photo}
        resizeMode="cover"
      />
      <View style={styles.photoOverlay}>
        <Text style={styles.photographerName} numberOfLines={1}>
          {item.photographer}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="images" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>Discover Amazing Photography</Text>
      <Text style={styles.emptyStateSubtitle}>
        Browse curated photos or search for specific inspiration
      </Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="alert-circle" size={64} color="#FF3B30" />
      <Text style={styles.errorTitle}>Oops!</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadCuratedPhotos()}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>
                {error || 'No photos found'}
              </Text>
            </View>
          )
        }
      />

      {/* Photo Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            {selectedPhoto && (
              <>
                <TouchableOpacity style={styles.closeButton} onPress={closePhotoModal}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>

                <View style={styles.modalControls}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => savePhoto(selectedPhoto)}
                  >
                    <Ionicons name="download-outline" size={24} color="white" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => {
                      global.inspirationImageUri = selectedPhoto.src.large;
                      Alert.alert('Set as Inspiration', 'This photo is now available as an overlay in the camera');
                      closePhotoModal();
                    }}
                  >
                    <Ionicons name="heart-outline" size={24} color="white" />
                  </TouchableOpacity>

                  <SetReferenceButton onPress={() => handleSetReference(selectedPhoto)} />
                </View>

                <Image
                  source={{ uri: selectedPhoto.src.large2x }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <View style={styles.modalAttribution}>
                  <Text style={styles.modalPhotographerText}>
                    {selectedPhoto.photographer}
                  </Text>
                  <Text style={styles.modalSourceText}>
                    on Pexels
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      <AnalysisModal
        visible={analysisModalVisible}
        onClose={() => setAnalysisModalVisible(false)}
        imageUri={analysisImageUri}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 35,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 217, 100, 0.3)',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    paddingLeft: 10,
    textShadowColor: 'rgba(76, 217, 100, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  content: {
    flex: 1,
    backgroundColor: '#050505',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 20,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Grid layout styles (for search results)
  photoGrid: {
    padding: 6,
    marginLeft: -2,
  },
  photoItem: {
    width: imageSize,
    height: imageSize * 1.2,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  photographerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  // Instagram-style layout (for curated photos)
  instagramPhotoList: {
    paddingVertical: 0,
  },
  instagramPhotoItem: {
    width: width - 6,
    height: width * 1.25,
    marginBottom: 3,
    marginHorizontal: 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instagramPhotoImage: {
    width: '100%',
    height: '100%',
  },
  instagramPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  photographerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instagramPhotographerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  // Button container styles
  buttonContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  instagramButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  // Like button styles
  likeButton: {
    width: 36,
    height: 36,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dislikeButton: {
    width: 36,
    height: 36,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  instagramLikeButton: {
    width: 44,
    height: 44,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  instagramDislikeButton: {
    width: 44,
    height: 44,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 25,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  modalControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width - 40,
    height: height - 200,
  },
  modalAttribution: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  modalPhotographerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSourceText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  headerContainer: {
    paddingTop: 10,
    backgroundColor: '#050505',
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    height: '100%',
  },
  tagsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedTagButton: {
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    borderColor: '#4CD964',
  },
  tagText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedTagText: {
    color: '#4CD964',
  },
  listContent: {
    paddingHorizontal: spacing,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: imageSize,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    marginBottom: 20,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 40, // Gradient space
    justifyContent: 'flex-end',
  },
  photographerName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});