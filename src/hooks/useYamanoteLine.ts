import { useEffect, useRef, useState } from 'react';
import { stations } from '../data/stations';
import { Train, createInitialTrains, updateTrainPositions, calculateTrainPosition } from '../utils/trainSimulation';
import { 
  calculateBounds,
  createCoordinateTransformer,
  calculateSVGBounds,
  calculateCenteringOffset,
  isPointWithinBounds,
  calculateDistance,
  calculateBearing
} from '../utils/mapUtils';
import { Point, TrainPosition } from '../types/yamanote';

export const useTrainAnimation = () => {
  const [trains, setTrains] = useState<Train[]>([]);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const UPDATE_INTERVAL = 50; // Update every 50ms instead of every frame

  useEffect(() => {
    setTrains(createInitialTrains());
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startAnimation = (pointsRef: React.MutableRefObject<Point[]>) => {
    if (pointsRef.current.length === 0) return;
    
    const animate = (currentTime: number) => {
      if (currentTime - lastUpdateRef.current >= UPDATE_INTERVAL) {
        lastUpdateRef.current = currentTime;
        setTrains(prevTrains => updateTrainPositions(prevTrains, UPDATE_INTERVAL));
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  };

  const getTrainPositions = (points: Point[]): TrainPosition[] => {
    return trains
      .map(train => calculateTrainPosition(train, points))
      .filter((pos): pos is TrainPosition => pos !== null);
  };

  return { trains, startAnimation, getTrainPositions };
};

export const useCoordinateTransformation = (
  width: number,
  height: number,
  yamanoteStations: string[]
) => {
  const [transformedPoints, setTransformedPoints] = useState<Point[]>([]);
  const pointsRef = useRef<Point[]>([]);

  useEffect(() => {
    // Get coordinates for Yamanote line stations in correct order
    const yamanoteCoordinates = yamanoteStations
      .map(name => stations.find(s => s.name === name))
      .filter((station): station is typeof stations[number] => station !== undefined);

    if (yamanoteCoordinates.length === 0) {
      console.error('No valid coordinates found for Yamanote stations');
      return;
    }

    // Calculate bounds and create coordinate transformer
    const bounds = calculateBounds(yamanoteCoordinates);
    const transformCoord = createCoordinateTransformer(bounds, width, height);

    // Transform and store points
    const points = yamanoteCoordinates.map(station => 
      transformCoord({ lat: station.lat, lng: station.lng })
    );

    setTransformedPoints(points);
    pointsRef.current = points;
  }, []); // Only run once on mount

  return { transformedPoints, pointsRef };
};

export const useUserPosition = (
  userPosition: { lat: number; lng: number } | undefined,
  closestStation: string | undefined,
  width: number,
  height: number
) => {
  if (!userPosition) {
    return null;
  }

  const bounds = calculateBounds(stations);
  const transformCoord = createCoordinateTransformer(bounds, width, height);
  const point = transformCoord(userPosition);
  const padding = 50;

  if (isPointWithinBounds(point, width, height, padding)) {
    const closestStationPoint = closestStation ? 
      transformCoord(stations.find(s => s.name === closestStation)!) : 
      undefined;
    
    return {
      userPoint: { point, isWithinBounds: true },
      connectionPoint: closestStationPoint,
      bearing: undefined,
      distance: undefined
    };
  }

  // Calculate off-map indicator position
  const closestStationData = closestStation 
    ? stations.find(s => s.name === closestStation)
    : null;
  const targetCoords = closestStationData 
    ? { lat: closestStationData.lat, lng: closestStationData.lng }
    : { 
        lat: bounds.minLat + (bounds.maxLat - bounds.minLat) / 2,
        lng: bounds.minLng + (bounds.maxLng - bounds.minLng) / 2 
      };

  const bearing = calculateBearing(userPosition, targetCoords);
  const distance = calculateDistance(userPosition, targetCoords);
  const radius = width / 2 + 20;
  
  // Calculate edge position without flipping
  const edgeX = width/2 + radius * Math.cos(bearing);
  const edgeY = height/2 - radius * Math.sin(bearing);

  return {
    userPoint: {
      point,
      isWithinBounds: false,
      indicator: { edgeX, edgeY, bearing: -bearing, distance }
    },
    connectionPoint: undefined,
    bearing,
    distance
  };
};
