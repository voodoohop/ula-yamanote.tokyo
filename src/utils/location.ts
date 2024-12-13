interface Coordinates {
  lat: number;
  lng: number;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const φ1 = from.lat * Math.PI/180;
  const φ2 = to.lat * Math.PI/180;
  const Δλ = (to.lng - from.lng) * Math.PI/180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let bearing = Math.atan2(y, x);

  // Convert to degrees
  bearing = bearing * 180 / Math.PI;
  
  // When out of bounds, invert the bearing
  if (Math.abs(to.lng - from.lng) > 180 || Math.abs(to.lat - from.lat) > 90) {
    bearing = (bearing + 180) % 360;
  }

  return (bearing + 360) % 360;
}

export function getDirection(from: Coordinates, to: Coordinates): string {
  const bearing = calculateBearing(from, to);
  
  // Convert bearing to 8-point cardinal direction
  const directions = ['北 (North)', '北東 (Northeast)', '東 (East)', '南東 (Southeast)', 
                     '南 (South)', '南西 (Southwest)', '西 (West)', '北西 (Northwest)'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}