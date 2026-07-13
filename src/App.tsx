import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LocateFixed,
  MapPinOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AboutPanel } from './components/AboutPanel';
import { YamanoteMap } from './components/YamanoteMap';
import { audioStations } from './data/stations';
import { useStationAudio } from './hooks/useStationAudio';
import { useStationLocation } from './hooks/useStationLocation';
import stationDisplay from './assets/glitchstationdisplaysmaller.webp';
import './styles/global.css';

const TOKYO_STATION_INDEX = audioStations.findIndex((station) => station.name === 'Tokyo');

function formatDistance(distance: number | null) {
  if (distance === null) return null;
  return distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`;
}

function App() {
  const [stationIndex, setStationIndex] = useState(Math.max(TOKYO_STATION_INDEX, 0));
  const [hasStarted, setHasStarted] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const station = audioStations[stationIndex];
  const previousStation = audioStations[(stationIndex - 1 + audioStations.length) % audioStations.length];
  const nextStation = audioStations[(stationIndex + 1) % audioStations.length];
  const audio = useStationAudio(station.track, hasStarted);

  const selectNearestStation = useCallback((index: number) => setStationIndex(index), []);
  const location = useStationLocation(selectNearestStation);

  useEffect(() => {
    if (!isAboutOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAboutOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isAboutOpen]);

  const selectStation = useCallback((index: number) => {
    location.stop();
    setStationIndex(index);
  }, [location]);

  const moveStation = useCallback((direction: -1 | 1) => {
    location.stop();
    setStationIndex((current) => (
      current + direction + audioStations.length
    ) % audioStations.length);
  }, [location]);

  const toggleAudio = useCallback(() => {
    if (!hasStarted) setHasStarted(true);
    audio.toggle();
  }, [audio, hasStarted]);

  const toggleLocation = useCallback(() => {
    if (location.status === 'tracking' || location.status === 'locating') {
      location.stop();
    } else {
      location.start();
    }
  }, [location]);

  const distance = formatDistance(location.distance);
  const locationStatus = location.status === 'tracking'
    ? `LIVE · ${distance ?? 'GPS'}`
    : location.status === 'locating'
      ? 'LOCATING'
      : location.status === 'denied'
        ? 'GPS DENIED'
        : location.status === 'error'
          ? 'GPS UNAVAILABLE'
          : 'MANUAL';

  return (
    <div className="experience-shell">
      <div className="background-media" aria-hidden="true">
        <img src={stationDisplay} alt="" />
      </div>
      <div className="background-grid" aria-hidden="true" />

      <header className="app-header">
        <a className="brand" href="#top" aria-label="Ura Yamanote home">
          <span className="line-dot" />
          <strong>ウラ山手</strong>
          <span>ULA YAMANOTE</span>
        </a>
        <button
          className="icon-button header-button"
          type="button"
          onClick={() => setIsAboutOpen(true)}
          aria-label="About Ura Yamanote"
          title="About"
        >
          <HelpCircle size={18} strokeWidth={1.8} />
        </button>
      </header>

      <main className="app-stage" id="top">
        <section className="station-console" aria-live="polite">
          <p className="eyebrow">YAMANOTE SOUND LOOP · ZONE {String(stationIndex + 1).padStart(2, '0')}</p>
          <h1>
            <span lang="ja">{station.japaneseName}</span>
            <small>{station.name}</small>
          </h1>

          <div className="station-rule" aria-hidden="true">
            <span />
          </div>

          <div className="station-sequence">
            <span>{previousStation.name}</span>
            <strong>{station.name}</strong>
            <span>{nextStation.name}</span>
          </div>

          <p className="station-status">
            {location.status === 'tracking'
              ? `${locationStatus}${location.speed === null ? '' : ` · ${location.speed} km/h`}`
              : 'LOCATION-REACTIVE STATION AUDIO'}
          </p>

          <div className="primary-actions">
            <button className="play-button" type="button" onClick={toggleAudio}>
              {audio.status === 'playing' ? <Pause size={18} /> : <Play size={18} />}
              {audio.status === 'playing' ? 'PAUSE' : hasStarted ? 'RESUME' : 'ENTER LOOP'}
            </button>
            <button
              className={`location-button ${location.status === 'tracking' ? 'is-active' : ''}`}
              type="button"
              onClick={toggleLocation}
            >
              {location.status === 'tracking' ? <MapPinOff size={17} /> : <LocateFixed size={17} />}
              {location.status === 'tracking' ? 'STOP GPS' : location.status === 'locating' ? 'LOCATING' : 'USE GPS'}
            </button>
          </div>

          {audio.status === 'error' && (
            <p className="inline-error" role="alert">Station audio could not be loaded.</p>
          )}
        </section>

        <section className="map-tool" aria-label="Yamanote sound zones">
          <div className="map-heading">
            <span>山手線 · SOUND MAP</span>
            <span>{audioStations.length} ZONES</span>
          </div>
          <YamanoteMap
            activeIndex={stationIndex}
            isTracking={location.status === 'tracking'}
            onSelect={selectStation}
          />
        </section>
      </main>

      <footer className="transport-bar">
        <div className="transport-status">
          <span className={location.status === 'tracking' ? 'is-live' : ''}>{locationStatus}</span>
          <span>{audio.status === 'loading' ? 'BUFFERING' : audio.status === 'playing' ? 'AUDIO ON' : 'AUDIO READY'}</span>
        </div>
        <div className="transport-buttons">
          <button
            className="icon-button"
            type="button"
            onClick={() => moveStation(-1)}
            aria-label={`Previous station, ${previousStation.name}`}
            title="Previous station"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="icon-button main-transport"
            type="button"
            onClick={toggleAudio}
            aria-label={audio.status === 'playing' ? 'Pause station audio' : 'Play station audio'}
            title={audio.status === 'playing' ? 'Pause' : 'Play'}
          >
            {audio.status === 'playing' ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => moveStation(1)}
            aria-label={`Next station, ${nextStation.name}`}
            title="Next station"
          >
            <ChevronRight size={20} />
          </button>
          <span className="button-divider" aria-hidden="true" />
          <button
            className="icon-button"
            type="button"
            onClick={audio.toggleMute}
            aria-label={audio.isMuted ? 'Unmute station audio' : 'Mute station audio'}
            title={audio.isMuted ? 'Unmute' : 'Mute'}
          >
            {audio.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </footer>

      <AboutPanel isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

export default App;
