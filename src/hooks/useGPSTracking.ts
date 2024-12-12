import { useState, useCallback, useEffect } from 'react';
import { calculateDistance, getDirection } from '../utils/location';
import { stationCoordinates, japaneseStations } from '../data/stations';

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

  const updateInfo = useCallback((position: GeolocationPosition) => {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    
    let closestStation = null;
    let minDistance = Infinity;
    
    stationCoordinates.forEach((station, index) => {
      const distance = calculateDistance(userLat, userLng, station.lat, station.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStation = index;
      }
    });

    if (closestStation === null) return;

    const direction = getDirection(
      { lat: userLat, lng: userLng },
      { lat: stationCoordinates[closestStation].lat, lng: stationCoordinates[closestStation].lng }
    );

    setStationData({
      name: stationCoordinates[closestStation].name,
      japaneseName: japaneseStations[closestStation][0],
      distance: Math.round(minDistance),
      direction,
      speed: position.coords.speed !== null ? Math.round(position.coords.speed * 3.6) : null, // Convert m/s to km/h
      userLat,
      userLng
    });
  }, []);

  useEffect(() => {
    if (!isGpsActive) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      updateInfo,
      (error) => {
        console.error('GPS Error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isGpsActive, updateInfo]);

  return stationData;
}
