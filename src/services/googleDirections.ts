const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Get walking directions between two coordinate points
 */
export async function getWalkingRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
) {
  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${origin.lat},${origin.lng}` +
    `&destination=${destination.lat},${destination.lng}` +
    `&mode=walking` +
    `&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error("No routes found");
  }

  // Decode polyline (list of coordinates for the path)
  const polyline = data.routes[0].overview_polyline.points;

  const points = decodePolyline(polyline);

  return {
    path: points, // [{lat, lng}, ...]
    raw: data,
  };
}

// Polyline decoding algorithm
function decodePolyline(encoded: string) {
  let points = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }
  return points;
}
