import * as Location from "expo-location";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function getUserLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Location permission denied");

  const loc = await Location.getCurrentPositionAsync({});
  return {
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
  };
}

/**
 * Get nearby photo spots using Google Places API
 */
export async function getNearbyPhotoSpots() {
  const user = await getUserLocation();

  // Use the new Places API (Text Search)
  const url = 'https://places.googleapis.com/v1/places:searchText';
  
  const requestBody = {
    textQuery: 'tourist attractions near me',
    locationBias: {
      circle: {
        center: {
          latitude: user.lat,
          longitude: user.lng
        },
        radius: 10000
      }
    },
    maxResultCount: 10
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.photos'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await res.json();

  if (data.places && data.places.length > 0) {
    // Convert new API format to old format for compatibility
    const convertedSpots = data.places.map((place: any, index: number) => ({
      place_id: place.id || `new_api_${index}`,
      name: place.displayName?.text || 'Unknown Place',
      vicinity: place.formattedAddress || 'Unknown Address',
      geometry: {
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0
        }
      },
      rating: place.rating,
      photos: place.photos ? [{ photo_reference: place.photos[0]?.name }] : undefined
    }));

    return {
      user,
      spots: convertedSpots,
    };
  }

  return {
    user,
    spots: [],
  };
}
