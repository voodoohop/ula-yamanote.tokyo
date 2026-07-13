import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { yamanoteRouteStations } from '../data/yamanoteRoute.generated';
import {
  createYamanoteCurve,
  getStationProgress,
  projectLngLat,
} from './yamanoteGeometry';

interface CitySceneProps {
  isRiding: boolean;
  isPaused: boolean;
  stationName: string;
  onReady: () => void;
}

interface Building {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

function createRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function buildCity(scene: THREE.Scene, routeCurve: THREE.Curve<THREE.Vector3>) {
  const random = createRandom(1985);
  const buildings: Building[] = [];
  const routeSamples = routeCurve.getSpacedPoints(220);

  for (let x = -8_200; x <= 2_800; x += 520) {
    for (let z = -7_600; z <= 8_400; z += 520) {
      const px = x + (random() - 0.5) * 140;
      const pz = z + (random() - 0.5) * 140;
      const isTrack = routeSamples.some((point) => (
        (point.x - px) ** 2 + (point.z - pz) ** 2 < 170 ** 2
      ));
      const isRoad = Math.abs(px % 1_650) < 105 || Math.abs((pz - 480) % 1_650) < 105;

      if (isTrack || isRoad || random() < 0.18) continue;

      const distanceFromCenter = Math.hypot(px + 1_000, pz);
      const centerBoost = Math.max(0, 1 - distanceFromCenter / 7_000);
      buildings.push({
        x: px,
        z: pz,
        width: 130 + random() * 120,
        depth: 130 + random() * 120,
        height: 45 + random() * 240 + centerBoost * random() * 520,
      });
    }
  }

  const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.08,
    vertexColors: true,
  });
  const buildingMesh = new THREE.InstancedMesh(buildingGeometry, buildingMaterial, buildings.length);
  const transform = new THREE.Object3D();

  buildings.forEach((building, index) => {
    transform.position.set(building.x, building.height / 2, building.z);
    transform.scale.set(building.width, building.height, building.depth);
    transform.rotation.y = (random() - 0.5) * 0.08;
    transform.updateMatrix();
    buildingMesh.setMatrixAt(index, transform.matrix);

    const tone = 0.23 + random() * 0.16;
    buildingMesh.setColorAt(index, new THREE.Color().setRGB(tone * 0.86, tone, tone * 1.2));
  });
  buildingMesh.instanceMatrix.needsUpdate = true;
  if (buildingMesh.instanceColor) buildingMesh.instanceColor.needsUpdate = true;
  scene.add(buildingMesh);

  const windowPositions: number[] = [];
  const windowColors: number[] = [];
  const warm = new THREE.Color(0xffd269);
  const cool = new THREE.Color(0x8fd7d0);

  const addWindow = (x: number, y: number, z: number) => {
    const color = random() > 0.14 ? warm : cool;
    windowPositions.push(x, y, z);
    windowColors.push(color.r, color.g, color.b);
  };

  buildings.forEach((building) => {
    const floors = Math.min(10, Math.floor(building.height / 48));
    const xColumns = Math.max(1, Math.floor(building.width / 55));
    const zColumns = Math.max(1, Math.floor(building.depth / 55));

    for (let floor = 1; floor < floors; floor += 1) {
      const y = floor * 34;
      for (let column = 0; column < xColumns; column += 1) {
        const x = building.x - building.width * 0.34
          + (column / Math.max(xColumns - 1, 1)) * building.width * 0.68;
        if (random() > 0.48) addWindow(x, y, building.z + building.depth / 2 + 1);
        if (random() > 0.76) addWindow(x, y, building.z - building.depth / 2 - 1);
      }
      for (let column = 0; column < zColumns; column += 1) {
        const z = building.z - building.depth * 0.34
          + (column / Math.max(zColumns - 1, 1)) * building.depth * 0.68;
        if (random() > 0.6) addWindow(building.x + building.width / 2 + 1, y, z);
      }
    }
  });

  const windowGeometry = new THREE.BufferGeometry();
  windowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(windowPositions, 3));
  windowGeometry.setAttribute('color', new THREE.Float32BufferAttribute(windowColors, 3));
  scene.add(new THREE.Points(
    windowGeometry,
    new THREE.PointsMaterial({
      size: 12,
      transparent: true,
      opacity: 0.86,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  ));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(24_000, 22_000),
    new THREE.MeshStandardMaterial({ color: 0x080a0f, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.04;
  scene.add(ground);

  const grid = new THREE.GridHelper(22_000, 88, 0x28313a, 0x15191f);
  grid.position.y = 0.02;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.28;
  });
  scene.add(grid);

  const starPositions: number[] = [];
  for (let index = 0; index < 420; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 9_000 + random() * 16_000;
    starPositions.push(
      Math.cos(angle) * radius,
      7_000 + random() * 12_000,
      Math.sin(angle) * radius,
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  scene.add(new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xcad5e8, size: 18, transparent: true, opacity: 0.62 }),
  ));
}

function createOffsetCurve(centerCurve: THREE.Curve<THREE.Vector3>, offset: number) {
  const tangent = new THREE.Vector3();
  const points = Array.from({ length: 720 }, (_, index) => {
    const progress = index / 720;
    const point = centerCurve.getPointAt(progress);
    centerCurve.getTangentAt(progress, tangent).normalize();
    return point.add(new THREE.Vector3(tangent.z, 0, -tangent.x).multiplyScalar(offset));
  });
  return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
}

function buildRailway(scene: THREE.Scene) {
  const rideCurve = createYamanoteCurve();
  const innerCurve = createOffsetCurve(rideCurve, -0.53);
  const outerCurve = createOffsetCurve(rideCurve, 0.53);
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x9acd32,
    emissive: 0x304a0b,
    emissiveIntensity: 1.3,
    metalness: 0.62,
    roughness: 0.32,
  });
  scene.add(
    new THREE.Mesh(new THREE.TubeGeometry(innerCurve, 700, 0.08, 5, true), railMaterial),
    new THREE.Mesh(new THREE.TubeGeometry(outerCurve, 700, 0.08, 5, true), railMaterial),
  );

  const overview = new THREE.Group();
  overview.position.y = 150;
  overview.add(new THREE.Mesh(
    new THREE.TubeGeometry(rideCurve, 700, 14, 6, true),
    new THREE.MeshBasicMaterial({
      color: 0x9acd32,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      fog: false,
    }),
  ));

  const stationGeometry = new THREE.BufferGeometry().setFromPoints(
    yamanoteRouteStations.map((station) => projectLngLat(station.lng, station.lat, 8)),
  );
  overview.add(new THREE.Points(
    stationGeometry,
    new THREE.PointsMaterial({
      color: 0xc1ef66,
      size: 4,
      transparent: true,
      opacity: 0.92,
      sizeAttenuation: false,
      fog: false,
    }),
  ));
  scene.add(overview);

  const sleeperCount = 640;
  const sleeperGeometry = new THREE.BoxGeometry(2.2, 0.13, 0.18);
  const sleeperMaterial = new THREE.MeshStandardMaterial({ color: 0x51545b, roughness: 0.82 });
  const sleepers = new THREE.InstancedMesh(sleeperGeometry, sleeperMaterial, sleeperCount);
  const sleeper = new THREE.Object3D();
  const tangent = new THREE.Vector3();

  for (let index = 0; index < sleeperCount; index += 1) {
    const progress = index / sleeperCount;
    const point = rideCurve.getPointAt(progress);
    rideCurve.getTangentAt(progress, tangent).normalize();
    sleeper.position.copy(point);
    sleeper.position.y = 0.23;
    sleeper.rotation.y = Math.atan2(tangent.x, tangent.z);
    sleeper.updateMatrix();
    sleepers.setMatrixAt(index, sleeper.matrix);
  }
  sleepers.instanceMatrix.needsUpdate = true;
  scene.add(sleepers);

  const train = new THREE.Group();
  const trainBodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xc7ccd1,
    metalness: 0.62,
    roughness: 0.32,
  });
  const stripeMaterial = new THREE.MeshStandardMaterial({
    color: 0x9acd32,
    emissive: 0x263c08,
    emissiveIntensity: 1.1,
  });
  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffd783 });

  for (let carriage = 0; carriage < 3; carriage += 1) {
    const offset = carriage * -17.4;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.85, 3.55, 16.8), trainBodyMaterial);
    body.position.set(0, 3.95, offset);
    train.add(body);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.89, 0.32, 16.9), stripeMaterial);
    stripe.position.set(0, 3.65, offset);
    train.add(stripe);

    for (let side = -1; side <= 1; side += 2) {
      const windows = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 12.4), windowMaterial);
      windows.position.set(side * 1.44, 4.55, offset);
      train.add(windows);
    }
  }
  scene.add(train);

  return { curve: rideCurve, overview, train };
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    const renderable = object as THREE.Mesh | THREE.Points | THREE.LineSegments;
    if (renderable.geometry) renderable.geometry.dispose();
    if (!renderable.material) return;
    const materials = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
    materials.forEach((material) => material.dispose());
  });
}

export function CityScene({
  isRiding,
  isPaused,
  stationName,
  onReady,
}: CitySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ridingRef = useRef(isRiding);
  const pausedRef = useRef(isPaused);
  const readyRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const progressRef = useRef(getStationProgress(stationName));

  useEffect(() => {
    ridingRef.current = isRiding;
  }, [isRiding]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    progressRef.current = getStationProgress(stationName);
  }, [stationName]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080c);
    scene.fog = new THREE.FogExp2(0x090b12, 0.0001);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60_000);
    camera.position.set(7_800, 12_500, 9_600);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.domElement.className = 'three-city-canvas';
    renderer.domElement.dataset.scene = 'ura-yamanote-city';
    container.appendChild(renderer.domElement);

    const hemisphere = new THREE.HemisphereLight(0x8391c7, 0x101216, 2.2);
    const moon = new THREE.DirectionalLight(0xd7e4ff, 1.7);
    moon.position.set(-5_000, 9_000, 4_000);
    const railGlow = new THREE.PointLight(0x9acd32, 45, 420, 1.7);
    railGlow.position.set(0, 90, 0);
    scene.add(hemisphere, moon, railGlow);

    const railway = buildRailway(scene);
    buildCity(scene, railway.curve);
    const lookAt = new THREE.Vector3();
    const desiredCamera = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrame = 0;
    let previousFrameTime = 0;

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const render = (frameTime: number) => {
      const delta = previousFrameTime === 0
        ? 0.016
        : Math.min((frameTime - previousFrameTime) / 1000, 0.05);
      const elapsed = frameTime / 1000;
      previousFrameTime = frameTime;

      if (!pausedRef.current && !reducedMotion) {
        progressRef.current = (progressRef.current + delta * (ridingRef.current ? 0.0065 : 0.0025)) % 1;
      }

      const progress = progressRef.current;
      const trainPoint = railway.curve.getPointAt(progress);
      railway.curve.getTangentAt(progress, tangent).normalize();
      railway.overview.visible = !ridingRef.current;
      railway.train.position.copy(trainPoint);
      railway.train.rotation.y = Math.atan2(tangent.x, tangent.z);

      if (ridingRef.current) {
        const behind = railway.curve.getPointAt((progress - 0.0028 + 1) % 1);
        const ahead = railway.curve.getPointAt((progress + 0.0022) % 1);
        desiredCamera.copy(behind).add(new THREE.Vector3(0, 18, 0));
        lookAt.copy(ahead).add(new THREE.Vector3(0, 7, 0));
        camera.position.lerp(desiredCamera, 0.036);
      } else {
        const orbit = elapsed * 0.045;
        desiredCamera.set(
          Math.cos(orbit) * 7_000 - 1_600,
          15_000,
          Math.sin(orbit) * 7_000 + 300,
        );
        camera.position.lerp(desiredCamera, 0.018);
        lookAt.set(-1_500, 120, 300);
      }

      camera.lookAt(lookAt);
      railGlow.position.copy(trainPoint).add(new THREE.Vector3(0, 16, 0));
      renderer.render(scene, camera);

      if (!readyRef.current) {
        readyRef.current = true;
        onReadyRef.current();
      }
      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      disposeScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="three-city-scene" aria-hidden="true" />;
}
