import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator, Dimensions, Linking, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNearbyPhotoSpots } from '../services/googlePlaces';
import { getDistance } from '../services/navigationMath';


const { width, height } = Dimensions.get('window');

interface PhotoSpot {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  photos?: Array<{
    photo_reference: string;
  }>;
}

interface PhotoSpotsDropdownProps {
  visible: boolean;
  onClose: () => void;
}

export default function PhotoSpotsDropdown({ visible, onClose }: PhotoSpotsDropdownProps) {
  const [spots, setSpots] = useState<PhotoSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<PhotoSpot | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    if (visible) {
      loadPhotoSpots();
    }
  }, [visible]);

  const handleGetDirections = (spot: PhotoSpot) => {
    const { lat, lng } = spot.geometry.location;
    const url = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open maps app');
        }
      })
      .catch(() => Alert.alert('Error', 'Unable to open maps app'));
  };

  const getPhotoUrl = (spot: PhotoSpot) => {
    if (spot.photos && spot.photos.length > 0) {
      const photoRef = spot.photos[0].photo_reference;
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      // Handle new Places API photo format
      if (photoRef && photoRef.startsWith('places/')) {
        return `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${apiKey}`;
      }
      
      // Handle old Places API photo format
      if (photoRef) {
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`;
      }
    }
    return null;
  };

  const loadPhotoSpots = async () => {
    setLoading(true);
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const apiKeyStatus = apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'Missing';
    setDebugInfo(`🔍 API Key: ${apiKeyStatus}\nAttempting to load photo spots...`);
    
    try {
      const { user, spots: nearbySpots } = await getNearbyPhotoSpots();
      setUserLocation(user);
      
      if (nearbySpots && nearbySpots.length > 0) {
        // Sort spots by distance from user
        const sortedSpots = nearbySpots.sort((a: PhotoSpot, b: PhotoSpot) => {
          const distanceA = getDistance(user.lat, user.lng, a.geometry.location.lat, a.geometry.location.lng);
          const distanceB = getDistance(user.lat, user.lng, b.geometry.location.lat, b.geometry.location.lng);
          return distanceA - distanceB;
        });
        
        setSpots(sortedSpots);
        setDebugInfo('');
        setLoading(false);
        return;
      } else {
        setDebugInfo(`⚠️ No photo spots found near your location (${user.lat.toFixed(4)}, ${user.lng.toFixed(4)})`);
      }
    } catch (error) {
      let errorDetails = 'Unknown error';
      
      if (error instanceof Error) {
        errorDetails = error.message;
        
        // Try to parse more details from the error
        if (error.message.includes('request denied')) {
          errorDetails += '\n❌ Common causes:';
          errorDetails += '\n- API key invalid/expired';
          errorDetails += '\n- Places API not enabled';
          errorDetails += '\n- Billing not set up';
          errorDetails += '\n- Mobile app restrictions';
          errorDetails += '\n- Need to wait 5-10 min after changes';
        }
      }
      
      setDebugInfo(`❌ Places API Error:\n${errorDetails}`);
    }
    
    // Fallback to mock data  
    setUserLocation({ lat: 37.7749, lng: -122.4194 });
      setSpots([
        {
          place_id: '1',
          name: 'Golden Gate Bridge',
          vicinity: 'San Francisco, CA',
          geometry: { location: { lat: 37.8199, lng: -122.4783 } },
          rating: 4.7
        },
        {
          place_id: '2', 
          name: 'Lombard Street',
          vicinity: 'Russian Hill, San Francisco',
          geometry: { location: { lat: 37.8021, lng: -122.4187 } },
          rating: 4.2
        },
        {
          place_id: '3',
          name: 'Pier 39',
          vicinity: 'Fishermans Wharf, San Francisco',
          geometry: { location: { lat: 37.8087, lng: -122.4098 } },
          rating: 4.1
        }
      ]);
    setDebugInfo(prev => prev + '\n\n🎭 FALLBACK: Using mock San Francisco spots\nℹ️ The app works! Just need to fix Google API access');
    setLoading(false);
  };

  const renderSpotItem = ({ item }: { item: PhotoSpot }) => {
    const distance = userLocation ? getDistance(
      userLocation.lat,
      userLocation.lng,
      item.geometry.location.lat,
      item.geometry.location.lng
    ) : 0;

    return (
      <TouchableOpacity style={styles.spotItem} onPress={() => setSelectedSpot(item)}>
        <View style={styles.spotInfo}>
          <Text style={styles.spotName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.spotAddress} numberOfLines={1}>{item.vicinity}</Text>
          <View style={styles.spotMeta}>
            <Text style={styles.distance}>{(distance / 1000).toFixed(1)} km</Text>
            {item.rating && (
              <View style={styles.rating}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.dropdown}>
          <View style={styles.header}>
            <Text style={styles.title}>Photo Spots Nearby</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {debugInfo && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Finding photo spots...</Text>
            </View>
          ) : spots.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No photo spots found</Text>
            </View>
          ) : (
            <View style={styles.spotsList}>
              <FlatList
                data={spots}
                renderItem={renderSpotItem}
                keyExtractor={(item) => item.place_id}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>

        {selectedSpot && (
          <Modal visible={!!selectedSpot} animationType="fade" transparent>
            <View style={styles.detailModalContainer}>
              <View style={styles.detailModal}>
                <TouchableOpacity style={styles.closeDetail} onPress={() => setSelectedSpot(null)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>

                {getPhotoUrl(selectedSpot) ? (
                  <Image 
                    source={{ uri: getPhotoUrl(selectedSpot)! }}
                    style={styles.spotImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={50} color="white" />
                    <Text style={styles.photoText}>📸 {selectedSpot.name}</Text>
                  </View>
                )}

                <View style={styles.detailContent}>
                  <Text style={styles.detailName}>{selectedSpot.name}</Text>
                  <Text style={styles.detailAddress}>{selectedSpot.vicinity}</Text>
                  
                  {userLocation && (
                    <View style={styles.routeInfo}>
                      <View style={styles.routeItem}>
                        <Ionicons name="walk" size={20} color="#007AFF" />
                        <Text style={styles.routeText}>
                          {Math.ceil(getDistance(
                            userLocation.lat,
                            userLocation.lng,
                            selectedSpot.geometry.location.lat,
                            selectedSpot.geometry.location.lng
                          ) / 83)} min walk
                        </Text>
                      </View>
                      <View style={styles.routeItem}>
                        <Ionicons name="location" size={20} color="#007AFF" />
                        <Text style={styles.routeText}>
                          {(getDistance(
                            userLocation.lat,
                            userLocation.lng,
                            selectedSpot.geometry.location.lat,
                            selectedSpot.geometry.location.lng
                          ) / 1000).toFixed(1)} km
                        </Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.directionsButton}
                    onPress={() => handleGetDirections(selectedSpot)}
                  >
                    <Ionicons name="navigate" size={20} color="white" />
                    <Text style={styles.directionsText}>Get Directions</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dropdown: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  spotsList: {
    height: height * 0.5,
    paddingHorizontal: 0,
  },
  spotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  spotInfo: {
    flex: 1,
  },
  spotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  spotAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  spotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distance: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModal: {
    width: width - 40,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
  },
  closeDetail: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  spotImage: {
    width: '100%',
    height: 200,
  },
  detailContent: {
    padding: 20,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  routeInfo: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  directionsButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  directionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});