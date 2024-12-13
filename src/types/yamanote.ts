export interface Point {
  x: number;
  y: number;
}

export interface TrainPosition {
  x: number;
  y: number;
  angle: number;
}

export interface Props {
  width?: number;
  height?: number;
  userPosition?: {
    lat: number;
    lng: number;
  };
  closestStation?: string;
}
