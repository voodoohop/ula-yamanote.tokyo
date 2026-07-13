import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { yamanoteRouteStations } from '../data/yamanoteRoute.generated';
import {
  createYamanoteCurve,
  getStationProgress,
  projectLngLat,
} from './yamanoteGeometry';
import { createPlateauBuildings } from './plateauBuildings';

interface CitySceneProps {
  isRiding: boolean;
  isPaused: boolean;
  stationName: string;
  onReady: () => void;
  onError: () => void;
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
    sleeper.position.y = point.y + 0.1;
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
  onError,
}: CitySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ridingRef = useRef(isRiding);
  const pausedRef = useRef(isPaused);
  const readyRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
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
    onErrorRef.current = onError;
  }, [onError]);

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
    renderer.domElement.dataset.buildings = 'plateau-loading';
    renderer.domElement.dataset.plateau = 'loading';
    container.appendChild(renderer.domElement);

    const hemisphere = new THREE.HemisphereLight(0x8391c7, 0x101216, 2.2);
    const moon = new THREE.DirectionalLight(0xd7e4ff, 1.7);
    moon.position.set(-5_000, 9_000, 4_000);
    const railGlow = new THREE.PointLight(0x9acd32, 45, 420, 1.7);
    railGlow.position.set(0, 90, 0);
    scene.add(hemisphere, moon, railGlow);

    const railway = buildRailway(scene);
    const plateau = createPlateauBuildings({
      camera,
      renderer,
      onReady: () => {
        renderer.domElement.dataset.buildings = 'plateau';
        if (readyRef.current) return;
        readyRef.current = true;
        onReadyRef.current();
      },
      onStatus: (status) => {
        renderer.domElement.dataset.plateau = status;
        if (status === 'load-error' && !readyRef.current) onErrorRef.current();
      },
    });
    scene.add(plateau.group);
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
      plateau.resize();
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
        camera.position.lerp(desiredCamera, 0.065);
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
      plateau.update(ridingRef.current);
      renderer.render(scene, camera);

      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      scene.remove(plateau.group);
      plateau.dispose();
      disposeScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="three-city-scene" aria-hidden="true" />;
}
