import * as THREE from 'three';
import { projectYamanoteMeters } from '../data/yamanoteCoordinates';
import { yamanoteRoute, yamanoteRouteStations } from '../data/yamanoteRoute.generated';

export type ElevationSampler = (longitude: number, latitude: number) => number;

export function projectLngLat(lng: number, lat: number, elevation = 0) {
  const { east, north } = projectYamanoteMeters(lng, lat);
  return new THREE.Vector3(
    east,
    elevation,
    -north,
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
