export const TOKYO_ORIGIN = { lat: 35.681236, lng: 139.767125 } as const;

const METERS_PER_DEGREE_LATITUDE = 111_132;
const METERS_PER_DEGREE_LONGITUDE = 111_320
  * Math.cos(TOKYO_ORIGIN.lat * Math.PI / 180);

export function projectYamanoteMeters(lng: number, lat: number) {
  return {
    east: (lng - TOKYO_ORIGIN.lng) * METERS_PER_DEGREE_LONGITUDE,
    north: (lat - TOKYO_ORIGIN.lat) * METERS_PER_DEGREE_LATITUDE,
  };
}
