# Ura Yamanote

An audio-reactive Yamanote Line experience with two views:

- `/` is the compact 2D station and sound interface.
- `/3d` streams the same loop through geographically aligned Tokyo data.

## Development

```sh
npm install
npm run dev -- --host 127.0.0.1
```

Validation:

```sh
npm run build
npm run lint
npm run data:yamanote
npm run verify:data
```

`npm run data:yamanote` downloads the current configured MLIT archive and
regenerates `src/data/yamanoteRoute.generated.ts`. The generator is deterministic
for a given archive.

## Geographic data

The application uses source data directly or generates small application-owned
indexes from official downloads. It does not copy JIVX application code or JIVX
processed data assets.

- Rail alignment and station order: [MLIT National Land Numerical Information](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html),
  railway data N02-25.
- Buildings: [indigo-lab's CC BY 4.0 vector-tile conversion](https://github.com/indigo-lab/plateau-tokyo23ku-building-mvt-2020)
  of Project PLATEAU's Tokyo 23 wards building footprints and measured heights.
- Terrain: [PLATEAU Terrain-RGB](https://github.com/Project-PLATEAU-Admin/plateau-mb-terrain-converter),
  generated from PLATEAU terrain where available and Japan's Fundamental
  Geospatial Data elevation model elsewhere.
- Base map: [GSI pale tiles](https://maps.gsi.go.jp/development/ichiran.html).
- Weather: [Open-Meteo](https://open-meteo.com/) current conditions for central Tokyo.
- Location: browser Geolocation API; coordinates stay in the browser and are
  projected into the same Tokyo-local metre frame as the 3D scene, then compared
  locally with the official rail segments and 30 station progress points.

The 3D scene has no generated geometry or alternate data fallback. Its loading
screen remains visible and offers a retry when a required source is unavailable.

## Rendering

MapLibre GL owns the camera, Terrain-RGB mesh, GSI imagery, PLATEAU-derived
building extrusions, route, stations, and train in one WebGL canvas. Buildings
are ordinary vector-map tiles with measured-height extrusions, avoiding a second
3D Tiles refinement hierarchy while the camera follows the train.

The MapLibre engine is loaded only after entering `/3d`; the 2D entry path does
not download the 3D runtime.

Only the low-bitrate station tracks referenced by the application are published;
unused 320 kbps source copies are not included in the deploy artifact.

## Attribution

- Railway data: Ministry of Land, Infrastructure, Transport and Tourism, Japan.
- Buildings: Project PLATEAU and indigo-lab, CC BY 4.0.
- Terrain: Project PLATEAU Terrain-RGB and Fundamental Geospatial Data.
- Base map: Geospatial Information Authority of Japan.
- Weather: Open-Meteo.

Required terrain attribution is also displayed persistently in the 3D view.
