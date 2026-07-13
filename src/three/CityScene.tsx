import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { yamanoteRouteStations } from '../data/yamanoteRoute.generated';
import type { TokyoEnvironment } from '../hooks/useTokyoEnvironment';
import {
  createYamanoteCurve,
  type ElevationSampler,
  getStationProgress,
  projectLngLat,
} from './yamanoteGeometry';
import { createPlateauLayers } from './plateauLayers';
import { createTokyoTerrain } from './tokyoTerrain';

const OVERVIEW_LOOP_DURATION_SECONDS = 12 * 60;
const RIDE_LOOP_DURATION_SECONDS = 24 * 60;

interface CitySceneProps {
  isRiding: boolean;
  isPaused: boolean;
  stationName: string;
  environment: TokyoEnvironment;
  onStationChange: (stationName: string) => void;
  onReady: () => void;
  onError: () => void;
}

function createWeatherParticles(scene: THREE.Scene) {
  const count = 700;
  const positions = new Float32Array(count * 3);
  let seed = 1985;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 180;
    positions[index * 3 + 1] = random() * 110 - 25;
    positions[index * 3 + 2] = (random() - 0.5) * 180;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xb7d4df,
    size: 0.38,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  scene.add(points);

  return {
    update(
      delta: number,
      camera: THREE.Camera,
      environment: TokyoEnvironment,
      isRiding: boolean,
    ) {
      points.visible = isRiding && environment.precipitationKind !== 'none';
      if (!points.visible) return;

      points.position.set(camera.position.x, camera.position.y - 20, camera.position.z);
      const isSnow = environment.precipitationKind === 'snow';
      const fallSpeed = isSnow ? 7 : 52 + Math.min(environment.precipitation, 8) * 5;
      const drift = (environment.windSpeed ?? 0) * delta * (isSnow ? 0.035 : 0.012);

      for (let index = 0; index < count; index += 1) {
        const offset = index * 3;
        positions[offset] += drift;
        positions[offset + 1] -= fallSpeed * delta;
        if (positions[offset + 1] < -25) {
          positions[offset] = (random() - 0.5) * 180;
          positions[offset + 1] = 85 + random() * 20;
          positions[offset + 2] = (random() - 0.5) * 180;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      material.color.set(isSnow ? 0xf0f4f5 : environment.isDay ? 0x6f8f9f : 0xb7d4df);
      material.size = isSnow ? 0.72 : 0.38;
    },
  };
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

function buildRailway(scene: THREE.Scene, sampleElevation: ElevationSampler) {
  const rideCurve = createYamanoteCurve(sampleElevation);
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
  environment,
  onStationChange,
  onReady,
  onError,
}: CitySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ridingRef = useRef(isRiding);
  const pausedRef = useRef(isPaused);
  const readyRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onStationChangeRef = useRef(onStationChange);
  const environmentRef = useRef(environment);
  const progressRef = useRef(getStationProgress(stationName));
  const reportedStationRef = useRef(stationName);

  useEffect(() => {
    ridingRef.current = isRiding;
  }, [isRiding]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (reportedStationRef.current === stationName) return;
    reportedStationRef.current = stationName;
    progressRef.current = getStationProgress(stationName);
  }, [stationName]);

  useEffect(() => {
    onStationChangeRef.current = onStationChange;
  }, [onStationChange]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    environmentRef.current = environment;
  }, [environment]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const background = new THREE.Color(0x07080c);
    const fog = new THREE.FogExp2(0x090b12, 0.0001);
    scene.background = background;
    scene.fog = fog;

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
    renderer.domElement.dataset.roads = 'plateau-loading';
    renderer.domElement.dataset.terrain = 'gsi-loading';
    container.appendChild(renderer.domElement);

    const hemisphere = new THREE.HemisphereLight(0x8391c7, 0x101216, 2.2);
    const skyLight = new THREE.DirectionalLight(0xd7e4ff, 1.7);
    skyLight.position.set(-5_000, 9_000, 4_000);
    const railGlow = new THREE.PointLight(0x9acd32, 45, 420, 1.7);
    railGlow.position.set(0, 90, 0);
    scene.add(hemisphere, skyLight, railGlow);

    let railway: ReturnType<typeof buildRailway> | null = null;
    const readyLayers = new Set<string>();
    let hasReportedError = false;
    const markReady = (layer: 'buildings' | 'roads' | 'terrain') => {
      readyLayers.add(layer);
      if (readyRef.current || readyLayers.size !== 3) return;
      readyRef.current = true;
      onReadyRef.current();
    };
    const reportError = () => {
      if (readyRef.current || hasReportedError) return;
      hasReportedError = true;
      onErrorRef.current();
    };
    const plateau = createPlateauLayers({
      camera,
      renderer,
      onReady: (layer) => {
        renderer.domElement.dataset[layer] = 'plateau';
        markReady(layer);
      },
      onStatus: (layer, status) => {
        renderer.domElement.dataset[layer] = status;
        if (status === 'load-error') reportError();
      },
    });
    const terrain = createTokyoTerrain({
      onReady: (sampleElevation) => {
        railway = buildRailway(scene, sampleElevation);
        renderer.domElement.dataset.terrain = 'gsi';
        markReady('terrain');
      },
      onError: () => {
        renderer.domElement.dataset.terrain = 'load-error';
        reportError();
      },
    });
    scene.add(plateau.group);
    scene.add(terrain.group);
    const weatherParticles = createWeatherParticles(scene);
    const lookAt = new THREE.Vector3();
    const desiredCamera = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nightBackground = new THREE.Color(0x07080c);
    const cloudyNight = new THREE.Color(0x151a20);
    const clearDay = new THREE.Color(0x9db8c7);
    const overcastDay = new THREE.Color(0x707b83);
    const targetBackground = new THREE.Color();
    const daySky = new THREE.Color(0xdbeaf1);
    const nightSky = new THREE.Color(0x8391c7);
    const dayGround = new THREE.Color(0x4f5553);
    const nightGround = new THREE.Color(0x101216);
    const daySun = new THREE.Color(0xfff1ce);
    const nightMoon = new THREE.Color(0xd7e4ff);
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
      const currentEnvironment = environmentRef.current;
      const cloudAmount = currentEnvironment.cloudCover / 100;

      if (railway) {
        if (!pausedRef.current && !reducedMotion) {
          const loopDuration = ridingRef.current
            ? RIDE_LOOP_DURATION_SECONDS
            : OVERVIEW_LOOP_DURATION_SECONDS;
          progressRef.current = (progressRef.current + delta / loopDuration) % 1;
        }

        const progress = progressRef.current;
        let nearestStation = yamanoteRouteStations[0];
        let nearestDistance = Number.POSITIVE_INFINITY;
        yamanoteRouteStations.forEach((candidate) => {
          const directDistance = Math.abs(progress - candidate.progress);
          const distance = Math.min(directDistance, 1 - directDistance);
          if (distance < nearestDistance) {
            nearestStation = candidate;
            nearestDistance = distance;
          }
        });
        if (nearestStation.name !== reportedStationRef.current) {
          reportedStationRef.current = nearestStation.name;
          onStationChangeRef.current(nearestStation.name);
        }
        const trainPoint = railway.curve.getPointAt(progress);
        railway.curve.getTangentAt(progress, tangent).normalize();
        railway.overview.visible = !ridingRef.current;
        railway.train.position.copy(trainPoint);
        railway.train.rotation.y = Math.atan2(tangent.x, tangent.z);
        railGlow.visible = true;
        railGlow.position.copy(trainPoint);
        railGlow.position.y += 16;

        if (ridingRef.current) {
          const behind = railway.curve.getPointAt((progress - 0.0028 + 1) % 1);
          const ahead = railway.curve.getPointAt((progress + 0.0022) % 1);
          desiredCamera.copy(behind);
          desiredCamera.y += 18;
          lookAt.copy(ahead);
          lookAt.y += 7;
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
      } else {
        const orbit = elapsed * 0.045;
        desiredCamera.set(
          Math.cos(orbit) * 7_000 - 1_600,
          15_000,
          Math.sin(orbit) * 7_000 + 300,
        );
        camera.position.lerp(desiredCamera, 0.018);
        lookAt.set(-1_500, 120, 300);
        railGlow.visible = false;
      }

      camera.lookAt(lookAt);
      targetBackground
        .copy(currentEnvironment.isDay ? clearDay : nightBackground)
        .lerp(currentEnvironment.isDay ? overcastDay : cloudyNight, cloudAmount);
      background.lerp(targetBackground, 0.035);
      fog.color.lerp(targetBackground, 0.035);
      const targetFogDensity = currentEnvironment.isDay
        ? 0.000045 + cloudAmount * 0.000035
        : 0.000075 + cloudAmount * 0.000035;
      fog.density += (targetFogDensity - fog.density) * 0.035;

      hemisphere.color.lerp(currentEnvironment.isDay ? daySky : nightSky, 0.035);
      hemisphere.groundColor.lerp(currentEnvironment.isDay ? dayGround : nightGround, 0.035);
      hemisphere.intensity += (
        (currentEnvironment.isDay ? 1.8 + currentEnvironment.daylight * 1.8 : 1.25)
        - hemisphere.intensity
      ) * 0.035;
      skyLight.color.lerp(currentEnvironment.isDay ? daySun : nightMoon, 0.035);
      skyLight.intensity += (
        (currentEnvironment.isDay ? 1.2 + currentEnvironment.daylight * 2.6 : 1.1)
        - skyLight.intensity
      ) * 0.035;
      const sunAngle = ((currentEnvironment.tokyoHour - 6) / 12) * Math.PI;
      skyLight.position.set(
        Math.cos(sunAngle) * 8_000,
        Math.max(700, Math.sin(sunAngle) * 9_000),
        -3_800,
      );
      renderer.toneMappingExposure += (
        (currentEnvironment.isDay ? 1.05 - cloudAmount * 0.12 : 1.28)
        - renderer.toneMappingExposure
      ) * 0.035;
      railGlow.intensity = currentEnvironment.isDay ? 18 : 45;
      weatherParticles.update(delta, camera, currentEnvironment, ridingRef.current);
      terrain.update(currentEnvironment);
      plateau.update(ridingRef.current, railway?.train.position ?? null);
      renderer.render(scene, camera);

      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      scene.remove(plateau.group);
      scene.remove(terrain.group);
      plateau.dispose();
      terrain.dispose();
      disposeScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="three-city-scene" aria-hidden="true" />;
}
