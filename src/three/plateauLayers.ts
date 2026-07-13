import { GLTFExtensionsPlugin } from '3d-tiles-renderer/src/three/plugins/GLTFExtensionsPlugin.js';
import { ReorientationPlugin } from '3d-tiles-renderer/src/three/plugins/ReorientationPlugin.js';
import { TilesRenderer } from '3d-tiles-renderer/src/three/renderer/tiles/TilesRenderer.js';
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { TOKYO_ORIGIN } from './yamanoteGeometry';

export const PLATEAU_BUILDINGS_URL = 'https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/13-bldg-lod1-latest/tileset.json';
export const PLATEAU_ROADS_URL = 'https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/13-tran-lod3-latest/tileset.json';

type PlateauLayerName = 'buildings' | 'roads';

interface PlateauLayersOptions {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  onReady: (layer: PlateauLayerName) => void;
  onStatus: (layer: PlateauLayerName, status: string) => void;
}

interface LayerDefinition {
  cacheBytes: number;
  cacheSize: number;
  errorTargetOverview: number;
  errorTargetRide: number;
  name: PlateauLayerName;
  url: string;
}

const layerDefinitions: LayerDefinition[] = [
  {
    name: 'buildings',
    url: PLATEAU_BUILDINGS_URL,
    errorTargetOverview: 84,
    errorTargetRide: 56,
    cacheSize: 340,
    cacheBytes: 140 * 1024 * 1024,
  },
  {
    name: 'roads',
    url: PLATEAU_ROADS_URL,
    errorTargetOverview: 72,
    errorTargetRide: 36,
    cacheSize: 220,
    cacheBytes: 80 * 1024 * 1024,
  },
];

const LOCAL_DATA_SETTLE_MS = 600;
const LOCAL_DATA_RADIUS = 2_000;
const CAMERA_CLEARANCE = 12;
const CAMERA_RAY_HEIGHT = 1_000;

function tuneModel(model: THREE.Object3D, layer: PlateauLayerName) {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = false;
    object.receiveShadow = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial)) return;
      if (layer === 'roads') {
        material.color.set(0x384341);
        material.polygonOffset = true;
        material.polygonOffsetFactor = -1;
        material.polygonOffsetUnits = -1;
      } else {
        material.color.multiplyScalar(0.62);
      }
      material.roughness = 0.94;
      material.metalness = 0.02;
      material.envMapIntensity = 0.18;
      material.needsUpdate = true;
    });
  });
}

function hasGeometry(model: THREE.Object3D) {
  let hasRenderableGeometry = false;
  model.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry.attributes.position?.count > 0) {
      hasRenderableGeometry = true;
    }
  });
  return hasRenderableGeometry;
}

function getTileScene(tile: unknown) {
  return (tile as { engineData?: { scene?: THREE.Object3D } }).engineData?.scene;
}

function hasNearbyGeometry(tiles: TilesRenderer, focus: THREE.Vector3) {
  return [...tiles.visibleTiles].some((tile) => {
    const scene = getTileScene(tile);
    return scene
      && hasGeometry(scene)
      && new THREE.Box3().setFromObject(scene).distanceToPoint(focus) <= LOCAL_DATA_RADIUS;
  });
}

export function createPlateauLayers({
  camera,
  renderer,
  onReady,
  onStatus,
}: PlateauLayersOptions) {
  const group = new THREE.Group();
  group.name = 'plateau-city-layers';
  const dracoLoader = new DRACOLoader();
  const viewCamera = camera.clone();
  const neighborhoodCamera = new THREE.PerspectiveCamera(90, 1, 10, 2_000);
  const cameraRaycaster = new THREE.Raycaster();
  const rayDirection = new THREE.Vector3();
  const rayOrigin = new THREE.Vector3();
  const down = new THREE.Vector3(0, -1, 0);
  const radians = Math.PI / 180;
  const isCompact = window.matchMedia('(max-width: 700px)').matches;

  (cameraRaycaster as THREE.Raycaster & { firstHitOnly: boolean }).firstHitOnly = true;

  dracoLoader.setDecoderPath({
    js: '/draco/draco_wasm_wrapper.js',
    wasm: '/draco/draco_decoder.wasm',
  });

  const layers = layerDefinitions.map((definition) => {
    const tiles = new TilesRenderer(definition.url);
    let isReady = false;
    let lastReadyCheck = 0;
    let readyCandidateSince = 0;
    const loadTimeout = window.setTimeout(() => {
      if (!isReady) onStatus(definition.name, 'load-error');
    }, 30_000);

    tiles.registerPlugin(new GLTFExtensionsPlugin({ autoDispose: false, dracoLoader }));
    tiles.registerPlugin(new ReorientationPlugin({
      lat: TOKYO_ORIGIN.lat * radians,
      lon: TOKYO_ORIGIN.lng * radians,
      azimuth: Math.PI,
    }));
    tiles.errorTarget = definition.errorTargetOverview * (isCompact ? 1.35 : 1);
    // The Tokyo composite uses empty additive nodes around municipal tilesets.
    // Loading their ancestors can leave every renderable descendant inactive.
    tiles.loadSiblings = true;
    tiles.loadAncestors = false;
    tiles.autoDisableRendererCulling = false;
    tiles.lruCache.minSize = isCompact ? 48 : Math.min(80, definition.cacheSize);
    tiles.lruCache.maxSize = isCompact
      ? Math.round(definition.cacheSize * 0.58)
      : definition.cacheSize;
    tiles.lruCache.minBytesSize = isCompact
      ? 32 * 1024 * 1024
      : Math.min(56 * 1024 * 1024, definition.cacheBytes);
    tiles.lruCache.maxBytesSize = isCompact
      ? Math.round(definition.cacheBytes * 0.58)
      : definition.cacheBytes;
    tiles.downloadQueue.maxJobs = isCompact ? 4 : 8;
    tiles.parseQueue.maxJobs = isCompact ? 1 : 2;
    tiles.setCamera(viewCamera);
    tiles.setCamera(neighborhoodCamera);
    tiles.setResolutionFromRenderer(viewCamera, renderer);
    tiles.setResolution(neighborhoodCamera, isCompact ? 500 : 1_000, isCompact ? 500 : 1_000);

    tiles.addEventListener('load-model', ({ scene }) => tuneModel(scene, definition.name));
    tiles.addEventListener('load-root-tileset', () => {
      onStatus(definition.name, 'root-loaded');
    });
    tiles.addEventListener('load-error', ({ error }) => {
      console.warn(`PLATEAU ${definition.name} tile failed to load.`, error);
      if (!isReady) onStatus(definition.name, 'load-error');
    });

    group.add(tiles.group);
    return {
      definition,
      loadTimeout,
      tiles,
      updateReadiness(focus: THREE.Vector3, now: number) {
        if (isReady || now - lastReadyCheck < 250) return;
        lastReadyCheck = now;
        const { downloading, parsing, queued } = tiles.stats;
        if (downloading + parsing + queued > 0 || !hasNearbyGeometry(tiles, focus)) {
          readyCandidateSince = 0;
          return;
        }
        if (readyCandidateSince === 0) {
          readyCandidateSince = now;
        } else if (now - readyCandidateSince >= LOCAL_DATA_SETTLE_MS) {
          isReady = true;
          window.clearTimeout(loadTimeout);
          onReady(definition.name);
        }
      },
    };
  });
  const buildingTiles = layers.find(({ definition }) => definition.name === 'buildings')!.tiles;

  const findBuildingTop = (point: THREE.Vector3) => {
    const intersections: THREE.Intersection[] = [];
    rayOrigin.set(point.x, CAMERA_RAY_HEIGHT, point.z);
    cameraRaycaster.set(rayOrigin, down);
    cameraRaycaster.near = 0;
    cameraRaycaster.far = CAMERA_RAY_HEIGHT * 2;
    buildingTiles.raycast(cameraRaycaster, intersections);
    return intersections[0]?.point.y ?? null;
  };

  return {
    group,
    getCameraClearanceHeight(position: THREE.Vector3, target: THREE.Vector3) {
      let clearanceHeight = findBuildingTop(position);
      rayDirection.subVectors(target, position);
      const targetDistance = rayDirection.length();
      if (targetDistance > 2) {
        const intersections: THREE.Intersection[] = [];
        rayDirection.divideScalar(targetDistance);
        cameraRaycaster.set(position, rayDirection);
        cameraRaycaster.near = 1;
        cameraRaycaster.far = targetDistance - 1;
        buildingTiles.raycast(cameraRaycaster, intersections);
        if (intersections[0]) {
          const obstructionHeight = findBuildingTop(intersections[0].point);
          if (obstructionHeight !== null) {
            clearanceHeight = Math.max(clearanceHeight ?? -Infinity, obstructionHeight);
          }
        }
      }
      return clearanceHeight === null ? null : clearanceHeight + CAMERA_CLEARANCE;
    },
    resize() {
      layers.forEach(({ tiles }) => tiles.setResolutionFromRenderer(viewCamera, renderer));
    },
    update(isRiding: boolean, focus: THREE.Vector3 | null) {
      viewCamera.copy(camera, false);
      viewCamera.near = isRiding ? 1 : 10;
      viewCamera.far = isRiding ? 6_000 : 40_000;
      viewCamera.updateProjectionMatrix();
      viewCamera.updateMatrixWorld();
      if (focus) {
        neighborhoodCamera.position.copy(focus);
        neighborhoodCamera.position.y += isCompact ? 1_000 : 1_500;
        neighborhoodCamera.far = isCompact ? 1_400 : 2_000;
        neighborhoodCamera.lookAt(focus);
        neighborhoodCamera.updateProjectionMatrix();
        neighborhoodCamera.updateMatrixWorld();
      }
      const now = performance.now();
      layers.forEach((layer) => {
        const { definition, tiles } = layer;
        tiles.errorTarget = isRiding
          ? definition.errorTargetRide * (isCompact ? 1.35 : 1)
          : definition.errorTargetOverview * (isCompact ? 1.35 : 1);
        tiles.update();
        if (focus) layer.updateReadiness(focus, now);
      });
    },
    dispose() {
      layers.forEach(({ loadTimeout, tiles }) => {
        window.clearTimeout(loadTimeout);
        tiles.dispose();
      });
      dracoLoader.dispose();
    },
  };
}
