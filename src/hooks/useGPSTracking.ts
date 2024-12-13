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
    if (!isGpsActive || watchId !== null) {
      return;
    }

    const handleError = (error: GeolocationPositionError) => {
      const errorMsg = error.code === 1 ? 'GPS permission denied' :
                      error.code === 2 ? 'GPS position unavailable' :
                      'GPS request timeout';
      console.log('GPS Status:', errorMsg);
    };

    const id = navigator.geolocation.watchPosition(
      updateInfo,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    setWatchId(id);

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    };
  }, [isGpsActive, updateInfo, watchId]);

  return stationData;
}
