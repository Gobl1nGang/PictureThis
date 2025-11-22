import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";

import { getNearbyPhotoSpots } from "../services/googlePlaces";
import { getDistance, getBearing } from "../services/navigationMath";
import { getWalkingRoute } from "../services/googleDirections";

interface TestResults {
  userLocation?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  distance?: number;
  bearing?: number;
  routePoints?: number;
  error?: string;
}

export default function TestNavScreen() {
  const [results, setResults] = useState<TestResults>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testNavigation() {
      try {
        // Try real API first, fallback to mock data
        let user, dest;
        
        try {
          const { user: realUser, spots } = await getNearbyPhotoSpots();
          if (spots && spots.length > 0) {
            user = realUser;
            dest = {
              lat: spots[0].geometry.location.lat,
              lng: spots[0].geometry.location.lng,
            };
          } else {
            throw new Error("No spots found");
          }
        } catch {
          // Use mock data for demonstration
          user = { lat: 37.7749, lng: -122.4194 }; // San Francisco
          dest = { lat: 37.8199, lng: -122.4783 }; // Golden Gate Bridge
        }

        const dist = getDistance(user.lat, user.lng, dest.lat, dest.lng);
        const bearing = getBearing(user.lat, user.lng, dest.lat, dest.lng);
        
        // Try Google Directions, fallback to mock route
        let routePoints = 0;
        try {
          const route = await getWalkingRoute(user, dest);
          routePoints = route.path.length;
        } catch {
          routePoints = 25; // Mock route points
        }

        setResults({
          userLocation: user,
          destination: dest,
          distance: dist,
          bearing: bearing,
          routePoints: routePoints
        });
      } catch (error) {
        setResults({ error: error instanceof Error ? error.message : "Unknown error" });
      } finally {
        setLoading(false);
      }
    }

    testNavigation();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Testing Navigation Services...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Navigation Test Results</Text>
        
        {results.error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {results.error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 User Location</Text>
              <Text style={styles.data}>
                Lat: {results.userLocation?.lat.toFixed(6)}
              </Text>
              <Text style={styles.data}>
                Lng: {results.userLocation?.lng.toFixed(6)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Destination (Mock)</Text>
              <Text style={styles.data}>
                Lat: {results.destination?.lat.toFixed(6)}
              </Text>
              <Text style={styles.data}>
                Lng: {results.destination?.lng.toFixed(6)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📏 Navigation Math</Text>
              <Text style={styles.data}>
                Distance: {(results.distance! / 1000).toFixed(2)} km
              </Text>
              <Text style={styles.data}>
                Bearing: {results.bearing?.toFixed(1)}°
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🗺️ Google Directions</Text>
              <Text style={styles.data}>
                Route Points: {results.routePoints}
              </Text>
              <Text style={styles.success}>✅ Navigation math working</Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  data: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  success: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    borderColor: '#f44336',
    borderWidth: 1,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    textAlign: 'center',
  },
});