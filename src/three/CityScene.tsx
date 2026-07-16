import {
  Cartesian3,
  Cartographic,
  Cesium3DTileColorBlendMode,
  Cesium3DTileStyle,
  Cesium3DTileset,
  CesiumTerrainProvider,
  Color,
  ColorGeometryInstanceAttribute,
  Credit,
  GeometryInstance,
  GroundPolylineGeometry,
  GroundPolylinePrimitive,
  HeadingPitchRange,
  ImageryLayer,
  JulianDate,
  Math as CesiumMath,
  Matrix4,
  PointPrimitiveCollection,
  PolylineColorAppearance,
  ShadowMode,
  Terrain,
  TerrainProvider,
  UrlTemplateImageryProvider,
  Viewer,
  sampleTerrain,
  sampleTerrainMostDetailed,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { useEffect, useRef } from 'react';
import { yamanoteRoute, yamanoteRouteStations } from '../data/yamanoteRoute.generated';
import type { TokyoEnvironment } from '../hooks/useTokyoEnvironment';
import { YamanoteTrainPrimitive } from './YamanoteTrainPrimitive';
import { getRoutePose, getStationProgress, interpolateRouteValue } from './yamanoteMotion';

const PLATEAU_BUILDINGS_URL = 'https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/13-bldg-lod1-latest/tileset.json';
const PLATEAU_ROADS_URL = 'https://api.plateauview.mlit.go.jp/datacatalog/3dtiles/13-tran-lod3-latest/tileset.json';
const PLATEAU_TERRAIN_URL = 'https://tile.plateauview.mlit.go.jp/terrain';
const GSI_BASE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
const DATA_CREDIT_HTML = [
  '<a href="https://www.mlit.go.jp/plateau/" target="_blank">PLATEAU</a>',
  '<a href="https://mapterhorn.com/" target="_blank">Mapterhorn</a>',
  '<a href="https://www.gsi.go.jp/" target="_blank">国土地理院</a>',
  '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html" target="_blank">MLIT rail data</a>',
].join(' | ');
const OVERVIEW_LOOP_DURATION_SECONDS = 12 * 60;
const RIDE_LOOP_DURATION_SECONDS = 24 * 60;
const ROUTE_TERRAIN_LEVEL = 14;
const OVERVIEW_CENTER: [number, number] = [139.7392, 35.6818];

interface CitySceneProps {
  isRiding: boolean;
  isPaused: boolean;
  stationName: string;
  environment: TokyoEnvironment;
  onStationChange: (stationName: string) => void;
  onReady: () => void;
  onError: () => void;
}

function createRoutePrimitive() {
  const coordinates = yamanoteRoute.flatMap(([lng, lat]) => [lng, lat]);
  return new GroundPolylinePrimitive({
    geometryInstances: new GeometryInstance({
      geometry: new GroundPolylineGeometry({
        positions: Cartesian3.fromDegreesArray(coordinates),
        width: 4,
      }),
      attributes: {
        color: ColorGeometryInstanceAttribute.fromColor(Color.fromCssColorString('#b9f54a')),
      },
    }),
    appearance: new PolylineColorAppearance(),
    asynchronous: true,
  });
}

async function createStationPoints(terrainProvider: TerrainProvider) {
  const cartographics = yamanoteRouteStations.map((station) => (
    Cartographic.fromDegrees(station.lng, station.lat)
  ));
  const sampled = await sampleTerrainMostDetailed(terrainProvider, cartographics);
  const points = new PointPrimitiveCollection();

  sampled.forEach((cartographic, index) => {
    if (!Number.isFinite(cartographic.height)) {
      throw new Error(`Official terrain has no elevation for ${yamanoteRouteStations[index].name}.`);
    }
    points.add({
      id: yamanoteRouteStations[index].name,
      position: Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        cartographic.height + 3,
      ),
      color: Color.fromCssColorString('#d8ff8b'),
      outlineColor: Color.fromCssColorString('#18220b'),
      outlineWidth: 1,
      pixelSize: 6,
    });
  });

  return points;
}

async function sampleRouteElevations(terrainProvider: TerrainProvider) {
  const cartographics = yamanoteRoute.map(([lng, lat]) => Cartographic.fromDegrees(lng, lat));
  const sampled = await sampleTerrain(terrainProvider, ROUTE_TERRAIN_LEVEL, cartographics);
  return sampled.map((cartographic, index) => {
    if (!Number.isFinite(cartographic.height)) {
      throw new Error(`Official terrain has no elevation for route point ${index}.`);
    }
    return cartographic.height;
  });
}

function tilesetOptions(isCompact: boolean, kind: 'buildings' | 'roads') {
  const isBuildings = kind === 'buildings';
  return {
    maximumScreenSpaceError: isCompact
      ? isBuildings ? 18 : 24
      : isBuildings ? 10 : 16,
    cacheBytes: (isCompact
      ? isBuildings ? 96 : 64
      : isBuildings ? 256 : 128) * 1024 * 1024,
    maximumCacheOverflowBytes: (isCompact ? 32 : 64) * 1024 * 1024,
    cullRequestsWhileMoving: false,
    dynamicScreenSpaceError: true,
    dynamicScreenSpaceErrorDensity: 2.0e-4,
    dynamicScreenSpaceErrorFactor: isBuildings ? 12 : 18,
    dynamicScreenSpaceErrorHeightFalloff: 0.25,
    foveatedScreenSpaceError: true,
    foveatedTimeDelay: 0,
    progressiveResolutionHeightFraction: 0.3,
    preloadFlightDestinations: true,
    preferLeaves: false,
    enablePick: false,
    shadows: ShadowMode.RECEIVE_ONLY,
  };
}

function updateTilesetEnvironment(
  tileset: Cesium3DTileset | null,
  environment: TokyoEnvironment,
  kind: 'buildings' | 'roads',
) {
  if (!tileset) return;
  const cloud = environment.cloudCover / 100;
  const color = kind === 'buildings'
    ? environment.isDay ? '#d5d9d6' : '#718092'
    : environment.isDay ? '#a4aaa5' : '#52606f';
  const alpha = kind === 'buildings' ? 0.98 : 0.92;
  tileset.style = new Cesium3DTileStyle({
    color: `color('${color}', ${alpha})`,
  });
  tileset.colorBlendMode = Cesium3DTileColorBlendMode.MIX;
  tileset.colorBlendAmount = 0.28 + cloud * 0.12;
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
  const environmentRef = useRef(environment);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onStationChangeRef = useRef(onStationChange);
  const progressRef = useRef(getStationProgress(stationName));
  const reportedStationRef = useRef(stationName);

  useEffect(() => {
    ridingRef.current = isRiding;
  }, [isRiding]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    environmentRef.current = environment;
  }, [environment]);

  useEffect(() => {
    if (reportedStationRef.current === stationName) return;
    reportedStationRef.current = stationName;
    progressRef.current = getStationProgress(stationName);
  }, [stationName]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onStationChangeRef.current = onStationChange;
  }, [onStationChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isCompact = window.matchMedia('(max-width: 700px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const terrain = new Terrain(CesiumTerrainProvider.fromUrl(PLATEAU_TERRAIN_URL, {
      requestVertexNormals: true,
    }));
    const viewer = new Viewer(container, {
      animation: false,
      baseLayer: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      scene3DOnly: true,
      sceneModePicker: false,
      selectionIndicator: false,
      shouldAnimate: true,
      showRenderLoopErrors: false,
      terrain,
      timeline: false,
      useBrowserRecommendedResolution: isCompact,
      msaaSamples: isCompact ? 1 : 4,
    });
    viewer.resolutionScale = isCompact
      ? 1
      : Math.min(1, 1.5 / window.devicePixelRatio);
    viewer.targetFrameRate = isCompact ? 30 : 60;
    viewer.scene.screenSpaceCameraController.enableInputs = false;
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.maximumScreenSpaceError = isCompact ? 3 : 2;
    viewer.scene.globe.baseColor = Color.fromCssColorString('#19201f');
    viewer.scene.fog.enabled = true;
    viewer.scene.highDynamicRange = true;
    viewer.shadows = !isCompact;
    viewer.terrainShadows = isCompact ? ShadowMode.DISABLED : ShadowMode.RECEIVE_ONLY;
    viewer.creditDisplay.addStaticCredit(new Credit(DATA_CREDIT_HTML, true));
    viewer.clock.currentTime = JulianDate.now();

    const canvas = viewer.canvas;
    canvas.classList.add('three-city-canvas');
    canvas.dataset.scene = 'ura-yamanote-city';
    canvas.dataset.renderer = 'cesium';
    canvas.dataset.buildings = 'plateau-loading';
    canvas.dataset.roads = 'plateau-loading';
    canvas.dataset.terrain = 'gsi-loading';

    const imagery = new ImageryLayer(new UrlTemplateImageryProvider({
      url: GSI_BASE_URL,
      maximumLevel: 18,
      credit: new Credit('地理院タイル'),
    }));
    viewer.imageryLayers.add(imagery);
    const route = createRoutePrimitive();
    const train = new YamanoteTrainPrimitive();
    viewer.scene.primitives.add(route);
    viewer.scene.primitives.add(train.primitive);

    const readyLayers = new Set<'buildings' | 'roads' | 'terrain'>();
    let disposed = false;
    let hasReportedReady = false;
    let hasReportedError = false;
    let previousFrameTime = 0;
    let previousCameraTime = 0;
    let environmentSignature = '';
    let buildings: Cesium3DTileset | null = null;
    let roads: Cesium3DTileset | null = null;
    let routeElevations: readonly number[] | null = null;

    const markReady = (layer: 'buildings' | 'roads' | 'terrain') => {
      readyLayers.add(layer);
      if (hasReportedReady || readyLayers.size !== 3) return;
      hasReportedReady = true;
      window.clearTimeout(loadTimeout);
      onReadyRef.current();
    };
    const reportError = (message: string, error?: unknown) => {
      if (disposed || hasReportedError) return;
      hasReportedError = true;
      console.warn(message, error);
      onErrorRef.current();
    };
    const loadTimeout = window.setTimeout(() => {
      reportError('Official PLATEAU scene did not become ready in time.');
    }, 60_000);

    terrain.errorEvent.addEventListener((error) => {
      reportError('Official PLATEAU terrain could not be created.', error);
    });
    terrain.readyEvent.addEventListener((terrainProvider) => {
      if (disposed) return;
      void Promise.all([
        createStationPoints(terrainProvider),
        sampleRouteElevations(terrainProvider),
      ])
        .then(([points, elevations]) => {
          if (disposed) return;
          routeElevations = elevations;
          viewer.scene.primitives.add(points);
          canvas.dataset.terrain = 'gsi';
          markReady('terrain');
        })
        .catch((error: unknown) => {
          reportError('Yamanote route elevations could not be sampled.', error);
        });
    });
    viewer.scene.renderError.addEventListener((_scene, error) => {
      reportError('Cesium stopped rendering the Tokyo scene.', error);
    });

    const addTileset = async (kind: 'buildings' | 'roads') => {
      const url = kind === 'buildings' ? PLATEAU_BUILDINGS_URL : PLATEAU_ROADS_URL;
      const tileset = await Cesium3DTileset.fromUrl(url, tilesetOptions(isCompact, kind));
      if (disposed) {
        tileset.destroy();
        return null;
      }
      canvas.dataset[kind] = 'root-loaded';
      tileset.initialTilesLoaded.addEventListener(() => {
        canvas.dataset[kind] = 'plateau';
        markReady(kind);
      });
      tileset.tileFailed.addEventListener((tileError: { message: string; url: string }) => {
        console.warn(`Skipped an unreadable PLATEAU ${kind} tile: ${tileError.url}`, tileError.message);
      });
      viewer.scene.primitives.add(tileset);
      return tileset;
    };

    const applyEnvironment = () => {
      const current = environmentRef.current;
      const signature = [
        current.isDay,
        Math.round(current.cloudCover / 10),
        current.precipitationKind,
      ].join('-');
      if (signature === environmentSignature) return;
      environmentSignature = signature;
      const cloud = current.cloudCover / 100;
      const precipitation = current.precipitationKind === 'none' ? 0 : 1;
      imagery.brightness = current.isDay ? 0.82 - cloud * 0.08 : 0.3;
      imagery.contrast = current.isDay ? 1.08 : 1.2;
      imagery.saturation = current.isDay ? 0.28 : 0.08;
      viewer.scene.fog.density = 1.5e-4 + cloud * 2.8e-4 + precipitation * 2.2e-4;
      viewer.scene.fog.minimumBrightness = current.isDay ? 0.12 : 0.03;
      viewer.scene.backgroundColor = Color.fromCssColorString(current.isDay ? '#34413f' : '#06090d');
      updateTilesetEnvironment(buildings, current, 'buildings');
      updateTilesetEnvironment(roads, current, 'roads');
    };

    void Promise.all([addTileset('buildings'), addTileset('roads')])
      .then(([buildingTileset, roadTileset]) => {
        buildings = buildingTileset;
        roads = roadTileset;
        environmentSignature = '';
        applyEnvironment();
      })
      .catch((error: unknown) => {
        reportError('Official PLATEAU buildings and roads could not be opened.', error);
      });

    viewer.camera.lookAt(
      Cartesian3.fromDegrees(...OVERVIEW_CENTER),
      new HeadingPitchRange(
        CesiumMath.toRadians(-18),
        CesiumMath.toRadians(-58),
        isCompact ? 20_000 : 15_500,
      ),
    );
    viewer.camera.lookAtTransform(Matrix4.IDENTITY);

    const updateScene = () => {
      if (disposed) return;
      const frameTime = performance.now();
      const delta = previousFrameTime === 0
        ? 0.016
        : Math.min((frameTime - previousFrameTime) / 1000, 0.05);
      previousFrameTime = frameTime;

      if (!pausedRef.current && !reducedMotion) {
        const duration = ridingRef.current
          ? RIDE_LOOP_DURATION_SECONDS
          : OVERVIEW_LOOP_DURATION_SECONDS;
        progressRef.current = (progressRef.current + delta / duration) % 1;
      }

      let nearestStation = yamanoteRouteStations[0];
      let nearestDistance = Number.POSITIVE_INFINITY;
      yamanoteRouteStations.forEach((station) => {
        const directDistance = Math.abs(progressRef.current - station.progress);
        const distance = Math.min(directDistance, 1 - directDistance);
        if (distance >= nearestDistance) return;
        nearestStation = station;
        nearestDistance = distance;
      });
      if (nearestStation.name !== reportedStationRef.current) {
        reportedStationRef.current = nearestStation.name;
        onStationChangeRef.current(nearestStation.name);
      }

      const pose = getRoutePose(progressRef.current);
      const elevation = routeElevations === null
        ? undefined
        : interpolateRouteValue(routeElevations, progressRef.current);
      train.update(pose, elevation);

      if (frameTime - previousCameraTime >= 33) {
        previousCameraTime = frameTime;
        if (ridingRef.current && elevation !== undefined) {
          viewer.camera.lookAt(
            Cartesian3.fromDegrees(pose.lng, pose.lat, elevation + 2.4),
            new HeadingPitchRange(
              CesiumMath.toRadians(pose.bearing + 180),
              CesiumMath.toRadians(-18),
              isCompact ? 145 : 120,
            ),
          );
        } else if (!ridingRef.current) {
          viewer.camera.lookAt(
            Cartesian3.fromDegrees(...OVERVIEW_CENTER),
            new HeadingPitchRange(
              reducedMotion
                ? CesiumMath.toRadians(-18)
                : (frameTime * 0.000035) % (Math.PI * 2),
              CesiumMath.toRadians(-58),
              isCompact ? 20_000 : 15_500,
            ),
          );
        }
        viewer.camera.lookAtTransform(Matrix4.IDENTITY);
        applyEnvironment();
      }
    };
    viewer.scene.preRender.addEventListener(updateScene);

    return () => {
      disposed = true;
      window.clearTimeout(loadTimeout);
      viewer.scene.preRender.removeEventListener(updateScene);
      viewer.destroy();
    };
  }, []);

  return <div ref={containerRef} className="three-city-scene" aria-hidden="true" />;
}
