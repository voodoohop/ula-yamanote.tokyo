import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SOURCE_URL = 'https://nlftp.mlit.go.jp/ksj/gml/data/N02/N02-25/N02-25_GML.zip';
const RAIL_ARCHIVE_PATH = 'N02-25_GML/UTF-8/N02-25_RailroadSection.geojson';
const STATION_ARCHIVE_PATH = 'N02-25_GML/UTF-8/N02-25_Station.geojson';
const OUTPUT_PATH = new URL('../src/data/yamanoteRoute.generated.ts', import.meta.url);
const OPERATOR = '東日本旅客鉄道';
const TOKYO_BOUNDS = { west: 139.68, south: 35.6, east: 139.8, north: 35.76 };

const stationDefinitions = [
  ['Shimbashi', '新橋'],
  ['Yurakucho', '有楽町'],
  ['Tokyo', '東京'],
  ['Kanda', '神田'],
  ['Akihabara', '秋葉原'],
  ['Okachimachi', '御徒町'],
  ['Ueno', '上野'],
  ['Uguisudani', '鶯谷'],
  ['Nippori', '日暮里'],
  ['Nishi-Nippori', '西日暮里'],
  ['Tabata', '田端'],
  ['Komagome', '駒込'],
  ['Sugamo', '巣鴨'],
  ['Otsuka', '大塚'],
  ['Ikebukuro', '池袋'],
  ['Mejiro', '目白'],
  ['Takadanobaba', '高田馬場'],
  ['Shin-Okubo', '新大久保'],
  ['Shinjuku', '新宿'],
  ['Yoyogi', '代々木'],
  ['Harajuku', '原宿'],
  ['Shibuya', '渋谷'],
  ['Ebisu', '恵比寿'],
  ['Meguro', '目黒'],
  ['Gotanda', '五反田'],
  ['Osaki', '大崎'],
  ['Shinagawa', '品川'],
  ['Takanawa Gateway', '高輪ゲートウェイ'],
  ['Tamachi', '田町'],
  ['Hamamatsucho', '浜松町'],
];

function routeForLeg(index) {
  if (index >= 2 && index < 10) return '東北線';
  if (index >= 10 && index < 26) return '山手線';
  return '東海道線';
}

function coordinateKey([lng, lat]) {
  return `${lng.toFixed(6)},${lat.toFixed(6)}`;
}

function distanceSquared(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function haversineMeters(a, b) {
  const radians = Math.PI / 180;
  const lat1 = a[1] * radians;
  const lat2 = b[1] * radians;
  const deltaLat = (b[1] - a[1]) * radians;
  const deltaLng = (b[0] - a[0]) * radians;
  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const value = sinLat ** 2 + Math.cos(lat1) * Math.cos(lat2) * sinLng ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function featureCenter(feature) {
  const coordinates = feature.geometry.coordinates;
  const total = coordinates.reduce(
    (sum, [lng, lat]) => [sum[0] + lng, sum[1] + lat],
    [0, 0],
  );
  return [total[0] / coordinates.length, total[1] / coordinates.length];
}

function isInTokyo([lng, lat]) {
  return lng >= TOKYO_BOUNDS.west
    && lng <= TOKYO_BOUNDS.east
    && lat >= TOKYO_BOUNDS.south
    && lat <= TOKYO_BOUNDS.north;
}

function buildGraph(features, routeName) {
  const coordinatesByKey = new Map();
  const neighbors = new Map();

  const addNeighbor = (from, to, distance) => {
    if (!neighbors.has(from)) neighbors.set(from, []);
    neighbors.get(from).push({ key: to, distance });
  };

  features
    .filter((feature) => feature.properties.N02_004 === OPERATOR)
    .filter((feature) => feature.properties.N02_003 === routeName)
    .filter((feature) => feature.geometry.coordinates.some(isInTokyo))
    .forEach((feature) => {
      const coordinates = feature.geometry.coordinates;
      for (let index = 1; index < coordinates.length; index += 1) {
        const previous = coordinates[index - 1];
        const current = coordinates[index];
        if (!isInTokyo(previous) || !isInTokyo(current)) continue;

        const previousKey = coordinateKey(previous);
        const currentKey = coordinateKey(current);
        const distance = haversineMeters(previous, current);
        coordinatesByKey.set(previousKey, previous);
        coordinatesByKey.set(currentKey, current);
        addNeighbor(previousKey, currentKey, distance);
        addNeighbor(currentKey, previousKey, distance);
      }
    });

  const snapCellSize = 0.001;
  const snapDistanceMeters = 90;
  const cells = new Map();
  coordinatesByKey.forEach((coordinate, key) => {
    const cellX = Math.floor(coordinate[0] / snapCellSize);
    const cellY = Math.floor(coordinate[1] / snapCellSize);
    const cellKey = `${cellX},${cellY}`;
    if (!cells.has(cellKey)) cells.set(cellKey, []);
    cells.get(cellKey).push(key);
  });

  coordinatesByKey.forEach((coordinate, key) => {
    const cellX = Math.floor(coordinate[0] / snapCellSize);
    const cellY = Math.floor(coordinate[1] / snapCellSize);
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (const candidateKey of cells.get(`${cellX + offsetX},${cellY + offsetY}`) ?? []) {
          if (candidateKey <= key) continue;
          const candidate = coordinatesByKey.get(candidateKey);
          const distance = haversineMeters(coordinate, candidate);
          if (distance > snapDistanceMeters) continue;
          addNeighbor(key, candidateKey, distance);
          addNeighbor(candidateKey, key, distance);
        }
      }
    }
  });

  return { coordinatesByKey, neighbors };
}

function findNearestKey(graph, coordinate) {
  let nearestKey;
  let nearestDistance = Number.POSITIVE_INFINITY;
  graph.coordinatesByKey.forEach((candidate, key) => {
    const distance = distanceSquared(candidate, coordinate);
    if (distance < nearestDistance) {
      nearestKey = key;
      nearestDistance = distance;
    }
  });
  if (!nearestKey) throw new Error('Unable to find a railway node near a station.');
  return nearestKey;
}

function findShortestPath(graph, startCoordinate, endCoordinate) {
  const start = findNearestKey(graph, startCoordinate);
  const end = findNearestKey(graph, endCoordinate);
  const distances = new Map([[start, 0]]);
  const previous = new Map();
  const queue = [{ key: start, distance: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift();
    if (!current || current.distance !== distances.get(current.key)) continue;
    if (current.key === end) break;

    for (const neighbor of graph.neighbors.get(current.key) ?? []) {
      const candidateDistance = current.distance + neighbor.distance;
      if (candidateDistance >= (distances.get(neighbor.key) ?? Number.POSITIVE_INFINITY)) continue;
      distances.set(neighbor.key, candidateDistance);
      previous.set(neighbor.key, current.key);
      queue.push({ key: neighbor.key, distance: candidateDistance });
    }
  }

  if (!distances.has(end)) {
    throw new Error(`No connected ${startCoordinate.join(',')} to ${endCoordinate.join(',')} path.`);
  }

  const keys = [end];
  while (keys[0] !== start) keys.unshift(previous.get(keys[0]));
  return keys.map((key) => graph.coordinatesByKey.get(key));
}

function findStation(stationFeatures, japaneseName, routeName) {
  const match = stationFeatures.find((feature) => (
    feature.properties.N02_004 === OPERATOR
    && feature.properties.N02_003 === routeName
    && feature.properties.N02_005 === japaneseName
  ));
  if (!match) throw new Error(`Missing ${japaneseName} on ${routeName}.`);
  return featureCenter(match);
}

function formatNumber(value, precision = 6) {
  return Number(value.toFixed(precision));
}

async function generate() {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'yamanote-route-'));
  const archivePath = join(temporaryDirectory, 'N02-25_GML.zip');

  try {
    const response = await fetch(SOURCE_URL);
    if (!response.ok) throw new Error(`MLIT download failed with ${response.status}.`);
    await writeFile(archivePath, Buffer.from(await response.arrayBuffer()));

    const extractGeoJson = (archiveMember) => JSON.parse(execFileSync(
      'unzip',
      ['-p', archivePath, archiveMember],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    ));

    const railFeatures = extractGeoJson(RAIL_ARCHIVE_PATH).features;
    const stationFeatures = extractGeoJson(STATION_ARCHIVE_PATH).features;
    const graphs = new Map(
      ['山手線', '東北線', '東海道線'].map((routeName) => [
        routeName,
        buildGraph(railFeatures, routeName),
      ]),
    );

    const stationCoordinates = stationDefinitions.map(([name, japaneseName], index) => {
      const routeName = routeForLeg(index);
      const [lng, lat] = findStation(stationFeatures, japaneseName, routeName);
      return { name, japaneseName, lng, lat };
    });

    const route = [];
    const stationDistances = [];
    let totalDistance = 0;

    stationCoordinates.forEach((station, index) => {
      const nextStation = stationCoordinates[(index + 1) % stationCoordinates.length];
      const routeName = routeForLeg(index);
      const path = findShortestPath(
        graphs.get(routeName),
        [station.lng, station.lat],
        [nextStation.lng, nextStation.lat],
      );

      stationDistances.push(totalDistance);
      path.forEach((coordinate, pathIndex) => {
        if (route.length > 0 && pathIndex === 0) return;
        if (route.length > 0) totalDistance += haversineMeters(route.at(-1), coordinate);
        route.push(coordinate);
      });
    });

    const generatedStations = stationCoordinates.map((station, index) => ({
      ...station,
      progress: stationDistances[index] / totalDistance,
    }));

    const output = `// Generated by scripts/generate-yamanote-route.mjs from MLIT N02-25.\n`
      + `// Source: ${SOURCE_URL}\n\n`
      + `export const YAMANOTE_ROUTE_SOURCE = ${JSON.stringify(SOURCE_URL)};\n`
      + `export const YAMANOTE_ROUTE_LENGTH_METERS = ${Math.round(totalDistance)};\n\n`
      + `export const yamanoteRoute = ${JSON.stringify(route.map(([lng, lat]) => [formatNumber(lng), formatNumber(lat)]))} as const;\n\n`
      + `export const yamanoteRouteStations = ${JSON.stringify(generatedStations.map((station) => ({
        name: station.name,
        japaneseName: station.japaneseName,
        lat: formatNumber(station.lat),
        lng: formatNumber(station.lng),
        progress: formatNumber(station.progress, 8),
      })))} as const;\n`;

    await writeFile(OUTPUT_PATH, output);
    const result = await readFile(OUTPUT_PATH, 'utf8');
    console.log(`Generated ${route.length} route points (${Math.round(totalDistance / 100) / 10} km).`);
    console.log(`Wrote ${result.length} bytes to ${OUTPUT_PATH.pathname}.`);
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

await generate();
