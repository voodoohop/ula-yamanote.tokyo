export const japaneseStations = [
  ['六本木', 'Roppongi'],
  ['大崎', 'Osaki'],
  ['五反田', 'Gotanda'],
  ['目黒', 'Meguro'],
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
  ['日暮里', 'Nippori'],
  ['鶯谷', 'Uguisudani'],
  ['上野', 'Ueno'],
  ['御徒町', 'Okachimachi'],
  ['秋葉原', 'Akihabara'],
  ['神田', 'Kanda'],
  ['東京', 'Tokyo'],
  ['有楽町', 'Yurakucho'],
  ['新橋', 'Shimbashi'],
  ['浜松町', 'Hamamatsucho'],
  ['田町', 'Tamachi'],
  ['高輪ゲートウェイ', 'Takanawa Gateway'],
  ['品川', 'Shinagawa']
] as const;

export const stationCoordinates = [
  // {
  //   name: 'Osaki',
  //   lat: 35.6197, 
  //   lng: 139.7286
  // },
  // {
  //   name: 'Gotanda',
  //   lat: 35.6264, 
  //   lng: 139.7232
  // },
  // {
  //   name: 'Meguro',
  //   lat: 35.6330, 
  //   lng: 139.7155
  // },
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
  },
  // {
  //   name: 'Nishi-Nippori',
  //   lat: 35.7325, 
  //   lng: 139.7668
  // },
  // {
  //   name: 'Nippori',
  //   lat: 35.7289, 
  //   lng: 139.7708
  // },
  // {
  //   name: 'Uguisudani',
  //   lat: 35.7206, 
  //   lng: 139.7772
  // },
  // {
  //   name: 'Ueno',
  //   lat: 35.7138, 
  //   lng: 139.7770
  // },
  // {
  //   name: 'Okachimachi',
  //   lat: 35.7074, 
  //   lng: 139.7745
  // },
  // {
  //   name: 'Akihabara',
  //   lat: 35.6987, 
  //   lng: 139.7731
  // },
  // {
  //   name: 'Kanda',
  //   lat: 35.6917, 
  //   lng: 139.7708
  // },
  // {
  //   name: 'Tokyo',
  //   lat: 35.6814, 
  //   lng: 139.7670
  // },
  // {
  //   name: 'Yurakucho',
  //   lat: 35.6751, 
  //   lng: 139.7639
  // },
  // {
  //   name: 'Shimbashi',
  //   lat: 35.6655, 
  //   lng: 139.7598
  // },
  // {
  //   name: 'Hamamatsucho',
  //   lat: 35.6556, 
  //   lng: 139.7570
  // },
  // {
  //   name: 'Tamachi',
  //   lat: 35.6457, 
  //   lng: 139.7476
  // },
  // {
  //   name: 'Takanawa Gateway',
  //   lat: 35.6365, 
  //   lng: 139.7400
  // },
  // {
  //   name: 'Shinagawa',
  //   lat: 35.6285, 
  //   lng: 139.7388
  // }
] as const;

export const stationTrackMap: { [key: string]: string } = {
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
  'Nishi-Nippori': '14nishi-nippori.mp3',
  // 'Nippori': '15nippori.mp3',
  'Uguisudani': '16uguisudani.mp3',
  'Ueno': '17ueno.mp3',
};