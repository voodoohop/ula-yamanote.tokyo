import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';
import type { RoutePose } from './yamanoteMotion';

type TrainPart = 'body' | 'marker' | 'roof' | 'stripe' | 'window';

interface TrainProperties {
  base: number;
  height: number;
  part: TrainPart;
}

type TrainGeometry = Polygon | Point;

const EMPTY_TRAIN: FeatureCollection<TrainGeometry, TrainProperties> = {
  type: 'FeatureCollection',
  features: [],
};

function offsetCoordinate(pose: RoutePose, east: number, north: number): [number, number] {
  const latitudeRadians = pose.lat * Math.PI / 180;
  return [
    pose.lng + east / (111_320 * Math.cos(latitudeRadians)),
    pose.lat + north / 110_540,
  ];
}

function rectangle(
  pose: RoutePose,
  centerOffset: number,
  length: number,
  width: number,
  properties: TrainProperties,
): Feature<Polygon, TrainProperties> {
  const angle = pose.bearing * Math.PI / 180;
  const forward = { east: Math.sin(angle), north: Math.cos(angle) };
  const right = { east: Math.cos(angle), north: -Math.sin(angle) };
  const center = {
    east: forward.east * centerOffset,
    north: forward.north * centerOffset,
  };
  const halfLength = length / 2;
  const halfWidth = width / 2;
  const corners = [
    [halfLength, halfWidth],
    [halfLength, -halfWidth],
    [-halfLength, -halfWidth],
    [-halfLength, halfWidth],
    [halfLength, halfWidth],
  ].map(([along, across]) => offsetCoordinate(
    pose,
    center.east + forward.east * along + right.east * across,
    center.north + forward.north * along + right.north * across,
  ));

  return {
    type: 'Feature',
    properties,
    geometry: { type: 'Polygon', coordinates: [corners] },
  };
}

export function createTrainGeometry(pose?: RoutePose) {
  if (!pose) return EMPTY_TRAIN;

  const features: Array<Feature<TrainGeometry, TrainProperties>> = [];
  for (const offset of [-17.5, 0, 17.5]) {
    features.push(
      rectangle(pose, offset, 16.6, 3.4, { part: 'body', base: 0.4, height: 4.3 }),
      rectangle(pose, offset, 15.8, 3.05, { part: 'roof', base: 4.3, height: 4.52 }),
      rectangle(pose, offset, 14.8, 0.68, { part: 'stripe', base: 4.52, height: 4.66 }),
    );
  }
  features.push(
    rectangle(pose, 26, 0.5, 2.35, { part: 'window', base: 2.4, height: 3.65 }),
    rectangle(pose, -26, 0.5, 2.35, { part: 'window', base: 2.4, height: 3.65 }),
    {
      type: 'Feature',
      properties: { part: 'marker', base: 0, height: 0 },
      geometry: { type: 'Point', coordinates: [pose.lng, pose.lat] },
    },
  );

  return { type: 'FeatureCollection', features } satisfies FeatureCollection<TrainGeometry, TrainProperties>;
}
