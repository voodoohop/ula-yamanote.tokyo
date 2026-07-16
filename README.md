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
- Buildings: [Project PLATEAU](https://www.mlit.go.jp/plateau/) Tokyo LOD1 composite 3D Tiles.
- Roads: Project PLATEAU Tokyo transportation LOD3 composite 3D Tiles.
- Terrain: [PLATEAU-Terrain](https://docs.plateauview.mlit.go.jp/datasets/terrain/)
  quantized-mesh terrain. The service is derived from GSI elevation models and
  supplies ellipsoidal heights aligned with geocoded PLATEAU data.
- Weather: [Open-Meteo](https://open-meteo.com/) current conditions for central Tokyo.
- Location: browser Geolocation API; coordinates stay in the browser and are
  projected into the same Tokyo-local metre frame as the 3D scene, then compared
  locally with the official rail segments and 30 station progress points.

The 3D scene does not substitute generated buildings, roads, or terrain when a
source is unavailable. Its loading screen remains visible and offers a retry.

## Rendering

CesiumJS owns the geographic camera, PLATEAU 3D Tiles traversal, GSI-derived
quantized-mesh terrain, GSI imagery, route, stations, and train in one WebGL
canvas. It retains parent tiles while replacement tiles load, uses bounded
building and road caches, and lowers screen resolution and tile detail on compact
viewports. Station and train elevations are sampled from the same official
terrain provider used for rendering.

The Cesium engine, widget styles, workers, and supporting assets are loaded only
after entering `/3d`; the 2D entry path does not download the 3D runtime.

Only the low-bitrate station tracks referenced by the application are published;
unused 320 kbps source copies are not included in the deploy artifact.

## Attribution

- Railway data: Ministry of Land, Infrastructure, Transport and Tourism, Japan.
- Buildings and roads: MLIT Project PLATEAU, CC BY 4.0.
- Terrain: PLATEAU | Mapterhorn | Geospatial Information Authority of Japan.
- Weather: Open-Meteo.

Required terrain attribution is also displayed persistently in the 3D view.
