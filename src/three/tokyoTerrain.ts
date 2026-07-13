import * as THREE from 'three';
import { yamanoteRoute } from '../data/yamanoteRoute.generated';
import type { TokyoEnvironment } from '../hooks/useTokyoEnvironment';
import { projectLngLat } from './yamanoteGeometry';

const TERRAIN_ZOOM = 13;
const TERRAIN_SEGMENTS = 64;
const TERRAIN_WORKERS = 5;
const ROUTE_PADDING_DEGREES = 0.018;
const TERRAIN_URL = 'https://tile.plateauview.mlit.go.jp/mapbox/{z}/{x}/{y}.png?geoid=gsigeo2011';

interface TokyoTerrainOptions {
  onError: () => void;
  onReady: (sampleElevation: (longitude: number, latitude: number) => number) => void;
}

interface TileCoordinate {
  x: number;
  y: number;
  z: number;
}

function longitudeToTileX(longitude: number, zoom: number) {
  return Math.floor(((longitude + 180) / 360) * 2 ** zoom);
}

function latitudeToTileY(latitude: number, zoom: number) {
  const radians = latitude * Math.PI / 180;
  return Math.floor((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * 2 ** zoom);
}

function latitudeToTilePosition(latitude: number, zoom: number) {
  const radians = latitude * Math.PI / 180;
  return (1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2 * 2 ** zoom;
}

function tileXToLongitude(x: number, zoom: number) {
  return x / 2 ** zoom * 360 - 180;
}

function tileYToLatitude(y: number, zoom: number) {
  return Math.atan(Math.sinh(Math.PI * (1 - 2 * y / 2 ** zoom))) * 180 / Math.PI;
}

function routeTileCoordinates() {
  const longitudes = yamanoteRoute.map(([longitude]) => longitude);
  const latitudes = yamanoteRoute.map(([, latitude]) => latitude);
  const west = Math.min(...longitudes) - ROUTE_PADDING_DEGREES;
  const east = Math.max(...longitudes) + ROUTE_PADDING_DEGREES;
  const south = Math.min(...latitudes) - ROUTE_PADDING_DEGREES;
  const north = Math.max(...latitudes) + ROUTE_PADDING_DEGREES;
  const minX = longitudeToTileX(west, TERRAIN_ZOOM);
  const maxX = longitudeToTileX(east, TERRAIN_ZOOM);
  const minY = latitudeToTileY(north, TERRAIN_ZOOM);
  const maxY = latitudeToTileY(south, TERRAIN_ZOOM);
  const coordinates: TileCoordinate[] = [];

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      coordinates.push({ x, y, z: TERRAIN_ZOOM });
    }
  }
  return coordinates;
}

async function loadTerrainImage(tile: TileCoordinate, signal: AbortSignal) {
  const url = TERRAIN_URL
    .replace('{z}', String(tile.z))
    .replace('{x}', String(tile.x))
    .replace('{y}', String(tile.y));
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Terrain tile failed with ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Terrain canvas is unavailable');
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function decodeTerrainHeight(image: ImageData, u: number, v: number) {
  const x = Math.min(image.width - 1, Math.round(u * (image.width - 1)));
  const y = Math.min(image.height - 1, Math.round(v * (image.height - 1)));
  const offset = (y * image.width + x) * 4;
  if (image.data[offset + 3] === 0) throw new Error('Terrain tile contains missing elevation');
  const encoded = image.data[offset] * 65_536
    + image.data[offset + 1] * 256
    + image.data[offset + 2];
  return -10_000 + encoded * 0.1;
}

function createTerrainMesh(
  tile: TileCoordinate,
  image: ImageData,
  material: THREE.MeshStandardMaterial,
) {
  const verticesPerSide = TERRAIN_SEGMENTS + 1;
  const positions = new Float32Array(verticesPerSide * verticesPerSide * 3);
  const indices = new Uint16Array(TERRAIN_SEGMENTS * TERRAIN_SEGMENTS * 6);
  let positionOffset = 0;
  let indexOffset = 0;

  for (let row = 0; row <= TERRAIN_SEGMENTS; row += 1) {
    const v = row / TERRAIN_SEGMENTS;
    const latitude = tileYToLatitude(tile.y + v, tile.z);
    for (let column = 0; column <= TERRAIN_SEGMENTS; column += 1) {
      const u = column / TERRAIN_SEGMENTS;
      const longitude = tileXToLongitude(tile.x + u, tile.z);
      const point = projectLngLat(longitude, latitude, decodeTerrainHeight(image, u, v));
      positions[positionOffset] = point.x;
      positions[positionOffset + 1] = point.y;
      positions[positionOffset + 2] = point.z;
      positionOffset += 3;

      if (row === TERRAIN_SEGMENTS || column === TERRAIN_SEGMENTS) continue;
      const topLeft = row * verticesPerSide + column;
      const bottomLeft = (row + 1) * verticesPerSide + column;
      indices[indexOffset] = topLeft;
      indices[indexOffset + 1] = bottomLeft;
      indices[indexOffset + 2] = topLeft + 1;
      indices[indexOffset + 3] = topLeft + 1;
      indices[indexOffset + 4] = bottomLeft;
      indices[indexOffset + 5] = bottomLeft + 1;
      indexOffset += 6;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `gsi-terrain-${tile.z}-${tile.x}-${tile.y}`;
  mesh.receiveShadow = false;
  mesh.renderOrder = -10;
  return mesh;
}

export function createTokyoTerrain({ onError, onReady }: TokyoTerrainOptions) {
  const group = new THREE.Group();
  group.name = 'gsi-derived-tokyo-terrain';
  const controller = new AbortController();
  const material = new THREE.MeshStandardMaterial({
    color: 0x111719,
    roughness: 1,
    metalness: 0,
  });
  const dayColor = new THREE.Color(0x35413e);
  const nightColor = new THREE.Color(0x111719);
  const coordinates = routeTileCoordinates();
  const images = new Map<string, ImageData>();
  let nextTile = 0;
  let disposed = false;

  const worker = async () => {
    while (nextTile < coordinates.length) {
      const tile = coordinates[nextTile];
      nextTile += 1;
      const image = await loadTerrainImage(tile, controller.signal);
      if (disposed) return;
      images.set(`${tile.x}/${tile.y}`, image);
      group.add(createTerrainMesh(tile, image, material));
    }
  };

  void Promise.all(
    Array.from({ length: Math.min(TERRAIN_WORKERS, coordinates.length) }, worker),
  ).then(() => {
    if (disposed) return;
    onReady((longitude, latitude) => {
      const tileXPosition = ((longitude + 180) / 360) * 2 ** TERRAIN_ZOOM;
      const tileYPosition = latitudeToTilePosition(latitude, TERRAIN_ZOOM);
      const tileX = Math.floor(tileXPosition);
      const tileY = Math.floor(tileYPosition);
      const image = images.get(`${tileX}/${tileY}`);
      if (!image) throw new Error('Terrain elevation is outside the loaded Tokyo area');
      return decodeTerrainHeight(image, tileXPosition - tileX, tileYPosition - tileY);
    });
  }).catch((error) => {
    if (!disposed && (error as Error).name !== 'AbortError') {
      console.warn('Tokyo terrain failed to load.', error);
      onError();
    }
  });

  return {
    group,
    update(environment: TokyoEnvironment) {
      material.color.lerp(environment.isDay ? dayColor : nightColor, 0.035);
    },
    dispose() {
      disposed = true;
      controller.abort();
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      images.clear();
      material.dispose();
    },
  };
}
