import React, { useEffect, useRef, useState } from 'react';
import { stations } from '../data/stations';
import { Train, createInitialTrains, updateTrainPositions, calculateTrainPosition } from '../utils/trainSimulation';
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

// Filter only Yamanote line stations and define their order
const yamanoteStations = [
  'Shimbashi',
  'Yurakucho',
  'Tokyo',
  'Kanda',
  'Akihabara',
  'Okachimachi',
  'Ueno',
  'Uguisudani',
  'Nishi-Nippori',
  'Nippori',
  'Tabata',
  'Komagome',
  'Sugamo',
  'Otsuka',
  'Ikebukuro',
  'Mejiro',
  'Takadanobaba',
  'Shin-Okubo',
  'Shinjuku',
  'Yoyogi',
  'Harajuku',
  'Shibuya',
  'Ebisu',
  'Meguro',
  'Gotanda',
  'Osaki',
  'Shinagawa',
  'Tamachi',
  'Hamamatsucho'
];

export function YamanoteLine({ width = 300, height = 300, userPosition, closestStation }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [trains, setTrains] = useState<Train[]>([]);
  const animationFrameRef = useRef<number>();
  const pointsRef = useRef<Array<{x: number; y: number}>>([]);

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
    if (pointsRef.current.length === 0) return; // Don't start animation until points are ready
    
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

    // Calculate bounds for Yamanote line only (not including user position)
    const bounds = yamanoteCoordinates.reduce(
      (acc, station) => ({
        minLat: Math.min(acc.minLat, station.lat),
        maxLat: Math.max(acc.maxLat, station.lat),
        minLng: Math.min(acc.minLng, station.lng),
        maxLng: Math.max(acc.maxLng, station.lng),
      }),
      {
        minLat: Infinity,
        maxLat: -Infinity,
        minLng: Infinity,
        maxLng: -Infinity,
      }
    );

    // Calculate center of Yamanote line
    const centerLat = (bounds.maxLat + bounds.minLat) / 2;
    const centerLng = (bounds.maxLng + bounds.minLng) / 2;

    // Calculate the range needed for Yamanote line
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;

    // Adjust longitude range for Tokyo's latitude
    const adjustedLngRange = lngRange / Math.cos(centerLat * Math.PI / 180);

    // Use the larger range to maintain aspect ratio
    const range = Math.max(latRange, adjustedLngRange) * 1.2; // 20% padding

    // Update bounds to be centered and square
    bounds.minLat = centerLat - range / 2;
    bounds.maxLat = centerLat + range / 2;
    bounds.minLng = centerLng - (range * Math.cos(centerLat * Math.PI / 180)) / 2;
    bounds.maxLng = centerLng + (range * Math.cos(centerLat * Math.PI / 180)) / 2;

    // Scale coordinates to SVG viewport
    const scale = Math.min(width, height) * 0.9;
    const initialOffsetX = (width - scale) / 2;
    const initialOffsetY = (height - scale) / 2;

    const transformCoord = (lat: number, lng: number) => ({
      x: initialOffsetX + (scale * (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)),
      y: initialOffsetY + (scale * (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)))
    });

    // Generate points for the Yamanote line
    const points = yamanoteCoordinates.map(station => 
      transformCoord(station.lat, station.lng)
    );

    // Calculate actual bounding box of transformed points
    const svgBounds = points.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y),
      }),
      {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      }
    );

    // Calculate additional offset to center the actual points
    const actualWidth = svgBounds.maxX - svgBounds.minX;
    const actualHeight = svgBounds.maxY - svgBounds.minY;
    const additionalOffsetX = (width - actualWidth) / 2 - svgBounds.minX;
    const additionalOffsetY = (height - actualHeight) / 2 - svgBounds.minY;

    // Update transform function with additional offset
    const finalTransformCoord = (lat: number, lng: number) => {
      const initial = transformCoord(lat, lng);
      return {
        x: initial.x + additionalOffsetX,
        y: initial.y + additionalOffsetY,
      };
    };

    // Generate final points with corrected centering
    const finalPoints = yamanoteCoordinates.map(station => 
      finalTransformCoord(station.lat, station.lng)
    );

    // Store points in ref for train calculations
    pointsRef.current = finalPoints;

    // Create path segments
    const pathSegments = finalPoints.map((point, i) => {
      const nextIndex = (i + 1) % finalPoints.length;
      const isConnectedToClosest = closestStation && 
        (yamanoteCoordinates[i].name === closestStation || 
         yamanoteCoordinates[nextIndex].name === closestStation);

      return `<path 
        class="line-path ${isConnectedToClosest ? 'highlighted' : ''}"
        d="M ${point.x},${point.y} L ${finalPoints[nextIndex].x},${finalPoints[nextIndex].y}"
      />`;
    });

    // Update the paths
    const pathGroup = svgRef.current.querySelector('.paths');
    if (pathGroup) {
      pathGroup.innerHTML = pathSegments.join('');
    }

    // Update station points
    const stationGroup = svgRef.current.querySelector('.stations');
    if (stationGroup) {
      stationGroup.innerHTML = yamanoteCoordinates
        .map((station) => {
          const point = finalTransformCoord(station.lat, station.lng);
          const isClosest = station.name === closestStation;
          return `
            <g class="station-group">
              <circle 
                cx="${point.x}" 
                cy="${point.y}" 
                r="${isClosest ? 3 : 2}" 
                class="station-point ${isClosest ? 'closest-station' : ''}"
                data-station="${station.name}"
              />
              ${isClosest ? `
                <text 
                  x="${point.x + 8}" 
                  y="${point.y + 4}" 
                  class="station-label"
                >${station.name}</text>
              ` : ''}
            </g>
          `;
        })
        .join('');
    }

    // Update trains
    const trainGroup = svgRef.current.querySelector('.trains');
    if (trainGroup && pointsRef.current.length > 0) {
      trainGroup.innerHTML = trains.map(train => {
        const position = calculateTrainPosition(train, pointsRef.current);
        if (!position) return ''; // Skip rendering if position calculation failed
        
        const { x, y, angle } = position;
        return `
          <g class="train" transform="translate(${x},${y}) rotate(${angle})">
            <circle r="3" class="train-point" />
            <path d="M-4,-1.5 L4,-1.5 L4,1.5 L-4,1.5 Z" class="train-body" />
          </g>
        `;
      }).join('');
    }

    // Add user position if available
    const userGroup = svgRef.current.querySelector('.user-position');
    if (userGroup && userPosition) {
      const point = finalTransformCoord(userPosition.lat, userPosition.lng);
      
      // Check if point is within bounds with some padding
      const padding = 20;
      const isWithinBounds = 
        point.x >= padding && point.x <= width - padding && 
        point.y >= padding && point.y <= height - padding;

      if (isWithinBounds) {
        // Draw connection line to closest station if available
        let connectionLine = '';
        if (closestStation) {
          const closestStationData = yamanoteCoordinates.find(s => s.name === closestStation);
          if (closestStationData) {
            const closestPoint = finalTransformCoord(
              closestStationData.lat,
              closestStationData.lng
            );
            connectionLine = `
              <path
                class="connection-line"
                d="M ${point.x},${point.y} L ${closestPoint.x},${closestPoint.y}"
              />
            `;
          }
        }

        userGroup.innerHTML = `
          ${connectionLine}
          <circle 
            cx="${point.x}" 
            cy="${point.y}" 
            r="4" 
            class="user-point"
          />
        `;
      } else {
        // If we have a closest station, point towards it instead of the center
        const closestStationData = yamanoteCoordinates.find(s => s.name === closestStation);
        const targetLat = closestStationData ? closestStationData.lat : centerLat;
        const targetLng = closestStationData ? closestStationData.lng : centerLng;

        // Calculate bearing using geographical coordinates
        const dLng = (targetLng - userPosition.lng);
        const y = Math.sin(dLng * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180);
        const x = Math.cos(userPosition.lat * Math.PI / 180) * Math.sin(targetLat * Math.PI / 180) -
                 Math.sin(userPosition.lat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) * Math.cos(dLng * Math.PI / 180);
        const bearing = Math.atan2(y, x);
        
        // Place arrow at the edge of the map
        const radius = Math.min(width, height) / 2 - 20;
        const edgeX = width/2 + radius * Math.sin(bearing);
        const edgeY = height/2 - radius * Math.cos(bearing); // Minus because SVG Y is inverted
        
        userGroup.innerHTML = `
          <g class="direction-indicator">
            <circle 
              cx="${edgeX}" 
              cy="${edgeY}" 
              r="12" 
              class="direction-indicator-bg"
            />
            <polygon 
              points="${edgeX},${edgeY-12} ${edgeX-8},${edgeY+4} ${edgeX+8},${edgeY+4}"
              transform="rotate(${bearing * 180 / Math.PI}, ${edgeX}, ${edgeY})"
              class="direction-indicator-arrow"
            />
          </g>
        `;
      }
    }
  }, [width, height, userPosition, closestStation, trains]);

  return (
    <div className="yamanote-map">
      <svg 
        ref={svgRef}
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        style={{ backgroundColor: '#f0f0f0' }}
      >
        <g className="paths" />
        <g className="stations" />
        <g className="trains" />
        <g className="user-position" />
      </svg>
    </div>
  );
}
