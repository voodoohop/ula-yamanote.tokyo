import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { experienceStations } from '../src/data/stations.ts';
import {
  YAMANOTE_ROUTE_LENGTH_METERS,
  yamanoteRoute,
  yamanoteRouteStations,
} from '../src/data/yamanoteRoute.generated.ts';
import { findYamanoteRouteContext } from '../src/utils/location.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const trackDirectory = resolve(root, 'public/assets/tracks');
const failures = [];

if (yamanoteRouteStations.length !== 30 || experienceStations.length !== 30) {
  failures.push('Expected all 30 Yamanote stations.');
}

if (yamanoteRoute.length < 300 || YAMANOTE_ROUTE_LENGTH_METERS < 34_000) {
  failures.push('Official route geometry is unexpectedly incomplete.');
}

let maxStationOffset = 0;
yamanoteRouteStations.forEach((station, index) => {
  const context = findYamanoteRouteContext(station.lat, station.lng);
  maxStationOffset = Math.max(maxStationOffset, context.distanceToLine);
  if (context.stationIndex !== index) {
    failures.push(`${station.name} maps to station index ${context.stationIndex}, expected ${index}.`);
  }
  if (context.distanceToLine > 100) {
    failures.push(`${station.name} is ${Math.round(context.distanceToLine)} m from the route.`);
  }
});

const missingTracks = experienceStations
  .filter((station) => station.track)
  .filter((station) => !existsSync(
    resolve(trackDirectory, 'low', `${station.track}-low.mp3`),
  ))
  .map((station) => station.name);

if (missingTracks.length > 0) {
  failures.push(`Missing station tracks: ${missingTracks.join(', ')}.`);
}

const publishedSourceTracks = (await readdir(trackDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.mp3'));

if (publishedSourceTracks.length > 0) {
  failures.push('Full-bitrate source tracks must not be published from public/assets/tracks.');
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Verified ${yamanoteRoute.length} route points across ${experienceStations.length} stations.`);
  console.log(`Maximum station-to-route offset: ${maxStationOffset.toFixed(1)} m.`);
  console.log('All referenced station tracks exist; no source-bitrate tracks are published.');
}
