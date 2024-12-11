export const japaneseStations = [
  ['大岡山', 'Ōokayama'],
  ['自由が丘', 'Jiyūgaoka'],
  ['二子玉川', 'Futako-Tamagawa'],
  ['津田山', 'Tsudayama'],
  ['久慈', 'Kuji'],
  ['宿河原', 'Shukugawara'],
  ['登戸', 'Noborito'],
  ['向ヶ丘遊園', 'Mukogaoka-Yuen'],
  ['生田', 'Ikuta']
] as const;

export const stationCoordinates = [
  {
    name: 'Ōokayama',
    lat: 35.6074211,
    lng: 139.685711
  },
  {
    name: 'Jiyūgaoka',
    lat: 35.607512,
    lng: 139.668612
  },
  {
    name: 'Futako-Tamagawa',
    lat: 35.61158213,
    lng: 139.62677813
  },
  {
    name: 'Tsudayama',
    lat: 35.60412914,
    lng: 139.60001514
  },
  {
    name: 'Kuji',
    lat: 40.19051915,
    lng: 141.77084715
  },
  {
    name: 'Shukugawara',
    lat: 35.61533316,
    lng: 139.57943516
  },
  {
    name: 'Noborito',
    lat: 35.6208317,
    lng: 139.5717
  },
  {
    name: 'Mukogaoka-Yuen',
    lat: 35.61719518,
    lng: 139.5645518
  },
  {
    name: 'Ikuta',
    lat: 35.61519,
    lng: 139.54219
  }
] as const;

export const stationTrackMap: { [key: string]: string } = {
  'Ōokayama': '01ebisu.mp3',
  'Jiyūgaoka': '02shibuya.mp3',
  'Futako-Tamagawa': '03harajuku.mp3',
  'Tsudayama': '04yoyogi.mp3',
  'Kuji': '05shinjuku.mp3',
  'Shukugawara': '06shin-okubo.mp3',
  'Noborito': '07takadanobaba.mp3',
  'Mukogaoka-Yuen': '08mejiro.mp3',
  'Ikuta': '09ikebukuro.mp3'
};