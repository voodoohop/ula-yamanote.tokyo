export interface Station {
  name: string;
  japaneseName: string;
  lat: number;
  lng: number;
}

export const stations: Station[] = [
  {
    name: 'Shinagawa',
    japaneseName: '品川',
    lat: 35.6284,
    lng: 139.7387
  },
  {
    name: 'Osaki',
    japaneseName: '大崎',
    lat: 35.6197,
    lng: 139.7283
  },
  {
    name: 'Gotanda',
    japaneseName: '五反田',
    lat: 35.6262,
    lng: 139.7233
  },
  {
    name: 'Meguro',
    japaneseName: '目黒',
    lat: 35.6414,
    lng: 139.7157
  },
  {
    name: 'Ebisu',
    japaneseName: '恵比寿',
    lat: 35.6467,
    lng: 139.7101
  },
  {
    name: 'Shibuya',
    japaneseName: '渋谷',
    lat: 35.6580,
    lng: 139.7016
  },
  {
    name: 'Harajuku',
    japaneseName: '原宿',
    lat: 35.6702,
    lng: 139.7028
  },
  {
    name: 'Yoyogi',
    japaneseName: '代々木',
    lat: 35.6830,
    lng: 139.7022
  },
  {
    name: 'Shinjuku',
    japaneseName: '新宿',
    lat: 35.6900,
    lng: 139.7004
  },
  {
    name: 'Shin-Okubo',
    japaneseName: '新大久保',
    lat: 35.7013,
    lng: 139.7005
  },
  {
    name: 'Takadanobaba',
    japaneseName: '高田馬場',
    lat: 35.7123,
    lng: 139.7030
  },
  {
    name: 'Mejiro',
    japaneseName: '目白',
    lat: 35.7212,
    lng: 139.7064
  },
  {
    name: 'Ikebukuro',
    japaneseName: '池袋',
    lat: 35.7289,
    lng: 139.7100
  },
  {
    name: 'Otsuka',
    japaneseName: '大塚',
    lat: 35.7311,
    lng: 139.7282
  },
  {
    name: 'Sugamo',
    japaneseName: '巣鴨',
    lat: 35.7335,
    lng: 139.7394
  },
  {
    name: 'Komagome',
    japaneseName: '駒込',
    lat: 35.7365,
    lng: 139.7460
  },
  {
    name: 'Tabata',
    japaneseName: '田端',
    lat: 35.7380,
    lng: 139.7600
  },
  {
    name: 'Nishi-Nippori',
    japaneseName: '西日暮里',
    lat: 35.7324,
    lng: 139.7687
  },
  {
    name: 'Nippori',
    japaneseName: '日暮里',
    lat: 35.7281,
    lng: 139.7707
  },
  {
    name: 'Uguisudani',
    japaneseName: '鶯谷',
    lat: 35.7205,
    lng: 139.7785
  },
  {
    name: 'Ueno',
    japaneseName: '上野',
    lat: 35.7141,
    lng: 139.7774
  },
  {
    name: 'Okachimachi',
    japaneseName: '御徒町',
    lat: 35.7075,
    lng: 139.7747
  },
  {
    name: 'Akihabara',
    japaneseName: '秋葉原',
    lat: 35.6984,
    lng: 139.7731
  },
  {
    name: 'Kanda',
    japaneseName: '神田',
    lat: 35.6918,
    lng: 139.7712
  },
  {
    name: 'Tokyo',
    japaneseName: '東京',
    lat: 35.6812,
    lng: 139.7671
  },
  {
    name: 'Yurakucho',
    japaneseName: '有楽町',
    lat: 35.6749,
    lng: 139.7628
  },
  {
    name: 'Shimbashi',
    japaneseName: '新橋',
    lat: 35.6662,
    lng: 139.7583
  },
  {
    name: 'Hamamatsucho',
    japaneseName: '浜松町',
    lat: 35.6553,
    lng: 139.7571
  },
  {
    name: 'Tamachi',
    japaneseName: '田町',
    lat: 35.6457,
    lng: 139.7476
  }
];

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