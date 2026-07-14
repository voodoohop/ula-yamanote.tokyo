import { useCallback, useEffect, useRef, useState } from 'react';
import { stations } from '../data/stations';
import { calculateDistance, findYamanoteRouteContext } from '../utils/location';

type LocationStatus = 'idle' | 'locating' | 'tracking' | 'denied' | 'error' | 'unsupported';
const LINE_CONTEXT_RADIUS_METERS = 1_000;

export function useStationLocation(onStationChange: (index: number) => void) {
  const watchIdRef = useRef<number | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [distance, setDistance] = useState<number | null>(null);
  const [lineDistance, setLineDistance] = useState<number | null>(null);
  const [isNearLine, setIsNearLine] = useState(false);
  const [speed, setSpeed] = useState<number | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setDistance(null);
    setLineDistance(null);
    setIsNearLine(false);
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
    setDistance(null);
    setLineDistance(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const context = findYamanoteRouteContext(
          position.coords.latitude,
          position.coords.longitude,
        );
        const nearestStation = stations[context.stationIndex];
        const stationDistance = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          nearestStation.lat,
          nearestStation.lng,
        );
        const accuracyAllowance = Number.isFinite(position.coords.accuracy)
          ? Math.min(position.coords.accuracy, 250)
          : 0;
        const isWithinLineContext = context.distanceToLine
          <= LINE_CONTEXT_RADIUS_METERS + accuracyAllowance;
        setDistance(stationDistance);
        setLineDistance(context.distanceToLine);
        setIsNearLine(isWithinLineContext);
        setSpeed(position.coords.speed === null ? null : Math.round(position.coords.speed * 3.6));
        setStatus('tracking');
        if (isWithinLineContext) onStationChange(context.stationIndex);
      },
      (error) => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        setDistance(null);
        setLineDistance(null);
        setIsNearLine(false);
        setSpeed(null);
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  }, [onStationChange]);

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  return { status, distance, lineDistance, isNearLine, speed, start, stop };
}
