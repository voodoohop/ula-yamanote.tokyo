import React, { useEffect, useRef, useState } from 'react';
import { stations } from '../data/stations';
import { Train, createInitialTrains, updateTrainPositions, calculateTrainPosition } from '../utils/trainSimulation';
import { 
  calculateBounds,
  createCoordinateTransformer,
  calculateSVGBounds,
  calculateCenteringOffset,
  isPointWithinBounds,
  calculateDistance,
  calculateBearing
} from '../utils/mapUtils';
import '../styles/YamanoteLine.css';

interface Props {
  width?: number;
  height?: number;
  userPosition?: {
    lat: number;
    lng: number;
  };
  closestStation?: string;
}

interface Point {
  x: number;
  y: number;
}

interface TrainPosition {
  x: number;
  y: number;
  angle: number;
}

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
}> = ({ position }) => (
  <g className="train" transform={`translate(${position.x},${position.y}) rotate(${position.angle})`}>
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
  const [trains, setTrains] = useState<Train[]>([]);
  const [transformedPoints, setTransformedPoints] = useState<Point[]>([]);
  const animationFrameRef = useRef<number>();
  const pointsRef = useRef<Point[]>([]);

  // Initialize trains
  useEffect(() => {
    setTrains(createInitialTrains());
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Animate trains
  useEffect(() => {
    if (pointsRef.current.length === 0) return;
    
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      setTrains(prevTrains => updateTrainPositions(prevTrains, deltaTime));
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pointsRef.current]);

  // Transform coordinates
  useEffect(() => {
    if (!svgRef.current) return;

    // Get coordinates for Yamanote line stations in correct order
    const yamanoteCoordinates = yamanoteStations
      .map(name => stations.find(s => s.name === name))
      .filter((station): station is typeof stations[number] => station !== undefined);

    if (yamanoteCoordinates.length === 0) {
      console.error('No valid coordinates found for Yamanote stations');
      return;
    }

    // Calculate bounds and create coordinate transformer
    const bounds = calculateBounds(yamanoteCoordinates);
    const transformCoord = createCoordinateTransformer(bounds, width, height);

    // Generate points for the Yamanote line
    const points = yamanoteCoordinates.map(station => 
      transformCoord({ lat: station.lat, lng: station.lng })
    );

    // Calculate SVG bounds and centering offset
    const svgBounds = calculateSVGBounds(points);
    const offset = calculateCenteringOffset(svgBounds, width, height);

    // Create final transform function with centering
    const finalTransformCoord = (lat: number, lng: number) => {
      const initial = transformCoord({ lat, lng });
      return {
        x: initial.x + offset.x,
        y: initial.y + offset.y
      };
    };

    // Transform and store points
    const transformedPoints = yamanoteCoordinates.map(station => 
      finalTransformCoord(station.lat, station.lng)
    );

    setTransformedPoints(transformedPoints);
    pointsRef.current = transformedPoints;
  }, [width, height]);

  // Calculate train positions
  const trainPositions = trains.map(train => {
    const position = calculateTrainPosition(train, pointsRef.current);
    return position || null;
  }).filter((pos): pos is TrainPosition => pos !== null);

  // Calculate user position data
  const userPositionData = userPosition && (() => {
    const bounds = calculateBounds(stations);
    const transformCoord = createCoordinateTransformer(bounds, width, height);
    const point = transformCoord(userPosition);
    const padding = 20;

    if (isPointWithinBounds(point, width, height, padding)) {
      return { point, isWithinBounds: true };
    }

    // Calculate off-map indicator position
    const closestStationData = closestStation 
      ? stations.find(s => s.name === closestStation)
      : null;
    const targetCoords = closestStationData 
      ? { lat: closestStationData.lat, lng: closestStationData.lng }
      : { 
          lat: bounds.minLat + (bounds.maxLat - bounds.minLat) / 2,
          lng: bounds.minLng + (bounds.maxLng - bounds.minLng) / 2 
        };

    const bearing = calculateBearing(userPosition, targetCoords);
    const distance = calculateDistance(userPosition, targetCoords);
    const radius = Math.min(width, height) / 2 - 20;
    const edgeX = width/2 + radius * Math.sin(bearing);
    const edgeY = height/2 - radius * Math.cos(bearing);

    return {
      point,
      isWithinBounds: false,
      indicator: { edgeX, edgeY, bearing, distance }
    };
  })();

  return (
    <div className="yamanote-map">
      <svg 
        ref={svgRef}
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        style={{ backgroundColor: '#f0f0f0' }}
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
                  edgeX={userPositionData.indicator.edgeX}
                  edgeY={userPositionData.indicator.edgeY}
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
