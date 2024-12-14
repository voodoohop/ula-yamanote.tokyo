import { useState, useEffect } from 'react';
import { calculateDistance, getDirection } from '../utils/location';
import { stations } from '../data/stations';
import { abortPreloading } from '../utils/audio';

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

  useEffect(() => {
    if (!isGpsActive) return;

    // Abort any ongoing preloading when GPS becomes active
    abortPreloading();

    function updatePosition(position: GeolocationPosition) {
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
    }

    function watchPosition(highAccuracy: boolean) {
      const id = navigator.geolocation.watchPosition(
        updatePosition,
        (error) => {
          const errorMsg = error.code === 1 ? 'GPS permission denied' :
                          error.code === 2 ? 'GPS position unavailable' :
                          'GPS request timeout';
          console.log('GPS Status:', errorMsg);

          if (error.code === 1) return;
          
          if (highAccuracy) {
            console.log('GPS Status: Falling back to low accuracy');
            watchPosition(false);
          } else {
            // If we're already in low accuracy mode, try again
            watchPosition(false);
          }
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 5000,
          maximumAge: 2000
        }
      );

      return id;
    }

    const watchId = watchPosition(true);
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isGpsActive]);

  return stationData;
}
