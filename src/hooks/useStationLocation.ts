import { useCallback, useEffect, useRef, useState } from 'react';
import { audioStations } from '../data/stations';
import { calculateDistance } from '../utils/location';

type LocationStatus = 'idle' | 'locating' | 'tracking' | 'denied' | 'error' | 'unsupported';

export function useStationLocation(onStationChange: (index: number) => void) {
  const watchIdRef = useRef<number | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [distance, setDistance] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setDistance(null);
    setSpeed(null);
    setStatus('idle');
  }, []);

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    if (watchIdRef.current !== null) return;

    setStatus('locating');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        audioStations.forEach((station, index) => {
          const stationDistance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            station.lat,
            station.lng,
          );
          if (stationDistance < nearestDistance) {
            nearestIndex = index;
            nearestDistance = stationDistance;
          }
        });

        setDistance(nearestDistance);
        setSpeed(position.coords.speed === null ? null : Math.round(position.coords.speed * 3.6));
        setStatus('tracking');
        onStationChange(nearestIndex);
      },
      (error) => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  }, [onStationChange]);

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  return { status, distance, speed, start, stop };
}
