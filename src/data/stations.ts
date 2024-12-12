export const japaneseStations = [
  ['大岡山', 'Ōokayama'],
  ['自由が丘', 'Jiyūgaoka'],
  ['二子玉川', 'Futako-Tamagawa'],
  ['津田山', 'Tsudayama'],
  ['久慈', 'Kuji'],
  ['宿河原', 'Shukugawara'],
  ['登戸', 'Noborito'],
  ['向ヶ丘遊園', 'Mukogaoka-Yuen'],
  ['生田', 'Ikuta'],
  ['恵比寿', 'Ebisu'],
  ['渋谷', 'Shibuya'],
  ['原宿', 'Harajuku'],
  ['代々木', 'Yoyogi'],
  ['新宿', 'Shinjuku'],
  ['新大久保', 'Shin-Okubo'],
  ['高田馬場', 'Takadanobaba'],
  ['目白', 'Mejiro'],
  ['池袋', 'Ikebukuro'],
  ['大塚', 'Otsuka'],
  ['巣鴨', 'Sugamo'],
  ['駒込', 'Komagome'],
  ['田端', 'Tabata'],
  ['西日暮里', 'Nishi-Nippori'],
  ['鶯谷', 'Uguisudani'],
  ['上野', 'Ueno'],
  ['御徒町', 'Okachimachi'],
  ['秋葉原', 'Akihabara'],
  ['神田', 'Kanda']
] as const;

export const stationCoordinates = [
  // Debug stations
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
  },
  // Yamanote Line stations
  {
    name: 'Ebisu',
    lat: 35.6467, 
    lng: 139.7101
  },
  {
    name: 'Shibuya',
    lat: 35.6580, 
    lng: 139.7016
  },
  {
    name: 'Harajuku',
    lat: 35.6702, 
    lng: 139.7028
  },
  {
    name: 'Yoyogi',
    lat: 35.6830, 
    lng: 139.7022
  },
  {
    name: 'Shinjuku',
    lat: 35.6900, 
    lng: 139.7004
  },
  {
    name: 'Shin-Okubo',
    lat: 35.7013, 
    lng: 139.7005
  },
  {
    name: 'Takadanobaba',
    lat: 35.7123, 
    lng: 139.7030
  },
  {
    name: 'Mejiro',
    lat: 35.7212, 
    lng: 139.7064
  },
  {
    name: 'Ikebukuro',
    lat: 35.7289, 
    lng: 139.7100
  },
  {
    name: 'Otsuka',
    lat: 35.7311, 
    lng: 139.7282
  },
  {
    name: 'Sugamo',
    lat: 35.7335, 
    lng: 139.7394
  },
  {
    name: 'Komagome',
    lat: 35.7365, 
    lng: 139.7460
  },
  {
    name: 'Tabata',
    lat: 35.7380, 
    lng: 139.7600
  }
] as const;

export const stationTrackMap: { [key: string]: string } = {
  // Debug station mappings
  'Ōokayama': '01ebisu.mp3',
  'Jiyūgaoka': '02shibuya.mp3',
  'Futako-Tamagawa': '03harajuku.mp3',
  'Tsudayama': '04yoyogi.mp3',
  'Kuji': '05shinjuku.mp3',
  'Shukugawara': '06shinokubo.mp3',
  'Noborito': '07takadanobaba.mp3',
  'Mukogaoka-Yuen': '08mejiro.mp3',
  'Ikuta': '09ikebukuro.mp3',
  // Yamanote Line station mappings
  'Ebisu': '01ebisu.mp3',
  'Shibuya': '02shibuya.mp3',
  'Harajuku': '03harajuku.mp3',
  'Yoyogi': '04yoyogi.mp3',
  'Shinjuku': '05shinjuku.mp3',
  'Shin-Okubo': '06shinokubo.mp3',
  'Takadanobaba': '07takadanobaba.mp3',
  'Mejiro': '08mejiro.mp3',
  'Ikebukuro': '09ikebukuro.mp3',
  'Otsuka': '10otsuka.mp3',
  'Sugamo': '11sugamo.mp3',
  'Komagome': '12komagome.mp3',
  'Tabata': '13tabata.mp3',
  'Nishi-Nippori': '14nishinippori.mp3',
  'Uguisudani': '16uguisudani.mp3',
  'Ueno': '17ueno.mp3',
  'Okachimachi': '18okachimachi.mp3',
  'Akihabara': '19akihabara.mp3',
  'Kanda': '20kanda.mp3'
};