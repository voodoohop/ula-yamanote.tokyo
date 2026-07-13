import { GLTFExtensionsPlugin } from '3d-tiles-renderer/src/three/plugins/GLTFExtensionsPlugin.js';
import { ReorientationPlugin } from '3d-tiles-renderer/src/three/plugins/ReorientationPlugin.js';
import { TilesRenderer } from '3d-tiles-renderer/src/three/renderer/tiles/TilesRenderer.js';
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { TOKYO_ORIGIN } from './yamanoteGeometry';

export const PLATEAU_BUILDINGS_URL = 'https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/13-bldg-lod1-latest/tileset.json';

interface PlateauBuildingsOptions {
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  onReady: () => void;
  onStatus: (status: string) => void;
}

function tuneBuildingModel(model: THREE.Object3D) {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = false;
    object.receiveShadow = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!(material instanceof THREE.MeshStandardMaterial)) return;
      material.color.multiplyScalar(0.62);
      material.roughness = 0.94;
      material.metalness = 0.02;
      material.envMapIntensity = 0.18;
      material.needsUpdate = true;
    });
  });
}

function hasBuildingGeometry(model: THREE.Object3D) {
  let hasGeometry = false;
  model.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry.attributes.position?.count > 0) {
      hasGeometry = true;
    }
  });
  return hasGeometry;
}

export function createPlateauBuildings({
  camera,
  renderer,
  onReady,
  onStatus,
}: PlateauBuildingsOptions) {
  const tiles = new TilesRenderer(PLATEAU_BUILDINGS_URL);
  const dracoLoader = new DRACOLoader();
  const radians = Math.PI / 180;
  let isReady = false;
  const loadTimeout = window.setTimeout(() => {
    if (!isReady) onStatus('load-error');
  }, 30_000);

  dracoLoader.setDecoderPath({
    js: '/draco/draco_wasm_wrapper.js',
    wasm: '/draco/draco_decoder.wasm',
  });
  tiles.registerPlugin(new GLTFExtensionsPlugin({
    autoDispose: false,
    dracoLoader,
  }));
  tiles.registerPlugin(new ReorientationPlugin({
    lat: TOKYO_ORIGIN.lat * radians,
    lon: TOKYO_ORIGIN.lng * radians,
    azimuth: Math.PI,
  }));
  tiles.errorTarget = 72;
  tiles.loadSiblings = false;
  tiles.lruCache.minSize = 100;
  tiles.lruCache.maxSize = 420;
  tiles.lruCache.minBytesSize = 72 * 1024 * 1024;
  tiles.lruCache.maxBytesSize = 180 * 1024 * 1024;
  tiles.downloadQueue.maxJobs = 8;
  tiles.parseQueue.maxJobs = 2;
  tiles.setCamera(camera);
  tiles.setResolutionFromRenderer(camera, renderer);

  tiles.addEventListener('load-model', ({ scene }) => {
    tuneBuildingModel(scene);
  });
  tiles.addEventListener('tile-visibility-change', ({ scene, visible }) => {
    // Tilesets also emit visibility events for structural groups with no geometry.
    if (!visible || isReady || !hasBuildingGeometry(scene)) return;
    isReady = true;
    window.clearTimeout(loadTimeout);
    onReady();
  });
  tiles.addEventListener('load-root-tileset', () => onStatus('root-loaded'));
  tiles.addEventListener('load-error', ({ error }) => {
    console.warn('PLATEAU building tile failed to load.', error);
    if (!isReady) onStatus('load-error');
  });

  return {
    group: tiles.group,
    resize() {
      tiles.setResolutionFromRenderer(camera, renderer);
    },
    update(isRiding: boolean) {
      tiles.errorTarget = isRiding ? 56 : 84;
      camera.updateMatrixWorld();
      tiles.update();
    },
    dispose() {
      window.clearTimeout(loadTimeout);
      tiles.dispose();
      dracoLoader.dispose();
    },
  };
}
