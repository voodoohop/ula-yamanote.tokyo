import { yamanoteRoute, yamanoteRouteStations } from '../data/yamanoteRoute.generated';

export interface RoutePose {
  bearing: number;
  lat: number;
  lng: number;
}

type Coordinate = readonly [number, number];

const EARTH_RADIUS_METERS = 6_371_000;
const radians = Math.PI / 180;

function haversineMeters(a: Coordinate, b: Coordinate) {
  const latitudeA = a[1] * radians;
  const latitudeB = b[1] * radians;
  const latitudeDelta = (b[1] - a[1]) * radians;
  const longitudeDelta = (b[0] - a[0]) * radians;
  const sinLatitude = Math.sin(latitudeDelta / 2);
  const sinLongitude = Math.sin(longitudeDelta / 2);
  const value = sinLatitude ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * sinLongitude ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

const segmentLengths = yamanoteRoute.slice(1).map((coordinate, index) => (
  haversineMeters(yamanoteRoute[index], coordinate)
));
const cumulativeLengths = segmentLengths.reduce<number[]>((lengths, segmentLength) => {
  lengths.push(lengths[lengths.length - 1] + segmentLength);
  return lengths;
}, [0]);
const routeLength = cumulativeLengths[cumulativeLengths.length - 1];

function normalizeProgress(progress: number) {
  return ((progress % 1) + 1) % 1;
}

function routeSampleAt(progress: number) {
  const distance = normalizeProgress(progress) * routeLength;
  let low = 0;
  let high = segmentLengths.length - 1;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (cumulativeLengths[middle + 1] < distance) low = middle + 1;
    else high = middle;
  }

  const segmentStart = cumulativeLengths[low];
  const segmentProgress = segmentLengths[low] === 0
    ? 0
    : (distance - segmentStart) / segmentLengths[low];
  const start = yamanoteRoute[low];
  const end = yamanoteRoute[low + 1];
  return {
    coordinate: [
      start[0] + (end[0] - start[0]) * segmentProgress,
      start[1] + (end[1] - start[1]) * segmentProgress,
    ] as Coordinate,
    segmentIndex: low,
    segmentProgress,
  };
}

function routeCoordinateAt(progress: number) {
  return routeSampleAt(progress).coordinate;
}

function bearingBetween(start: Coordinate, end: Coordinate) {
  const startLatitude = start[1] * radians;
  const endLatitude = end[1] * radians;
  const longitudeDelta = (end[0] - start[0]) * radians;
  const y = Math.sin(longitudeDelta) * Math.cos(endLatitude);
  const x = Math.cos(startLatitude) * Math.sin(endLatitude)
    - Math.sin(startLatitude) * Math.cos(endLatitude) * Math.cos(longitudeDelta);
  return (Math.atan2(y, x) / radians + 360) % 360;
}

export function getRoutePose(progress: number): RoutePose {
  const coordinate = routeCoordinateAt(progress);
  const behind = routeCoordinateAt(progress - 0.00012);
  const ahead = routeCoordinateAt(progress + 0.00012);
  return {
    bearing: bearingBetween(behind, ahead),
    lng: coordinate[0],
    lat: coordinate[1],
  };
}

export function interpolateRouteValue(values: readonly number[], progress: number) {
  if (values.length !== yamanoteRoute.length) {
    throw new Error('Route values must match the official route point count.');
  }
  const sample = routeSampleAt(progress);
  const start = values[sample.segmentIndex];
  const end = values[sample.segmentIndex + 1];
  return start + (end - start) * sample.segmentProgress;
}

const progressByStation = new Map(
  yamanoteRouteStations.map((station) => [station.name, station.progress]),
);

export function getStationProgress(stationName: string) {
  const progress = progressByStation.get(stationName);
  if (progress === undefined) throw new Error(`Unknown Yamanote station: ${stationName}`);
  return progress;
}
