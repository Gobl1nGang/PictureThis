import React, { useState } from 'react';
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
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { SetReferenceButton } from '../features/reference-photo';

const { width, height } = Dimensions.get('window');
const numColumns = 2;
const imageSize = (width - 30) / numColumns;

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

  // Fetch photos from Pexels API
  const searchPhotos = async (query: string) => {
    if (!query.trim()) {
      Alert.alert('Search Required', 'Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    
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

      // Use MediaLibrary.saveToLibraryAsync directly with the URL
      await MediaLibrary.saveToLibraryAsync(photo.src.large);
      Alert.alert('Success', 'Photo saved to your library!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    }
  };

  const handleSetReference = (photo: PexelsPhoto) => {
    // Store reference for camera to pick up
    global.referenceImageUri = photo.src.large;
    closePhotoModal();
    Alert.alert('Reference Set', 'Switch to Camera tab to start live coaching!');
  };

  // Render individual photo item in grid
  const renderPhotoItem = ({ item }: { item: PexelsPhoto }) => (
    <TouchableOpacity 
      style={styles.photoItem}
      onPress={() => openPhotoModal(item)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.src.medium }}
        style={styles.photoImage}
        resizeMode="cover"
      />
      <View style={styles.photoOverlay}>
        <Text style={styles.photographerText} numberOfLines={1}>
          📷 {item.photographer}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>Find Photography Inspiration</Text>
      <Text style={styles.emptyStateSubtitle}>
        Search for topics like "portrait", "landscape", "cinematic" to discover amazing photos
      </Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="alert-circle" size={64} color="#FF3B30" />
      <Text style={styles.errorTitle}>Oops!</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => handleSearch()}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with search bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inspiration</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for inspiration..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="search" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content area */}
      <View style={styles.content}>
        {loading && photos.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Searching for inspiration...</Text>
          </View>
        ) : error ? (
          renderErrorState()
        ) : photos.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={photos}
            renderItem={renderPhotoItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={numColumns}
            contentContainerStyle={styles.photoGrid}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Fullscreen photo modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhotoModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={closePhotoModal}
            activeOpacity={1}
          >
            {selectedPhoto && (
              <>
                <TouchableOpacity style={styles.closeButton} onPress={closePhotoModal}>
                  <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={() => savePhoto(selectedPhoto)}
                >
                  <Ionicons name="download" size={24} color="white" />
                </TouchableOpacity>
                
                <SetReferenceButton onPress={() => handleSetReference(selectedPhoto)} />
                
                <Image 
                  source={{ uri: selectedPhoto.src.large }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                
                <View style={styles.modalAttribution}>
                  <Text style={styles.modalPhotographerText}>
                    Photo by {selectedPhoto.photographer}
                  </Text>
                  <Text style={styles.modalSourceText}>
                    via Pexels
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 22,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    width: 44,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
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
    color: '#333',
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
  photoGrid: {
    padding: 10,
  },
  photoItem: {
    width: imageSize,
    height: imageSize * 1.2,
    marginHorizontal: 5,
    marginVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
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
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,122,255,0.9)',
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

});