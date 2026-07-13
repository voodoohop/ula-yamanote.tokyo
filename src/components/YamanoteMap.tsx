import { KeyboardEvent } from 'react';
import { experienceStations } from '../data/stations';
import { yamanoteRoute } from '../data/yamanoteRoute.generated';

interface YamanoteMapProps {
  activeIndex: number;
  isTracking: boolean;
  onSelect: (index: number) => void;
}

const MAP_SIZE = 420;
const CENTER = MAP_SIZE / 2;
const MAP_PADDING = 44;
const longitudeScale = Math.cos(
  yamanoteRoute.reduce((sum, [, latitude]) => sum + latitude, 0)
  / yamanoteRoute.length
  * Math.PI / 180,
);

const geographicRoute = yamanoteRoute.map(([longitude, latitude]) => ({
  x: longitude * longitudeScale,
  y: -latitude,
}));
const xValues = geographicRoute.map(({ x }) => x);
const yValues = geographicRoute.map(({ y }) => y);
const minX = Math.min(...xValues);
const maxX = Math.max(...xValues);
const minY = Math.min(...yValues);
const maxY = Math.max(...yValues);
const scale = Math.min(
  (MAP_SIZE - MAP_PADDING * 2) / (maxX - minX),
  (MAP_SIZE - MAP_PADDING * 2) / (maxY - minY),
);

function project(longitude: number, latitude: number) {
  return {
    x: CENTER + (longitude * longitudeScale - (minX + maxX) / 2) * scale,
    y: CENTER + (-latitude - (minY + maxY) / 2) * scale,
  };
}

const routePath = yamanoteRoute.map(([longitude, latitude], index) => {
  const point = project(longitude, latitude);
  return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
}).join(' ');
const points = experienceStations.map((station) => project(station.lng, station.lat));

export function YamanoteMap({ activeIndex, isTracking, onSelect }: YamanoteMapProps) {
  const activePoint = points[activeIndex];
  const previousTrain = points[(activeIndex - 4 + points.length) % points.length];
  const nextTrain = points[(activeIndex + 5) % points.length];

  const selectWithKeyboard = (event: KeyboardEvent<SVGGElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(index);
    }
  };

  return (
    <svg
      className="yamanote-map"
      viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
      role="img"
      aria-label={`Yamanote sound map, ${experienceStations[activeIndex].name} selected`}
    >
      <path className="route-shadow" d={`${routePath} Z`} />
      <path className="route-line" d={`${routePath} Z`} />

      {points.map((point, index) => {
        const station = experienceStations[index];
        const isActive = index === activeIndex;
        return (
          <g
            className={`map-station ${isActive ? 'is-active' : ''}`}
            key={station.name}
            role="button"
            tabIndex={0}
            aria-label={`Select ${station.name}`}
            onClick={() => onSelect(index)}
            onKeyDown={(event) => selectWithKeyboard(event, index)}
          >
            <circle className="station-hit-area" cx={point.x} cy={point.y} r={13} />
            <circle className="station-node" cx={point.x} cy={point.y} r={isActive ? 6 : 3.5} />
            {isActive && <circle className={isTracking ? 'location-ring is-live' : 'location-ring'} cx={point.x} cy={point.y} r={13} />}
          </g>
        );
      })}

      <g className="train-marker" transform={`translate(${previousTrain.x} ${previousTrain.y})`}>
        <rect x={-6} y={-4} width={12} height={8} rx={1} />
      </g>
      <g className="train-marker train-marker-alt" transform={`translate(${nextTrain.x} ${nextTrain.y})`}>
        <rect x={-6} y={-4} width={12} height={8} rx={1} />
      </g>

      <g className="map-center-label">
        <text x={CENTER} y={CENTER - 24} textAnchor="middle">NOW PLAYING</text>
        <text className="map-japanese" x={CENTER} y={CENTER + 13} textAnchor="middle">
          {experienceStations[activeIndex].japaneseName}
        </text>
        <text className="map-romaji" x={CENTER} y={CENTER + 38} textAnchor="middle">
          {experienceStations[activeIndex].name}
        </text>
      </g>

      <path className="map-pointer" d={`M ${CENTER} ${CENTER - 69} L ${activePoint.x} ${activePoint.y}`} />
    </svg>
  );
}
