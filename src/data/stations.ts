import { yamanoteRouteStations } from './yamanoteRoute.generated.ts';

export interface Station {
  name: string;
  japaneseName: string;
  lat: number;
  lng: number;
  story?: string;
}

const stationStories: Partial<Record<string, string>> = {
  Uguisudani: 'Legend tells of a Kyoto potter who released nightingales from Kyoto here, hoping their elegant songs would bring peace to the priests of nearby Kan\'ei-ji Temple and the spirits of the Tokugawa shoguns resting atop Ueno.',
};

// Operating-loop order, starting at Shimbashi, from the official 2025 MLIT railway dataset.
export const stations: Station[] = yamanoteRouteStations.map((station) => ({
  name: station.name,
  japaneseName: station.japaneseName,
  lat: station.lat,
  lng: station.lng,
  story: stationStories[station.name],
}));

export const stationTrackMap: { [key: string]: string } = {
  // Yamanote Line station mappings
  'Shinagawa': '26shinagawa',
  'Osaki': '27osaki',
  'Gotanda': '28gotanda',
  'Meguro': '29meguro',
  'Ebisu': '01ebisu',
  'Shibuya': '02shibuya',
  'Harajuku': '03harajuku',
  'Yoyogi': '04yoyogi',
  'Shinjuku': '05shinjuku',
  'Shin-Okubo': '06shinokubo',
  'Takadanobaba': '07takadanobaba',
  'Mejiro': '08mejiro',
  'Ikebukuro': '09ikebukuro',
  'Otsuka': '10otsuka',
  'Sugamo': '11sugamo',
  'Komagome': '12komagome',
  'Tabata': '13tabata',
  'Nishi-Nippori': '14nishinippori',
  'Uguisudani': '16uguisudani',
  'Ueno': '17ueno',
  'Okachimachi': '18okachimachi',
  'Akihabara': '19akihabara',
  'Kanda': '20kanda',
  'Tokyo': '21tokyo',
  'Yurakucho': '22yurakucho',
  'Shimbashi': '23shimbashi',
  'Hamamatsucho': '24hamamatsucho',
  'Tamachi': '25tamachi'
};

export interface ExperienceStation extends Station {
  track: string | null;
}

export const experienceStations: ExperienceStation[] = stations.map((station) => ({
  ...station,
  track: stationTrackMap[station.name] ?? null,
}));
