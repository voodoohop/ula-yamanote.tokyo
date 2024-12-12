import React, { useEffect, useRef, useState } from 'react';
import { stations } from '../data/stations';
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

  useEffect(() => {
    if (!svgRef.current) return;

    // Get coordinates for Yamanote line stations in correct order
    const yamanoteCoordinates = yamanoteStations
      .map(name => stations.find(s => s.name === name))
      .filter((station): station is typeof stations[number] => station !== undefined);

    console.log('Yamanote coordinates:', yamanoteCoordinates);
    console.log('User position:', userPosition);
    console.log('Closest station:', closestStation);

    if (yamanoteCoordinates.length === 0) {
      console.error('No valid coordinates found for Yamanote stations');
      return;
    }

    // Calculate bounds including user position if available
    const bounds = yamanoteCoordinates.reduce(
      (acc, station) => ({
        minLat: Math.min(acc.minLat, station.lat),
        maxLat: Math.max(acc.maxLat, station.lat),
        minLng: Math.min(acc.minLng, station.lng),
        maxLng: Math.max(acc.maxLng, station.lng),
      }),
      {
        minLat: userPosition ? Math.min(Infinity, userPosition.lat) : Infinity,
        maxLat: userPosition ? Math.max(-Infinity, userPosition.lat) : -Infinity,
        minLng: userPosition ? Math.min(Infinity, userPosition.lng) : Infinity,
        maxLng: userPosition ? Math.max(-Infinity, userPosition.lng) : -Infinity,
      }
    );

    // Calculate center
    const centerLat = (bounds.maxLat + bounds.minLat) / 2;
    const centerLng = (bounds.maxLng + bounds.minLng) / 2;

    // Calculate the range needed to encompass all points
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;

    // Adjust longitude range for Tokyo's latitude (approximately cos(35.7°) ≈ 0.81)
    const adjustedLngRange = lngRange / Math.cos(centerLat * Math.PI / 180);

    // Use the larger range to maintain aspect ratio and ensure all points are visible
    const range = Math.max(latRange, adjustedLngRange) * 1.3; // Increase size by 30%

    // Update bounds to be centered and square
    bounds.minLat = centerLat - range / 2;
    bounds.maxLat = centerLat + range / 2;
    bounds.minLng = centerLng - (range * Math.cos(centerLat * Math.PI / 180)) / 2;
    bounds.maxLng = centerLng + (range * Math.cos(centerLat * Math.PI / 180)) / 2;

    // Scale coordinates to SVG viewport
    const scale = Math.min(width, height) * 0.9; // Use 90% of the available space
    const initialOffsetX = (width - scale) / 2;
    const initialOffsetY = (height - scale) / 2;

    const transformCoord = (lat: number, lng: number) => ({
      x: initialOffsetX + (scale * (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)),
      y: initialOffsetY + (scale * (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat))) // Flip Y axis
    });

    // Generate initial points to calculate actual bounding box
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

    // Add user position if available
    const userGroup = svgRef.current.querySelector('.user-position');
    if (userGroup && userPosition) {
      const point = finalTransformCoord(userPosition.lat, userPosition.lng);
      
      // Check if point is within bounds
      const isWithinBounds = 
        point.x >= 0 && point.x <= width && 
        point.y >= 0 && point.y <= height;

      if (isWithinBounds) {
        // Draw connection line to closest station if available
        let connectionLine = '';
        if (closestStation) {
          const closestPoint = finalTransformCoord(
            yamanoteCoordinates.find(s => s.name === closestStation)!.lat,
            yamanoteCoordinates.find(s => s.name === closestStation)!.lng
          );
          connectionLine = `
            <path
              class="connection-line"
              d="M ${point.x},${point.y} L ${closestPoint.x},${closestPoint.y}"
            />
          `;
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
        // Calculate edge point for out-of-bounds indicator
        const angle = Math.atan2(point.y - height/2, point.x - width/2);
        const radius = Math.min(width, height) / 2 - 10;
        const edgeX = width/2 + radius * Math.cos(angle);
        const edgeY = height/2 + radius * Math.sin(angle);
        
        userGroup.innerHTML = `
          <polygon 
            points="${edgeX},${edgeY} ${edgeX-8},${edgeY-8} ${edgeX+8},${edgeY-8}"
            transform="rotate(${angle * 180 / Math.PI + 90}, ${edgeX}, ${edgeY})"
            class="user-arrow"
          />
        `;
      }
    }
  }, [width, height, userPosition, closestStation]);

  return (
    <div className="yamanote-map">
      <svg 
        ref={svgRef}
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        style={{ 
          backgroundColor: '#f0f0f0',
          transform: 'translateX(20%) scaleX(1.5)' // Increased to 1.5 for 150% width
        }}
      >
        <g className="paths" />
        <g className="stations" />
        <g className="user-position" />
      </svg>
    </div>
  );
}
