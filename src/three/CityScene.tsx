import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import type { FeatureCollection, LineString, Point } from 'geojson';
import { yamanoteRoute, yamanoteRouteStations } from '../data/yamanoteRoute.generated';
import type { TokyoEnvironment } from '../hooks/useTokyoEnvironment';
import { createTrainGeometry } from './YamanoteTrain';
import { getRoutePose, getStationProgress } from './yamanoteMotion';

const GSI_BASE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
const PLATEAU_TERRAIN_URL = 'https://api.plateauview.mlit.go.jp/tiles/plateau-terrainrgb/{z}/{x}/{y}.png';
const PLATEAU_BUILDINGS_URL = 'https://indigo-lab.github.io/plateau-tokyo23ku-building-mvt-2020/{z}/{x}/{y}.pbf';
const OVERVIEW_LOOP_DURATION_SECONDS = 12 * 60;
const RIDE_LOOP_DURATION_SECONDS = 24 * 60;
const OVERVIEW_CENTER: [number, number] = [139.718, 35.6818];

interface CitySceneProps {
  isRiding: boolean;
  isPaused: boolean;
  stationName: string;
  environment: TokyoEnvironment;
  onStationChange: (stationName: string) => void;
  onReady: () => void;
  onError: () => void;
}

const routeData: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: yamanoteRoute.map((coordinate) => [...coordinate]) },
  }],
};

const stationData: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: yamanoteRouteStations.map((station) => ({
    type: 'Feature',
    properties: { name: station.name },
    geometry: { type: 'Point', coordinates: [station.lng, station.lat] },
  })),
};

function createStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      gsi: {
        type: 'raster',
        tiles: [GSI_BASE_URL],
        tileSize: 256,
        minzoom: 5,
        maxzoom: 18,
        attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">GSI tiles</a>',
      },
      terrain: {
        type: 'raster-dem',
        tiles: [PLATEAU_TERRAIN_URL],
        tileSize: 256,
        minzoom: 6,
        maxzoom: 15,
        encoding: 'mapbox',
        attribution: '<a href="https://github.com/Project-PLATEAU-Admin/plateau-mb-terrain-converter" target="_blank">PLATEAU Terrain-RGB</a>',
      },
      buildings: {
        type: 'vector',
        tiles: [PLATEAU_BUILDINGS_URL],
        minzoom: 10,
        maxzoom: 16,
        attribution: '<a href="https://github.com/indigo-lab/plateau-tokyo23ku-building-mvt-2020" target="_blank">PLATEAU Tokyo buildings</a>',
      },
      route: { type: 'geojson', data: routeData },
      stations: { type: 'geojson', data: stationData },
      train: { type: 'geojson', data: createTrainGeometry() },
    },
    terrain: { source: 'terrain', exaggeration: 1 },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#081018' },
      },
      {
        id: 'gsi',
        type: 'raster',
        source: 'gsi',
        paint: {
          'raster-brightness-max': 0.4,
          'raster-contrast': 0.16,
          'raster-saturation': -0.5,
        },
      },
      {
        id: 'terrain-shade',
        type: 'hillshade',
        source: 'terrain',
        paint: {
          'hillshade-exaggeration': 0.18,
          'hillshade-shadow-color': '#102019',
          'hillshade-highlight-color': '#afc9ba',
        },
      },
      {
        id: 'buildings',
        type: 'fill-extrusion',
        source: 'buildings',
        'source-layer': 'bldg',
        minzoom: 10,
        paint: {
          'fill-extrusion-base': 0,
          'fill-extrusion-color': '#687789',
          'fill-extrusion-height': ['coalesce', ['get', 'measuredHeight'], 5],
          'fill-extrusion-opacity': 0.94,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        id: 'route-glow',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#9acd32',
          'line-width': 9,
          'line-opacity': 0.18,
          'line-blur': 3,
        },
      },
      {
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#baff4a', 'line-width': 3.2, 'line-opacity': 0.96 },
      },
      {
        id: 'stations',
        type: 'circle',
        source: 'stations',
        paint: {
          'circle-color': '#e7f8c2',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 15, 4],
          'circle-stroke-color': '#263510',
          'circle-stroke-width': 1,
        },
      },
      {
        id: 'train',
        type: 'fill-extrusion',
        source: 'train',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-color': [
            'match',
            ['get', 'part'],
            'stripe', '#baff4a',
            'window', '#f4d98e',
            'roof', '#f0f2ef',
            '#d8dddc',
          ],
          'fill-extrusion-opacity': 1,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        id: 'train-marker',
        type: 'circle',
        source: 'train',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-color': '#baff4a',
          'circle-radius': 7,
          'circle-stroke-color': '#162007',
          'circle-stroke-width': 2,
        },
      },
    ],
  };
}

function applyEnvironment(map: MapLibreMap, environment: TokyoEnvironment) {
  const day = environment.isDay;
  const cloud = environment.cloudCover / 100;
  map.setPaintProperty('background', 'background-color', day ? '#91b8c4' : '#07111c');
  map.setPaintProperty('gsi', 'raster-brightness-min', day ? 0.08 : 0);
  map.setPaintProperty('gsi', 'raster-brightness-max', day ? 0.92 - cloud * 0.12 : 0.4);
  map.setPaintProperty('gsi', 'raster-contrast', day ? 0.05 : 0.16);
  map.setPaintProperty('gsi', 'raster-saturation', day ? -0.2 : -0.5);
  map.setPaintProperty('buildings', 'fill-extrusion-color', day ? '#d5dbd5' : '#687789');
  map.setPaintProperty('terrain-shade', 'hillshade-exaggeration', day ? 0.1 : 0.18);
  map.setSky({
    'sky-color': day ? '#91b8c4' : '#07111c',
    'horizon-color': day ? '#d4e0df' : '#1d2b35',
    'fog-color': day ? '#b5cccf' : '#18242c',
    'sky-horizon-blend': day ? 0.65 : 0.8,
    'horizon-fog-blend': 0.75,
    'fog-ground-blend': 0.7,
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
  const environmentRef = useRef(environment);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onStationChangeRef = useRef(onStationChange);
  const progressRef = useRef(getStationProgress(stationName));
  const reportedStationRef = useRef(stationName);

  useEffect(() => { ridingRef.current = isRiding; }, [isRiding]);
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { environmentRef.current = environment; }, [environment]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onStationChangeRef.current = onStationChange; }, [onStationChange]);

  useEffect(() => {
    if (reportedStationRef.current === stationName) return;
    reportedStationRef.current = stationName;
    progressRef.current = getStationProgress(stationName);
  }, [stationName]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isCompact = window.matchMedia('(max-width: 700px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const map = new maplibregl.Map({
      container,
      style: createStyle(),
      center: OVERVIEW_CENTER,
      zoom: isCompact ? 11.65 : 12.1,
      pitch: 52,
      bearing: -22,
      interactive: false,
      attributionControl: false,
      renderWorldCopies: false,
      maxPitch: 78,
      canvasContextAttributes: { antialias: !isCompact },
      pixelRatio: isCompact ? 1 : Math.min(window.devicePixelRatio, 1.5),
    });
    map.addControl(new maplibregl.AttributionControl({
      compact: true,
      customAttribution: '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html" target="_blank">MLIT rail</a>',
    }), 'bottom-left');

    const canvas = map.getCanvas();
    canvas.classList.add('three-city-canvas');
    canvas.dataset.scene = 'ura-yamanote-city';
    canvas.dataset.renderer = 'maplibre';
    canvas.dataset.buildings = 'plateau-loading';
    canvas.dataset.terrain = 'plateau-loading';
    canvas.dataset.base = 'gsi-loading';

    let disposed = false;
    let ready = false;
    let animationFrame = 0;
    let previousFrameTime = 0;
    let previousMapUpdate = 0;
    let environmentSignature = '';

    const reportError = (message: string, error?: unknown) => {
      if (disposed || ready) return;
      console.warn(message, error);
      window.clearTimeout(loadTimeout);
      onErrorRef.current();
    };
    const loadTimeout = window.setTimeout(() => {
      reportError('Tokyo map data did not become ready in time.');
    }, 45_000);

    map.on('error', (event) => {
      console.warn('MapLibre source error', event.error);
    });
    map.once('load', () => {
      if (disposed) return;
      applyEnvironment(map, environmentRef.current);
      canvas.dataset.buildings = 'plateau';
      canvas.dataset.terrain = 'plateau-terrain-rgb';
      canvas.dataset.base = 'gsi';
    });
    map.once('idle', () => {
      if (disposed) return;
      ready = true;
      window.clearTimeout(loadTimeout);
      onReadyRef.current();
    });

    const updateStation = () => {
      let nearestStation = yamanoteRouteStations[0];
      let nearestDistance = Number.POSITIVE_INFINITY;
      yamanoteRouteStations.forEach((station) => {
        const directDistance = Math.abs(progressRef.current - station.progress);
        const distance = Math.min(directDistance, 1 - directDistance);
        if (distance >= nearestDistance) return;
        nearestStation = station;
        nearestDistance = distance;
      });
      if (nearestStation.name === reportedStationRef.current) return;
      reportedStationRef.current = nearestStation.name;
      onStationChangeRef.current(nearestStation.name);
    };

    const updateMap = (frameTime: number) => {
      const pose = getRoutePose(progressRef.current);
      const train = map.getSource('train') as GeoJSONSource | undefined;
      train?.setData(createTrainGeometry(pose));
      updateStation();

      if (ridingRef.current) {
        map.jumpTo({
          center: [pose.lng, pose.lat],
          zoom: isCompact ? 16.35 : 16.75,
          pitch: isCompact ? 66 : 69,
          bearing: pose.bearing,
          padding: {
            top: isCompact ? 180 : 135,
            bottom: isCompact ? 110 : 75,
            left: 0,
            right: 0,
          },
        });
      } else {
        map.jumpTo({
          center: OVERVIEW_CENTER,
          zoom: isCompact ? 11.65 : 12.1,
          pitch: 52,
          bearing: reducedMotion ? -22 : -22 + frameTime * 0.0015,
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
        });
      }

      const current = environmentRef.current;
      const signature = `${current.isDay}-${Math.round(current.cloudCover / 10)}-${current.precipitationKind}`;
      if (signature !== environmentSignature) {
        environmentSignature = signature;
        applyEnvironment(map, current);
      }
    };

    const tick = (frameTime: number) => {
      if (disposed) return;
      const delta = previousFrameTime === 0
        ? 0
        : Math.min((frameTime - previousFrameTime) / 1_000, 0.05);
      previousFrameTime = frameTime;

      if (ready && !pausedRef.current && !reducedMotion) {
        const duration = ridingRef.current ? RIDE_LOOP_DURATION_SECONDS : OVERVIEW_LOOP_DURATION_SECONDS;
        progressRef.current = (progressRef.current + delta / duration) % 1;
      }
      if (ready && frameTime - previousMapUpdate >= 33) {
        previousMapUpdate = frameTime;
        updateMap(frameTime);
      }
      animationFrame = window.requestAnimationFrame(tick);
    };
    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      window.clearTimeout(loadTimeout);
      window.cancelAnimationFrame(animationFrame);
      map.remove();
    };
  }, []);

  return <div ref={containerRef} className="three-city-scene" aria-hidden="true" />;
}
