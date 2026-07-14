import { projectYamanoteMeters } from '../data/yamanoteCoordinates.ts';
import { yamanoteRoute, yamanoteRouteStations } from '../data/yamanoteRoute.generated.ts';

interface ProjectedPoint {
  east: number;
  north: number;
}

export interface YamanoteRouteContext {
  distanceToLine: number;
  progress: number;
  stationIndex: number;
}

const projectedRoute = yamanoteRoute.map(([lng, lat]) => projectYamanoteMeters(lng, lat));
const routeSegments = projectedRoute.map((from, index) => {
  const to = projectedRoute[(index + 1) % projectedRoute.length];
  return {
    from,
    east: to.east - from.east,
    north: to.north - from.north,
    length: Math.hypot(to.east - from.east, to.north - from.north),
  };
});
const routeLength = routeSegments.reduce((total, segment) => total + segment.length, 0);

function circularProgressDistance(a: number, b: number) {
  const direct = Math.abs(a - b);
  return Math.min(direct, 1 - direct);
}

function nearestStationIndex(progress: number) {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  yamanoteRouteStations.forEach((station, index) => {
    const distance = circularProgressDistance(progress, station.progress);
    if (distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });
  return nearestIndex;
}

function projectOntoSegment(point: ProjectedPoint, segmentIndex: number) {
  const segment = routeSegments[segmentIndex];
  const lengthSquared = segment.length ** 2;
  const progress = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, (
      (point.east - segment.from.east) * segment.east
      + (point.north - segment.from.north) * segment.north
    ) / lengthSquared));
  const east = segment.from.east + segment.east * progress;
  const north = segment.from.north + segment.north * progress;
  return {
    distance: Math.hypot(point.east - east, point.north - north),
    progress,
  };
}

export function findYamanoteRouteContext(lat: number, lng: number): YamanoteRouteContext {
  const point = projectYamanoteMeters(lng, lat);
  let cumulativeDistance = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  let nearestProgress = 0;

  routeSegments.forEach((segment, index) => {
    const candidate = projectOntoSegment(point, index);
    if (candidate.distance < nearestDistance) {
      nearestDistance = candidate.distance;
      nearestProgress = routeLength === 0
        ? 0
        : (cumulativeDistance + segment.length * candidate.progress) / routeLength;
    }
    cumulativeDistance += segment.length;
  });

  return {
    distanceToLine: nearestDistance,
    progress: nearestProgress,
    stationIndex: nearestStationIndex(nearestProgress),
  };
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadius = 6_371_000;
  const latitude1 = lat1 * Math.PI / 180;
  const latitude2 = lat2 * Math.PI / 180;
  const latitudeDelta = (lat2 - lat1) * Math.PI / 180;
  const longitudeDelta = (lon2 - lon1) * Math.PI / 180;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
