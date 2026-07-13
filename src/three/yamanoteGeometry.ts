import * as THREE from 'three';
import { yamanoteRoute, yamanoteRouteStations } from '../data/yamanoteRoute.generated';

export const TOKYO_ORIGIN = { lat: 35.681236, lng: 139.767125 } as const;
export type ElevationSampler = (longitude: number, latitude: number) => number;

const METERS_PER_DEGREE_LATITUDE = 111_132;
const METERS_PER_DEGREE_LONGITUDE = 111_320 * Math.cos(TOKYO_ORIGIN.lat * Math.PI / 180);

export function projectLngLat(lng: number, lat: number, elevation = 0) {
  return new THREE.Vector3(
    (lng - TOKYO_ORIGIN.lng) * METERS_PER_DEGREE_LONGITUDE,
    elevation,
    -(lat - TOKYO_ORIGIN.lat) * METERS_PER_DEGREE_LATITUDE,
  );
}

export function createYamanoteCurve(sampleElevation: ElevationSampler) {
  const points = yamanoteRoute.map(([lng, lat]) => (
    projectLngLat(lng, lat, sampleElevation(lng, lat) + 1.8)
  ));
  return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
}

const progressByStation = new Map(
  yamanoteRouteStations.map((station) => [station.name, station.progress]),
);

export function getStationProgress(stationName: string) {
  return progressByStation.get(stationName) ?? 0;
}
