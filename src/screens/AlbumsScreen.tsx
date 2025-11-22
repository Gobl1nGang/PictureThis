import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const numColumns = 3;
const imageSize = (width - 6) / numColumns;

export default function AlbumsScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string>();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [uriCache, setUriCache] = useState<Map<string, string>>(new Map());
  
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
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 50,
        sortBy: MediaLibrary.SortBy.creationTime,
        after: loadMore ? endCursor : undefined,
      });

      if (loadMore) {
        setPhotos(prev => [...prev, ...result.assets]);  // <-- append
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
      await MediaLibrary.deleteAssetsAsync(photoIds);
      
      // Remove deleted photos from state
      setPhotos(prev => prev.filter(photo => !selectedPhotos.has(photo.id)));
      setSelectedPhotos(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Error deleting photos:', error);
    }
  };

  const cancelSelection = () => {
    setSelectedPhotos(new Set());
    setSelectionMode(false);
  };

  const addPhotosFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        // Save selected photos to device library (they're already there, but this refreshes our view)
        for (const asset of result.assets) {
          if (asset.uri) {
            await MediaLibrary.saveToLibraryAsync(asset.uri);
          }
        }
        
        // Refresh the photo list
        setPhotos([]);
        setEndCursor(undefined);
        setHasNextPage(true);
        loadPhotos();
      }
    } catch (error) {
      console.error('Error adding photos:', error);
    }
  };

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

  return (
    <View style={styles.screenContainer}>
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
              <Text style={styles.headerText}>Albums</Text>
              <Text style={styles.countText}>{photos.length} photos</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={addPhotosFromLibrary}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  text: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
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
    padding: 2,
  },
  photoContainer: {
    margin: 1,
  },
  photo: {
    width: imageSize,
    height: imageSize,
    backgroundColor: '#f0f0f0',
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
    backgroundColor: 'rgba(128, 128, 128, 0.7)',
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.7)',
    borderRadius: 6,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
});