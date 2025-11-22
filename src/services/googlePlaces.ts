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

  const radius = 2000; // meters
  const types = "tourist_attraction|park|point_of_interest";

  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${user.lat},${user.lng}` +
    `&radius=${radius}` +
    `&types=${types}` +
    `&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    user,
    spots: data.results,
  };
}
