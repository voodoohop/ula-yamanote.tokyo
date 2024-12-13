import React, { useRef, useEffect } from 'react';
import { stations } from '../data/stations';
import { useTrainAnimation, useCoordinateTransformation, useUserPosition } from '../hooks/useYamanoteLine';
import { Props, Point, TrainPosition } from '../types/yamanote';
import '../styles/YamanoteLine.css';

// Use station names from the ordered stations array
const yamanoteStations = stations.map(station => station.name);

const LinePath: React.FC<{
  point1: Point;
  point2: Point;
  isHighlighted: boolean;
}> = ({ point1, point2, isHighlighted }) => (
  <path 
    className={`line-path ${isHighlighted ? 'highlighted' : ''}`}
    d={`M ${point1.x},${point1.y} L ${point2.x},${point2.y}`}
  />
);

const StationPoint: React.FC<{
  point: Point;
  name: string;
  isClosest: boolean;
}> = ({ point, name, isClosest }) => (
  <g className="station-group">
    {isClosest && (
      <circle 
        cx={point.x} 
        cy={point.y} 
        r={22} 
        className="station-highlight"
        fill="none"
        stroke="#ff4757"
        strokeWidth="2"
      />
    )}
    <circle 
      cx={point.x} 
      cy={point.y} 
      r={isClosest ? 18 : 10} 
      className={`station-point ${isClosest ? 'closest-station' : ''}`}
      data-station={name}
    />
    {isClosest && (
      <text 
        x={point.x + 30} 
        y={point.y + 8} 
        className="station-label"
        fontSize="32"
      >
        {name}
      </text>
    )}
  </g>
);

const TrainMarker: React.FC<{
  position: TrainPosition;
  direction: 'clockwise' | 'counterclockwise';
}> = ({ position, direction }) => (
  <g className={`train ${direction}`} transform={`translate(${position.x},${position.y}) rotate(${position.angle})`}>
    <circle r={12} className="train-point" />
    <path d="M-16,-6 L16,-6 L16,6 L-16,6 Z" className="train-body" />
  </g>
);

const UserPositionMarker: React.FC<{
  point: Point;
  connectionPoint?: Point;
}> = ({ point, connectionPoint }) => (
  <g className="user-position-marker">
    {connectionPoint && (
      <path
        className="connection-line"
        d={`M ${point.x},${point.y} L ${connectionPoint.x},${connectionPoint.y}`}
        strokeWidth="4"
      />
    )}
    <circle 
      cx={point.x} 
      cy={point.y} 
      r={20} 
      className="user-point"
    />
    <circle 
      cx={point.x} 
      cy={point.y} 
      r={8} 
      className="user-point-inner"
      fill="white"
      opacity="0.8"
    />
  </g>
);

const DirectionIndicator: React.FC<{
  edgeX: number;
  edgeY: number;
  bearing: number;
  distance: number;
  connectionPoint?: Point;
}> = ({ edgeX, edgeY, bearing, distance, connectionPoint }) => (
  <g className="direction-indicator">
    {connectionPoint && (
      <line
        x1={connectionPoint.x}
        y1={connectionPoint.y}
        x2={edgeX}
        y2={edgeY}
        className="direction-indicator-line"
      />
    )}
    <circle 
      cx={edgeX} 
      cy={edgeY} 
      r={30} 
      className="direction-indicator-bg"
    />
    <polygon 
      points={`${edgeX},${edgeY-30} ${edgeX-20},${edgeY+10} ${edgeX+20},${edgeY+10}`}
      transform={`rotate(${bearing * 180 / Math.PI}, ${edgeX}, ${edgeY})`}
      className="direction-indicator-arrow"
    />
    <text
      x={edgeX}
      y={edgeY + 50}
      textAnchor="middle"
      className="distance-text"
      fontSize="32"
    >
      {`${distance.toFixed(1)}km`}
    </text>
  </g>
);

export const YamanoteLine = ({ width = 300, height = 300, userPosition, closestStation }: Props) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { trains, startAnimation, getTrainPositions } = useTrainAnimation();
  const { transformedPoints, pointsRef } = useCoordinateTransformation(1000, 1000, yamanoteStations);
  const userPositionData = useUserPosition(userPosition, closestStation, 1000, 1000);

  useEffect(() => {
    if (transformedPoints.length > 0) {
      pointsRef.current = transformedPoints;
      return startAnimation(pointsRef);
    }
  }, [startAnimation, transformedPoints]);

  const trainPositions = getTrainPositions(transformedPoints);

  if (transformedPoints.length === 0) return null;

  return (
    <div className="yamanote-line-container">
      <div className="yamanote-map">
        <svg 
          ref={svgRef}
          width={width} 
          height={height}
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid meet"
          className="yamanote-line"
        >
          <g className="paths">
            {transformedPoints.map((point, i) => {
              const nextIndex = (i + 1) % transformedPoints.length;
              const isConnectedToClosest = closestStation && 
                (yamanoteStations[i] === closestStation || 
                 yamanoteStations[nextIndex] === closestStation);

              return (
                <LinePath
                  key={`path-${i}`}
                  point1={point}
                  point2={transformedPoints[nextIndex]}
                  isHighlighted={isConnectedToClosest}
                />
              );
            })}
          </g>
          <g className="trains">
            {trainPositions.map((position, i) => (
              <TrainMarker
                key={`train-${i}`}
                position={position}
                direction={i % 2 === 0 ? 'clockwise' : 'counterclockwise'}
              />
            ))}
          </g>
          <g className="stations">
            {transformedPoints.map((point, i) => (
              <StationPoint
                key={`station-${i}`}
                point={point}
                name={yamanoteStations[i]}
                isClosest={yamanoteStations[i] === closestStation}
              />
            ))}
          </g>
          {userPositionData && (
            <g className="user-position">
              {userPositionData.userPoint.isWithinBounds ? (
                <UserPositionMarker
                  point={userPositionData.userPoint.point}
                  connectionPoint={userPositionData.connectionPoint}
                />
              ) : (
                <DirectionIndicator
                  edgeX={userPositionData.userPoint.indicator!.edgeX}
                  edgeY={userPositionData.userPoint.indicator!.edgeY}
                  bearing={userPositionData.bearing!}
                  distance={userPositionData.distance!}
                  connectionPoint={userPositionData.connectionPoint}
                />
              )}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
