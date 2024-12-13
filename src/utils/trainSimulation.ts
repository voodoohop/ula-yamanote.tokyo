interface Point {
  x: number;
  y: number;
}

export interface Train {
  id: number;
  progress: number; // 0 to 1, representing position along the entire line
  direction: 'clockwise' | 'counterclockwise';
}

export const TOTAL_TRAINS = 24; // 12 trains in each direction
export const CIRCUIT_TIME_MS = 8 * 60 * 1000; // 8 minutes in milliseconds (3x faster than real-time)

export function createInitialTrains(): Train[] {
  const halfLength = TOTAL_TRAINS / 2;
  const spacing = 1 / halfLength;
  
  return Array.from({ length: TOTAL_TRAINS }, (_, i) => {
    const isClockwise = i < halfLength;
    const indexInDirection = isClockwise ? i : (i - halfLength);
    // Add offset for counterclockwise trains to stagger them between clockwise trains
    const offset = isClockwise ? 0 : spacing / 2;
    
    return {
      id: i,
      progress: (indexInDirection * spacing + offset) % 1,
      direction: isClockwise ? 'clockwise' : 'counterclockwise'
    };
  });
}

export function updateTrainPositions(trains: Train[], deltaTime: number): Train[] {
  const progressPerMs = 1 / CIRCUIT_TIME_MS;
  const progressDelta = deltaTime * progressPerMs;
  
  return trains.map(train => ({
    ...train,
    progress: train.direction === 'clockwise' 
      ? (train.progress + progressDelta) % 1
      : (train.progress - progressDelta + 1) % 1
  }));
}

export function calculateTrainPosition(
  train: Train,
  points: Point[]
): { x: number; y: number; angle: number } | null {
  if (!points || points.length === 0 || !points[0]?.x) {
    return null;
  }

  const totalPoints = points.length;
  const progressInPoints = train.progress * totalPoints;
  const currentPointIndex = Math.floor(progressInPoints) % totalPoints;
  const nextPointIndex = (currentPointIndex + 1) % totalPoints;
  const pointProgress = progressInPoints - Math.floor(progressInPoints);
  
  const currentPoint = points[currentPointIndex];
  const nextPoint = points[nextPointIndex];
  
  if (!currentPoint || !nextPoint) {
    return null;
  }
  
  const x = currentPoint.x + (nextPoint.x - currentPoint.x) * pointProgress;
  const y = currentPoint.y + (nextPoint.y - currentPoint.y) * pointProgress;
  
  const angle = Math.atan2(
    nextPoint.y - currentPoint.y,
    nextPoint.x - currentPoint.x
  ) * 180 / Math.PI;
  
  return { x, y, angle };
}
