interface Point {
  x: number;
  y: number;
}

export interface Train {
  id: number;
  progress: number; // 0 to 1, representing position along the entire line
}

export const TOTAL_TRAINS = 25;
export const CIRCUIT_TIME_MS = 6 * 60 * 1000; // 6 minutes in milliseconds (10x faster than real-time)

export function createInitialTrains(): Train[] {
  return Array.from({ length: TOTAL_TRAINS }, (_, i) => ({
    id: i,
    progress: i / TOTAL_TRAINS
  }));
}

export function updateTrainPositions(trains: Train[], deltaTime: number): Train[] {
  const progressPerMs = 1 / CIRCUIT_TIME_MS;
  const progressDelta = deltaTime * progressPerMs;
  
  return trains.map(train => ({
    ...train,
    progress: (train.progress + progressDelta) % 1
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
