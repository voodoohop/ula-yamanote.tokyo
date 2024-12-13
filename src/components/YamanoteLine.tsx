import React, { useRef } from 'react';
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
    <circle 
      cx={point.x} 
      cy={point.y} 
      r={isClosest ? 3 : 2} 
      className={`station-point ${isClosest ? 'closest-station' : ''}`}
      data-station={name}
    />
    {isClosest && (
      <text 
        x={point.x + 8} 
        y={point.y + 4} 
        className="station-label"
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
    <circle r={3} className="train-point" />
    <path d="M-4,-1.5 L4,-1.5 L4,1.5 L-4,1.5 Z" className="train-body" />
  </g>
);

const UserPositionMarker: React.FC<{
  point: Point;
  connectionPoint?: Point;
}> = ({ point, connectionPoint }) => (
  <>
    {connectionPoint && (
      <path
        className="connection-line"
        d={`M ${point.x},${point.y} L ${connectionPoint.x},${connectionPoint.y}`}
      />
    )}
    <circle 
      cx={point.x} 
      cy={point.y} 
      r={4} 
      className="user-point"
    />
  </>
);

const DirectionIndicator: React.FC<{
  edgeX: number;
  edgeY: number;
  bearing: number;
  distance: number;
}> = ({ edgeX, edgeY, bearing, distance }) => (
  <g className="direction-indicator">
    <circle 
      cx={edgeX} 
      cy={edgeY} 
      r={12} 
      className="direction-indicator-bg"
    />
    <polygon 
      points={`${edgeX},${edgeY-12} ${edgeX-8},${edgeY+4} ${edgeX+8},${edgeY+4}`}
      transform={`rotate(${bearing * 180 / Math.PI}, ${edgeX}, ${edgeY})`}
      className="direction-indicator-arrow"
    />
    <text
      x={edgeX}
      y={edgeY + 24}
      textAnchor="middle"
      className="distance-text"
    >
      {`${distance.toFixed(1)}km`}
    </text>
  </g>
);

export function YamanoteLine({ width = 300, height = 300, userPosition, closestStation }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const { transformedPoints, pointsRef } = useCoordinateTransformation(width, height, yamanoteStations);
  const { startAnimation, getTrainPositions } = useTrainAnimation();
  const userPositionData = useUserPosition(userPosition, closestStation, width, height);
  
  React.useEffect(() => {
    return startAnimation(pointsRef);
  }, [pointsRef.current]);

  const trainPositions = getTrainPositions(pointsRef.current);

  return (
    <div className="yamanote-map">
      <svg 
        ref={svgRef}
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        style={{ backgroundColor: '#f0f0f0', overflow: 'visible' }}
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
        <g className="trains">
          {trainPositions.map((position, i) => (
            <TrainMarker
              key={`train-${i}`}
              position={position}
              direction={i % 2 === 0 ? 'clockwise' : 'counterclockwise'}
            />
          ))}
        </g>
        <g className="user-position">
          {userPositionData && (
            userPositionData.isWithinBounds ? (
              <UserPositionMarker
                point={userPositionData.point}
                connectionPoint={closestStation ? 
                  transformedPoints[yamanoteStations.indexOf(closestStation)] : 
                  undefined}
              />
            ) : (
              userPositionData.indicator && (
                <DirectionIndicator
                  edgeX={width-userPositionData.indicator.edgeX}
                  edgeY={height-userPositionData.indicator.edgeY}
                  bearing={userPositionData.indicator.bearing}
                  distance={userPositionData.indicator.distance}
                />
              )
            )
          )}
        </g>
      </svg>
    </div>
  );
}
