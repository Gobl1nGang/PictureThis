import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, Platform, Modal, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SetReferenceButton, AnalysisModal } from '../features/reference-photo';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import PhotoEditor from './PhotoEditor';

const { width } = Dimensions.get('window');
const numColumns = 3;
const imageSize = (width - 6) / numColumns;

export default function PhotosScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [permission, requestPermission] = MediaLibrary.usePermissions({ writeOnly: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string>();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [uriCache, setUriCache] = useState<Map<string, string>>(new Map());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<MediaLibrary.Asset | null>(null);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [analysisImageUri, setAnalysisImageUri] = useState<string>('');

  // Editor state
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorImageUri, setEditorImageUri] = useState<string | null>(null);

  // Detect if running on Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    if (isExpoGo && Platform.OS === 'ios') {
      console.warn('Running on Expo Go for iOS - photo loading may be limited due to entitlements');
    }
  }, []);

  useEffect(() => {
    if (permission?.granted) {
      loadPhotos();
    }
  }, [permission?.granted]);

  // Function to resolve ph:// URIs to usable file URIs
  const resolveAssetUri = async (asset: MediaLibrary.Asset): Promise<string> => {
    // Check cache first
    if (uriCache.has(asset.id)) {
      return uriCache.get(asset.id)!;
    }

    // If URI doesn't start with ph://, return as-is
    if (!asset.uri.startsWith('ph://')) {
      setUriCache(prev => new Map(prev.set(asset.id, asset.uri)));
      return asset.uri;
    }

    try {
      // Get asset info to convert ph:// to file:// URI
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
      const resolvedUri = assetInfo.localUri || assetInfo.uri || asset.uri;

      // Cache the resolved URI
      setUriCache(prev => new Map(prev.set(asset.id, resolvedUri)));
      return resolvedUri;
    } catch (error) {
      console.error('Failed to resolve asset URI:', error);
      // Fallback to original URI
      setUriCache(prev => new Map(prev.set(asset.id, asset.uri)));
      return asset.uri;
    }
  };

  const loadPhotos = async (loadMore = false) => {
    if (!permission?.granted) {
      setLoading(false);
      return;
    }

    if (loadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const album = await MediaLibrary.getAlbumAsync('PictureThis');

      if (!album) {
        setPhotos([]);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const result = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        album: album,
        first: 50,
        sortBy: MediaLibrary.SortBy.creationTime,
        after: loadMore ? endCursor : undefined,
      });

      if (loadMore) {
        setPhotos(prev => [...prev, ...result.assets]);
      } else {
        setPhotos(result.assets);
      }

      setHasNextPage(result.hasNextPage);
      setEndCursor(result.endCursor);
    } catch (error) {
      console.error('Error loading photos:', error);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  const loadMorePhotos = () => {
    if (!loadingMore && hasNextPage) {
      loadPhotos(true);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) return;

    try {
      const photoIds = Array.from(selectedPhotos);
      const result = await MediaLibrary.deleteAssetsAsync(photoIds);

      // Only update state if deletion was successful
      if (result) {
        // Remove deleted photos from state
        setPhotos(prev => prev.filter(photo => !selectedPhotos.has(photo.id)));
        setSelectedPhotos(new Set());
        setSelectionMode(false);
      }
    } catch (error) {
      // Check if error is due to user cancellation
      const errorMessage = error instanceof Error ? error.message : String(error);

      // iOS error code 3072 = user cancelled deletion
      if (errorMessage.includes('3072') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('canceled')) {
        // User cancelled - this is normal, don't show error
        return;
      }

      console.error('Error deleting photos:', error);
    }
  };

  const cancelSelection = () => {
    setSelectedPhotos(new Set());
    setSelectionMode(false);
  };

  const openPhoto = (photo: MediaLibrary.Asset) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  const closePhotoModal = () => {
    setModalVisible(false);
    setSelectedPhoto(null);
  };

  const handleSetReference = async (photo: MediaLibrary.Asset) => {
    try {
      const resolvedUri = await resolveAssetUri(photo);
      setAnalysisImageUri(resolvedUri);
      setAnalysisModalVisible(true);
      closePhotoModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze photo');
    }
  };

  const handleEditPhoto = async (photo: MediaLibrary.Asset) => {
    try {
      const resolvedUri = await resolveAssetUri(photo);
      setEditorImageUri(resolvedUri);
      setEditorVisible(true);
      closePhotoModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to load photo for editing');
    }
  };

  const handleEditorClose = () => {
    setEditorVisible(false);
    setEditorImageUri(null);
  };

  const handleEditorSave = (editedUri: string) => {
    // Refresh photos to show the newly saved edit
    loadPhotos();
    handleEditorClose();
  };

  const addPhotosFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const album = await MediaLibrary.getAlbumAsync('PictureThis');
        let albumToUse = album;

        for (const asset of result.assets) {
          if (asset.uri) {
            const createdAsset = await MediaLibrary.createAssetAsync(asset.uri);
            if (albumToUse == null) {
              albumToUse = await MediaLibrary.createAlbumAsync('PictureThis', createdAsset, false);
            } else {
              await MediaLibrary.addAssetsToAlbumAsync([createdAsset], albumToUse, false);
            }
          }
        }

        setPhotos([]);
        setEndCursor(undefined);
        setHasNextPage(true);
        loadPhotos();
      }
    } catch (error) {
      console.error('Error adding photos:', error);
    }
  };

  if (editorVisible && editorImageUri) {
    return (
      <PhotoEditor
        imageUri={editorImageUri}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
      />
    );
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need access to your photos</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading photos...</Text>
      </View>
    );
  }

  // Component to handle individual photo rendering with URI resolution
  const PhotoItem = ({ item }: { item: MediaLibrary.Asset }) => {
    const [resolvedUri, setResolvedUri] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const isSelected = selectedPhotos.has(item.id);

    useEffect(() => {
      resolveAssetUri(item).then(setResolvedUri);
    }, [item.id]);

    return (
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => {
          if (selectionMode) {
            togglePhotoSelection(item.id);
          } else {
            openPhoto(item);
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            togglePhotoSelection(item.id);
          }
        }}
      >
        {resolvedUri && !imageError ? (
          <Image
            source={{ uri: resolvedUri }}
            style={[styles.photo, isSelected && styles.selectedPhoto]}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.photo, styles.placeholderPhoto, isSelected && styles.selectedPhoto]}>
            <Text style={styles.placeholderText}>📷</Text>
          </View>
        )}
        {selectionMode && (
          <View style={styles.checkbox}>
            <View style={[styles.checkboxInner, isSelected && styles.checkboxSelected]} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPhoto = ({ item }: { item: MediaLibrary.Asset }) => {
    return <PhotoItem item={item} />;
  };

  // Component for modal photo content
  const PhotoModalContent = ({ photo }: { photo: MediaLibrary.Asset }) => {
    const [resolvedUri, setResolvedUri] = useState<string | null>(null);

    useEffect(() => {
      resolveAssetUri(photo).then(setResolvedUri);
    }, [photo.id]);

    return resolvedUri ? (
      <Image
        source={{ uri: resolvedUri }}
        style={styles.modalImage}
        resizeMode="contain"
      />
    ) : (
      <View style={styles.modalPlaceholder}>
        <Text style={styles.modalPlaceholderText}>Loading...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      {/* Decorative border elements */}
      <View style={styles.topDecoration}>
        <Text style={styles.decorativeText}>✦ ✧ ✦</Text>
      </View>

      <View style={styles.bottomDecoration}>
        <Text style={styles.decorativeText}>✦ ✧ ✦</Text>
      </View>

      <View style={styles.header}>
        {selectionMode ? (
          <View style={styles.selectionHeader}>
            <TouchableOpacity onPress={cancelSelection}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.selectedCountText}>
              {selectedPhotos.size} selected
            </Text>
            <TouchableOpacity
              onPress={deleteSelectedPhotos}
              disabled={selectedPhotos.size === 0}
            >
              <Text style={[styles.deleteText, selectedPhotos.size === 0 && styles.disabledText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.normalHeader}>
            <View>
              <Text style={styles.headerText}>Photos</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addPhotosFromLibrary}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setSelectionMode(true)}
              >
                <Text style={styles.selectButtonText}>Select</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={photos}
        renderItem={renderPhoto}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMorePhotos}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingFooter}>
              <Text style={styles.loadingText}>Loading more photos...</Text>
            </View>
          ) : null
        }
      />

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

                <View style={styles.modalControls}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditPhoto(selectedPhoto)}
                  >
                    <Ionicons name="create-outline" size={24} color="white" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <SetReferenceButton onPress={() => handleSetReference(selectedPhoto)} />
                </View>

                <PhotoModalContent photo={selectedPhoto} />
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
    backgroundColor: '#e5e0ca',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#e5e0ca',
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#d3c6a2',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 42,
    fontWeight: '300',
    fontFamily: 'Snell Roundhand',
    color: '#8b7355',
    letterSpacing: 2,
    textShadowColor: 'rgba(139, 115, 85, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  countText: {
    fontSize: 14,
    color: '#a69580',
    marginTop: 4,
    fontFamily: 'Snell Roundhand',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 18,
    color: '#8b7355',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Snell Roundhand',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 3,
    paddingRight: 8,
  },
  photoContainer: {
    margin: 4,
    borderRadius: 12,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  photo: {
    width: imageSize - 8,
    height: imageSize - 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d7d2bf',
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  normalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#bba06b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#b19068',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#5a4f3a',
    fontSize: 18,
    fontWeight: '300',
    fontFamily: 'Palatino',
    letterSpacing: 1,
  },
  selectButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#b19068',
  },
  selectButtonText: {
    color: '#8b7355',
    fontSize: 18,
    fontWeight: '300',
    fontFamily: 'Palatino',
    letterSpacing: 1,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#ccc',
  },
  selectedPhoto: {
    opacity: 0.7,
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
  },
  placeholderPhoto: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderText: {
    fontSize: 24,
    color: '#ccc',
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
  modalControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalImage: {
    width: width - 40,
    height: '80%',
  },
  modalPlaceholder: {
    width: width - 40,
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalPlaceholderText: {
    color: 'white',
    fontSize: 18,
  },
  // Decorative border styles
  topDecoration: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },

  decorativeText: {
    fontSize: 20,
    color: '#b19068',
    fontFamily: 'Snell Roundhand',
    opacity: 0.6,
    letterSpacing: 8,
  },

});