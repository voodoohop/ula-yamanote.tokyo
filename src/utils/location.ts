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

export function getDirection(from: Coordinates, to: Coordinates): string {
  const lat = to.lat - from.lat;
  const lng = to.lng - from.lng;
  
  let direction = '';
  if (Math.abs(lat) > Math.abs(lng)) {
    direction = lat > 0 ? '北' : '南';
    direction += lat > 0 ? ' (North)' : ' (South)';
  } else {
    direction = lng > 0 ? '東' : '西';
    direction += lng > 0 ? ' (East)' : ' (West)';
  }
  return direction;
}