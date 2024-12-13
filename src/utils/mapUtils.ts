interface Coordinates {
  lat: number;
  lng: number;
}

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface SVGBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate bearing between two points
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const fromLat = from.lat * Math.PI / 180;
  const toLat = to.lat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) -
           Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
  return Math.atan2(y, x);
}

// Calculate bounds for a set of coordinates
export function calculateBounds(coordinates: Coordinates[]): Bounds {
  return coordinates.reduce(
    (acc, coord) => ({
      minLat: Math.min(acc.minLat, coord.lat),
      maxLat: Math.max(acc.maxLat, coord.lat),
      minLng: Math.min(acc.minLng, coord.lng),
      maxLng: Math.max(acc.maxLng, coord.lng),
    }),
    {
      minLat: Infinity,
      maxLat: -Infinity,
      minLng: Infinity,
      maxLng: -Infinity,
    }
  );
}

// Create a coordinate transformer function
export function createCoordinateTransformer(
  bounds: Bounds,
  width: number,
  height: number,
  padding = 0.1
) {
  // Calculate center
  const centerLat = (bounds.maxLat + bounds.minLat) / 2;
  const centerLng = (bounds.maxLng + bounds.minLng) / 2;

  // Calculate ranges
  const latRange = bounds.maxLat - bounds.minLat;
  const lngRange = bounds.maxLng - bounds.minLng;

  // Adjust longitude range for Tokyo's latitude
  const adjustedLngRange = lngRange / Math.cos(centerLat * Math.PI / 180);

  // Use the larger range to maintain aspect ratio
  const range = Math.max(latRange, adjustedLngRange) * (1 + padding);

  // Update bounds to be centered and square
  const squareBounds = {
    minLat: centerLat - range / 2,
    maxLat: centerLat + range / 2,
    minLng: centerLng - (range * Math.cos(centerLat * Math.PI / 180)) / 2,
    maxLng: centerLng + (range * Math.cos(centerLat * Math.PI / 180)) / 2,
  };

  // Scale coordinates to SVG viewport
  const scale = Math.min(width, height) * 0.9;
  const initialOffsetX = (width - scale) / 2;
  const initialOffsetY = (height - scale) / 2;

  return function transformCoord(coord: Coordinates): Point {
    // X coordinate increases with longitude (east)
    const x = initialOffsetX + (scale * (coord.lng - squareBounds.minLng) / 
      (squareBounds.maxLng - squareBounds.minLng));
    
    // Y coordinate should decrease as latitude increases (north)
    // So we invert the y-axis mapping
    const y = initialOffsetY + (scale * (1 - (coord.lat - squareBounds.minLat) / 
      (squareBounds.maxLat - squareBounds.minLat)));

    return { x, y };
  };
}

// Calculate SVG bounds for a set of points
export function calculateSVGBounds(points: Point[]): SVGBounds {
  return points.reduce(
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
}

// Calculate additional offset to center points in SVG
export function calculateCenteringOffset(
  bounds: SVGBounds,
  width: number,
  height: number
): Point {
  const actualWidth = bounds.maxX - bounds.minX;
  const actualHeight = bounds.maxY - bounds.minY;
  return {
    x: (width - actualWidth) / 2 - bounds.minX,
    y: (height - actualHeight) / 2 - bounds.minY,
  };
}

// Check if a point is within SVG bounds
export function isPointWithinBounds(
  point: Point,
  width: number,
  height: number,
  padding: number
): boolean {
  return (
    point.x >= padding &&
    point.x <= width - padding &&
    point.y >= padding &&
    point.y <= height - padding
  );
}
