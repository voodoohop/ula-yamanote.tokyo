import { KeyboardEvent } from 'react';
import { audioStations } from '../data/stations';

interface YamanoteMapProps {
  activeIndex: number;
  isTracking: boolean;
  onSelect: (index: number) => void;
}

const MAP_SIZE = 420;
const CENTER = MAP_SIZE / 2;
const RADIUS_X = 154;
const RADIUS_Y = 126;

const points = audioStations.map((_, index) => {
  const angle = -Math.PI / 2 + (index / audioStations.length) * Math.PI * 2;
  return {
    x: CENTER + Math.cos(angle) * RADIUS_X,
    y: CENTER + Math.sin(angle) * RADIUS_Y,
  };
});

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
      aria-label={`Yamanote sound map, ${audioStations[activeIndex].name} selected`}
    >
      <ellipse className="route-shadow" cx={CENTER} cy={CENTER} rx={RADIUS_X} ry={RADIUS_Y} />
      <ellipse className="route-line" cx={CENTER} cy={CENTER} rx={RADIUS_X} ry={RADIUS_Y} />

      {points.map((point, index) => {
        const station = audioStations[index];
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
          {audioStations[activeIndex].japaneseName}
        </text>
        <text className="map-romaji" x={CENTER} y={CENTER + 38} textAnchor="middle">
          {audioStations[activeIndex].name}
        </text>
      </g>

      <path className="map-pointer" d={`M ${CENTER} ${CENTER - 69} L ${activePoint.x} ${activePoint.y}`} />
    </svg>
  );
}
