import { useEffect, useState } from 'react';
import { Point } from '../types/yamanote';
import { createCoordinateTransformer, calculateBounds } from '../utils/mapUtils';
import { stations } from '../data/stations';

export const useTrainCoordinates = (
  trainPositions: any[],
  width: number,
  height: number
) => {
  const [transformedTrains, setTransformedTrains] = useState<(Point & { id: string })[]>([]);

  useEffect(() => {
    if (!trainPositions.length) return;

    // Get all coordinates including stations and trains
    const allCoordinates = [
      ...stations.map(s => ({ lat: s.lat, lng: s.lng })),
      ...trainPositions.map(train => ({ 
        lat: train.position.latitude, 
        lng: train.position.longitude 
      }))
    ];

    // Calculate bounds and create transformer
    const bounds = calculateBounds(allCoordinates);
    const transformCoord = createCoordinateTransformer(bounds, width, height);

    // Transform train positions
    const transformed = trainPositions.map(train => ({
      ...transformCoord({ 
        lat: train.position.latitude, 
        lng: train.position.longitude 
      }),
      id: train.id
    }));

    setTransformedTrains(transformed);
  }, [trainPositions, width, height]);

  return transformedTrains;
};
