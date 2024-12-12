export const japaneseStations = [
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
  ['神田', 'Kanda'],
  ['目黒', 'Meguro'],
  ['五反田', 'Gotanda'],
  ['大崎', 'Osaki'],
  ['品川', 'Shinagawa'],
  ['田町', 'Tamachi'],
  ['浜松町', 'Hamamatsucho'],
  ['新橋', 'Shimbashi'],
  ['有楽町', 'Yurakucho'],
  ['東京', 'Tokyo'],
  ['日暮里', 'Nippori']
] as const;

export const stationCoordinates = [
  // Yamanote Line stations in order
  {
    name: 'Shimbashi',
    lat: 35.6662,
    lng: 139.7583
  },
  {
    name: 'Yurakucho',
    lat: 35.6749,
    lng: 139.7628
  },
  {
    name: 'Tokyo',
    lat: 35.6812,
    lng: 139.7671
  },
  {
    name: 'Kanda',
    lat: 35.6918,
    lng: 139.7712
  },
  {
    name: 'Akihabara',
    lat: 35.6984,
    lng: 139.7731
  },
  {
    name: 'Okachimachi',
    lat: 35.7075,
    lng: 139.7747
  },
  {
    name: 'Ueno',
    lat: 35.7141,
    lng: 139.7774
  },
  {
    name: 'Uguisudani',
    lat: 35.7205,
    lng: 139.7785
  },
  {
    name: 'Nishi-Nippori',
    lat: 35.7324,
    lng: 139.7687
  },
  {
    name: 'Nippori',
    lat: 35.7281,
    lng: 139.7707
  },
  {
    name: 'Tabata',
    lat: 35.7380,
    lng: 139.7600
  },
  {
    name: 'Komagome',
    lat: 35.7365,
    lng: 139.7460
  },
  {
    name: 'Sugamo',
    lat: 35.7335,
    lng: 139.7394
  },
  {
    name: 'Otsuka',
    lat: 35.7311,
    lng: 139.7282
  },
  {
    name: 'Ikebukuro',
    lat: 35.7289,
    lng: 139.7100
  },
  {
    name: 'Mejiro',
    lat: 35.7212,
    lng: 139.7064
  },
  {
    name: 'Takadanobaba',
    lat: 35.7123,
    lng: 139.7030
  },
  {
    name: 'Shin-Okubo',
    lat: 35.7013,
    lng: 139.7005
  },
  {
    name: 'Shinjuku',
    lat: 35.6900,
    lng: 139.7004
  },
  {
    name: 'Yoyogi',
    lat: 35.6830,
    lng: 139.7022
  },
  {
    name: 'Harajuku',
    lat: 35.6702,
    lng: 139.7028
  },
  {
    name: 'Shibuya',
    lat: 35.6580,
    lng: 139.7016
  },
  {
    name: 'Ebisu',
    lat: 35.6467,
    lng: 139.7101
  },
  {
    name: 'Meguro',
    lat: 35.6340,
    lng: 139.7160
  },
  {
    name: 'Gotanda',
    lat: 35.6262,
    lng: 139.7233
  },
  {
    name: 'Osaki',
    lat: 35.6197,
    lng: 139.7283
  },
  {
    name: 'Shinagawa',
    lat: 35.6284,
    lng: 139.7387
  },
  {
    name: 'Tamachi',
    lat: 35.6457,
    lng: 139.7475
  },
  {
    name: 'Hamamatsucho',
    lat: 35.6553,
    lng: 139.7571
  }
] as const;

export const stationTrackMap: { [key: string]: string } = {
  // Yamanote Line station mappings
  'Shimbashi': '01shimbashi.mp3',
  'Yurakucho': '02yurakucho.mp3',
  'Tokyo': '03tokyo.mp3',
  'Kanda': '04kanda.mp3',
  'Akihabara': '05akihabara.mp3',
  'Okachimachi': '06okachimachi.mp3',
  'Ueno': '07ueno.mp3',
  'Uguisudani': '08uguisudani.mp3',
  'Nishi-Nippori': '09nishinippori.mp3',
  'Nippori': '10nippori.mp3',
  'Tabata': '11tabata.mp3',
  'Komagome': '12komagome.mp3',
  'Sugamo': '13sugamo.mp3',
  'Otsuka': '14otsuka.mp3',
  'Ikebukuro': '15ikebukuro.mp3',
  'Mejiro': '16mejiro.mp3',
  'Takadanobaba': '17takadanobaba.mp3',
  'Shin-Okubo': '18shinokubo.mp3',
  'Shinjuku': '19shinjuku.mp3',
  'Yoyogi': '20yoyogi.mp3',
  'Harajuku': '21harajuku.mp3',
  'Shibuya': '22shibuya.mp3',
  'Ebisu': '23ebisu.mp3',
  'Meguro': '24meguro.mp3',
  'Gotanda': '25gotanda.mp3',
  'Osaki': '26osaki.mp3',
  'Shinagawa': '27shinagawa.mp3',
  'Tamachi': '28tamachi.mp3',
  'Hamamatsucho': '29hamamatsucho.mp3'
};