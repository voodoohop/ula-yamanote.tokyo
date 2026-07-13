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

export function createPlateauLayers({
  camera,
  renderer,
  onReady,
  onStatus,
}: PlateauLayersOptions) {
  const group = new THREE.Group();
  group.name = 'plateau-city-layers';
  const dracoLoader = new DRACOLoader();
  const selectionCamera = camera.clone();
  const radians = Math.PI / 180;
  const isCompact = window.matchMedia('(max-width: 700px)').matches;

  dracoLoader.setDecoderPath({
    js: '/draco/draco_wasm_wrapper.js',
    wasm: '/draco/draco_decoder.wasm',
  });

  const layers = layerDefinitions.map((definition) => {
    const tiles = new TilesRenderer(definition.url);
    let isReady = false;
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
    tiles.setCamera(selectionCamera);
    tiles.setResolutionFromRenderer(selectionCamera, renderer);

    tiles.addEventListener('load-model', ({ scene }) => tuneModel(scene, definition.name));
    tiles.addEventListener('tile-visibility-change', ({ scene, visible }) => {
      if (!visible || isReady || !hasGeometry(scene)) return;
      isReady = true;
      window.clearTimeout(loadTimeout);
      onReady(definition.name);
    });
    tiles.addEventListener('load-root-tileset', () => {
      onStatus(definition.name, 'root-loaded');
    });
    tiles.addEventListener('load-error', ({ error }) => {
      console.warn(`PLATEAU ${definition.name} tile failed to load.`, error);
      if (!isReady) onStatus(definition.name, 'load-error');
    });

    group.add(tiles.group);
    return { definition, loadTimeout, tiles };
  });

  return {
    group,
    resize() {
      layers.forEach(({ tiles }) => tiles.setResolutionFromRenderer(selectionCamera, renderer));
    },
    update(isRiding: boolean) {
      selectionCamera.copy(camera, false);
      selectionCamera.near = isRiding ? 1 : 10;
      selectionCamera.far = isRiding ? 6_000 : 40_000;
      selectionCamera.updateProjectionMatrix();
      selectionCamera.updateMatrixWorld();
      layers.forEach(({ definition, tiles }) => {
        tiles.errorTarget = isRiding
          ? definition.errorTargetRide * (isCompact ? 1.35 : 1)
          : definition.errorTargetOverview * (isCompact ? 1.35 : 1);
        tiles.update();
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
