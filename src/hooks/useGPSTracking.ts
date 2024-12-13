import { useState, useCallback, useEffect } from 'react';
import { calculateDistance, getDirection } from '../utils/location';
import { stations } from '../data/stations';

export interface StationData {
  name: string;
  japaneseName: string;
  distance: number;
  direction: string;
  speed: number | null;
  userLat: number;
  userLng: number;
}

export function useGPSTracking(isGpsActive: boolean) {
  const [stationData, setStationData] = useState<StationData | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [gpsUpdateReceived, setGpsUpdateReceived] = useState(false);

  const updateInfo = useCallback((position: GeolocationPosition) => {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    
    let closestStation = null;
    let minDistance = Infinity;
    
    stations.forEach((station) => {
      const distance = calculateDistance(userLat, userLng, station.lat, station.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStation = station;
      }
    });

    if (!closestStation) return;

    const direction = getDirection(
      { lat: userLat, lng: userLng },
      { lat: closestStation.lat, lng: closestStation.lng }
    );

    setGpsUpdateReceived(prev => !prev); // Toggle to trigger effects

    setStationData({
      name: closestStation.name,
      japaneseName: closestStation.japaneseName,
      distance: Math.round(minDistance),
      direction,
      speed: position.coords.speed !== null ? Math.round(position.coords.speed * 3.6) : null, // Convert m/s to km/h
      userLat,
      userLng
    });
  }, []);

  useEffect(() => {
    let currentWatchId: number | null = null;

    const setupGPS = async () => {
      if (!isGpsActive) {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          setWatchId(null);
        }
        return;
      }

      try {
        // Check permission first
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          console.log('GPS Status: Permission denied');
          return;
        }

        // Only proceed if still active
        if (!isGpsActive) return;

        const handleError = (error: GeolocationPositionError) => {
          const errorMsg = error.code === 1 ? 'GPS permission denied' :
                          error.code === 2 ? 'GPS position unavailable' :
                          'GPS request timeout';
          console.log('GPS Status:', errorMsg);
        };

        // Get initial position
        navigator.geolocation.getCurrentPosition(updateInfo, handleError, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });

        // Start watching
        currentWatchId = navigator.geolocation.watchPosition(
          updateInfo,
          handleError,
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );

        setWatchId(currentWatchId);
      } catch (error) {
        console.error('Error setting up GPS:', error);
      }
    };

    setupGPS();

    return () => {
      if (currentWatchId !== null) {
        navigator.geolocation.clearWatch(currentWatchId);
      }
    };
  }, [isGpsActive, updateInfo]);

  return { stationData, gpsUpdateReceived };
}
