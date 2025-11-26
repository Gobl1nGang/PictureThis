import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SectionList, Image, Dimensions, TouchableOpacity, Platform, Modal, SafeAreaView, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SetReferenceButton, AnalysisModal } from '../features/reference-photo';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import PhotoEditor from './PhotoEditor';
import { SocialShareModal } from '../components/SocialShareModal';


const { width } = Dimensions.get('window');
const numColumns = 3;
const imageSize = (width - 6) / numColumns;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 35,
    backgroundColor: 'rgba(10, 10, 20, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 217, 100, 0.3)',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(76, 217, 100, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  countText: {
    fontSize: 14,
    color: '#4CD964',
    marginTop: 4,
    fontFamily: 'Snell Roundhand',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CD964',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#4CD964',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CD964',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  selectButtonText: {
    color: '#4CD964',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  modernButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: '#FF3B30',
  },
  cancelText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#ccc',
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


  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(5, 5, 5, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionHeaderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  photoContainer: {
    width: imageSize,
    height: imageSize,
    marginRight: 2,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  selectedPhotoContainer: {
    opacity: 0.7,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#4CD964',
    borderColor: '#4CD964',
  },
  favoriteBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function PhotosScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [permission, requestPermission] = MediaLibrary.usePermissions({ writeOnly: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string>();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [favoritePhotos, setFavoritePhotos] = useState<Set<string>>(new Set());
  const [groupedPhotos, setGroupedPhotos] = useState<any[]>([]);
  const [uriCache, setUriCache] = useState<Map<string, string>>(new Map());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<MediaLibrary.Asset | null>(null);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [analysisImageUri, setAnalysisImageUri] = useState<string>('');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorImageUri, setEditorImageUri] = useState<string | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareImageUri, setShareImageUri] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  // Group photos by date
  useEffect(() => {
    if (photos.length > 0) {
      const groups: { [key: string]: any[] } = {};

      photos.forEach(photo => {
        const date = new Date(photo.creationTime);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        if (date.toDateString() === today.toDateString()) {
          dateKey = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
          dateKey = 'Yesterday';
        }

        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(photo);
      });

      const sections = Object.keys(groups).map(date => ({
        title: date,
        data: groups[date],
      }));

      setGroupedPhotos(sections);
    }
  }, [photos]);

  const toggleFavorite = (photoId: string) => {
    const newFavorites = new Set(favoritePhotos);
    if (newFavorites.has(photoId)) {
      newFavorites.delete(photoId);
    } else {
      newFavorites.add(photoId);
    }
    setFavoritePhotos(newFavorites);
    // In a real app, you would save this to AsyncStorage or backend
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

  const handleSharePhoto = async (photo: MediaLibrary.Asset) => {
    try {
      const resolvedUri = await resolveAssetUri(photo);
      setShareImageUri(resolvedUri);
      setShareModalVisible(true);
      closePhotoModal();
    } catch (error) {
      Alert.alert('Error', 'Failed to load photo for sharing');
    }
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

  const renderPhotoItem = ({ item, index }: { item: any, index: number }) => {
      // Determine if this item is the last in a row to adjust margin
      // This is tricky with SectionList as index resets per section
      // Simplified grid logic for SectionList

      return (
        <TouchableOpacity
          style={[
            styles.photoContainer,
            selectedPhotos.has(item.id) && styles.selectedPhotoContainer
          ]}
          onPress={() => selectionMode ? togglePhotoSelection(item.id) : openPhoto(item)}
          onLongPress={() => {
            setSelectionMode(true);
            togglePhotoSelection(item.id);
          }}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: item.uri }}
            style={styles.photo}
            resizeMode="cover"
          />

          {selectionMode && (
            <View style={styles.selectionOverlay}>
              <View style={[
                styles.checkbox,
                selectedPhotos.has(item.id) && styles.checkedCheckbox
              ]}>
                {selectedPhotos.has(item.id) && (
                  <Ionicons name="checkmark" size={16} color="#000" />
                )}
              </View>
            </View>
          )}

          {!selectionMode && favoritePhotos.has(item.id) && (
            <View style={styles.favoriteBadge}>
              <Ionicons name="heart" size={12} color="#4CD964" />
            </View>
          )}
        </TouchableOpacity>
      );
    };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const formatDataForGrid = (sections: any[]) => {
    return sections.map(section => {
      const rows = [];
      for (let i = 0; i < section.data.length; i += numColumns) {
        rows.push({
          id: section.data[i].id,
          photos: section.data.slice(i, i + numColumns),
          type: 'row'
        });
      }
      return {
        title: section.title,
        data: rows
      };
    });
  };

  const renderGridRow = ({ item }: { item: any }) => (
    <View style={styles.gridRow}>
      {item.photos.map((photo: any) => (
        <TouchableOpacity
          key={photo.id}
          style={[
            styles.photoContainer,
            selectedPhotos.has(photo.id) && styles.selectedPhotoContainer
          ]}
          onPress={() => selectionMode ? togglePhotoSelection(photo.id) : openPhoto(photo)}
          onLongPress={() => {
            setSelectionMode(true);
            togglePhotoSelection(photo.id);
          }}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: photo.uri }}
            style={styles.photo}
            resizeMode="cover"
          />

          {selectionMode && (
            <View style={styles.selectionOverlay}>
              <View style={[
                styles.checkbox,
                selectedPhotos.has(photo.id) && styles.checkedCheckbox
              ]}>
                {selectedPhotos.has(photo.id) && (
                  <Ionicons name="checkmark" size={16} color="#000" />
                )}
              </View>
            </View>
          )}

          {!selectionMode && favoritePhotos.has(photo.id) && (
            <View style={styles.favoriteBadge}>
              <Ionicons name="heart" size={12} color="#4CD964" />
            </View>
          )}
        </TouchableOpacity>
      ))}
      {[...Array(numColumns - item.photos.length)].map((_, i) => (
        <View key={`empty-${i}`} style={[styles.photoContainer, { backgroundColor: 'transparent' }]} />
      ))}
    </View>
  );

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


        <Animated.View style={[styles.header, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          {selectionMode ? (
            <Animated.View style={[styles.selectionHeader, {
              transform: [{ scale: scaleAnim }]
            }]}>
              <TouchableOpacity onPress={cancelSelection} style={styles.modernButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Animated.Text style={[styles.selectedCountText, {
                transform: [{ scale: scaleAnim }]
              }]}>
                {selectedPhotos.size} selected
              </Animated.Text>
              <TouchableOpacity
                onPress={deleteSelectedPhotos}
                disabled={selectedPhotos.size === 0}
                style={[styles.modernButton, styles.deleteButton]}
              >
                <Text style={[styles.deleteText, selectedPhotos.size === 0 && styles.disabledText]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.normalHeader, {
              transform: [{ scale: scaleAnim }]
            }]}>
              <Animated.View style={{
                transform: [{
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, -30]
                  })
                }]
              }}>
                <Text style={styles.headerText}>Photos</Text>
              </Animated.View>
              <Animated.View style={[styles.headerButtons, {
                transform: [{
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 30]
                  })
                }]
              }]}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addPhotosFromLibrary}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setSelectionMode(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectButtonText}>Select</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}
        </Animated.View>

        <SectionList
          sections={formatDataForGrid(groupedPhotos)}
          keyExtractor={(item, index) => item.id}
          renderItem={renderGridRow}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={true}
          onEndReached={loadMorePhotos}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingFooter}>
                <Text style={styles.loadingText}>Loading more...</Text>
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

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={async () => {
                        const resolvedUri = await resolveAssetUri(selectedPhoto);
                        global.inspirationImageUri = resolvedUri;
                        Alert.alert('Set as Inspiration', 'This photo is now available as an overlay in the camera');
                        closePhotoModal();
                      }}
                    >
                      <Ionicons name="heart-outline" size={24} color="white" />
                      <Text style={styles.editButtonText}>Inspire</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleSharePhoto(selectedPhoto)}
                    >
                      <Ionicons name="share-outline" size={24} color="white" />
                      <Text style={styles.editButtonText}>Share</Text>
                    </TouchableOpacity>
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

      {/* Social Share Modal */}
      {shareModalVisible && shareImageUri && (
        <SocialShareModal
          visible={shareModalVisible}
          onClose={() => {
            setShareModalVisible(false);
            setShareImageUri(null);
          }}
          imageUri={shareImageUri}
        />
      )}
    </SafeAreaView>
  );
}
