import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LocateFixed,
  MapPinOff,
  Pause,
  Play,
  TrainFront,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AboutPanel } from '../components/AboutPanel';
import { ExperienceModeSwitch } from '../components/ExperienceModeSwitch';
import { audioStations } from '../data/stations';
import { useStationAudio } from '../hooks/useStationAudio';
import { useStationLocation } from '../hooks/useStationLocation';
import { CityScene } from './CityScene';
import './three.css';

const TOKYO_STATION_INDEX = audioStations.findIndex((station) => station.name === 'Tokyo');
const AUTO_ADVANCE_MS = 90_000;
type SceneStatus = 'loading' | 'ready' | 'error';

function tokyoTime(date: Date) {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tokyo',
  }).format(date);
}

export function DenshaExperience() {
  const [stationIndex, setStationIndex] = useState(Math.max(TOKYO_STATION_INDEX, 0));
  const [isRiding, setIsRiding] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [sceneStatus, setSceneStatus] = useState<SceneStatus>('loading');
  const [sceneAttempt, setSceneAttempt] = useState(0);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  const station = audioStations[stationIndex];
  const previousStation = audioStations[(stationIndex - 1 + audioStations.length) % audioStations.length];
  const nextStation = audioStations[(stationIndex + 1) % audioStations.length];
  const audio = useStationAudio(station.track, hasStarted);

  const selectNearestStation = useCallback((index: number) => setStationIndex(index), []);
  const location = useStationLocation(selectNearestStation);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isRiding || location.status === 'tracking') return;
    const timer = window.setInterval(() => {
      setStationIndex((current) => (current + 1) % audioStations.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [isRiding, location.status]);

  useEffect(() => {
    if (!isAboutOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsAboutOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isAboutOpen]);

  const toggleAudio = useCallback(() => {
    if (!hasStarted) setHasStarted(true);
    audio.toggle();
  }, [audio, hasStarted]);

  const board = useCallback(() => {
    setIsRiding(true);
    toggleAudio();
  }, [toggleAudio]);

  const moveStation = useCallback((direction: -1 | 1) => {
    location.stop();
    setStationIndex((current) => (
      current + direction + audioStations.length
    ) % audioStations.length);
  }, [location]);

  const toggleLocation = useCallback(() => {
    if (location.status === 'tracking' || location.status === 'locating') {
      location.stop();
    } else {
      location.start();
    }
  }, [location]);

  const locationLabel = location.status === 'tracking'
    ? `GPS · ${location.distance === null ? 'LIVE' : `${Math.round(location.distance)} M`}`
    : location.status === 'locating'
      ? 'LOCATING'
      : location.status === 'denied'
        ? 'GPS DENIED'
        : 'AUTO LOOP';

  return (
    <div className={`three-experience ${isRiding ? 'is-riding' : 'is-intro'}`}>
      <CityScene
        key={sceneAttempt}
        isRiding={isRiding}
        isPaused={audio.status === 'paused'}
        stationName={station.name}
        onReady={() => setSceneStatus('ready')}
        onError={() => setSceneStatus('error')}
      />
      <div className="three-scene-tint" aria-hidden="true" />
      <div className="three-scene-noise" aria-hidden="true" />

      <header className="three-header">
        <a className="three-brand" href="/3d" aria-label="Ura Yamanote 3D home">
          <span className="line-dot" />
          <strong>ウラ山手</strong>
          <span>3D LOOP</span>
        </a>
        <ExperienceModeSwitch activeMode="3d" />
        <button
          className="icon-button three-info-button"
          type="button"
          onClick={() => setIsAboutOpen(true)}
          aria-label="About Ura Yamanote"
          title="About"
        >
          <HelpCircle size={18} strokeWidth={1.8} />
        </button>
      </header>

      {sceneStatus !== 'ready' && (
        <div className={`three-loading ${sceneStatus === 'error' ? 'is-error' : ''}`} role="status">
          <span />
          {sceneStatus === 'error' ? 'OFFICIAL TOKYO DATA UNAVAILABLE' : 'STREAMING OFFICIAL TOKYO DATA'}
          {sceneStatus === 'error' && (
            <button
              type="button"
              onClick={() => {
                setSceneStatus('loading');
                setSceneAttempt((attempt) => attempt + 1);
              }}
            >
              RETRY
            </button>
          )}
        </div>
      )}

      {!isRiding ? (
        <main className="three-intro">
          <p className="eyebrow">YAMANOTE SOUND SYSTEM · TOKYO</p>
          <h1>
            <span lang="ja">ウラ山手</span>
            <small>ULA YAMANOTE · 3D LOOP</small>
          </h1>
          <div className="three-intro-rule" aria-hidden="true" />
          <p className="three-intro-station">東京 <span>Tokyo · Zone 03</span></p>
          <button className="three-board-button" type="button" onClick={board} disabled={sceneStatus !== 'ready'}>
            <TrainFront size={19} />
            BOARD
          </button>
        </main>
      ) : (
        <main className="three-ride-interface">
          <div className="three-line-status">
            <span><i /> 山手線</span>
            <span>{tokyoTime(clock)} JST</span>
            <span>{locationLabel}</span>
          </div>

          <section className="three-station-board" aria-live="polite">
            <div className="three-board-heading">
              <span>ZONE {String(stationIndex + 1).padStart(2, '0')}</span>
              <span>NOW APPROACHING</span>
            </div>
            <h2 lang="ja">{station.japaneseName}</h2>
            <p>{station.name}</p>
            <div className="three-next-station">
              <span>次は</span>
              <strong>{nextStation.japaneseName}</strong>
              <span>{nextStation.name}</span>
            </div>
          </section>

          <div className="three-route-strip" aria-label={`${previousStation.name}, ${station.name}, ${nextStation.name}`}>
            <span>{previousStation.name}</span>
            <i aria-hidden="true" />
            <strong>{station.name}</strong>
            <i aria-hidden="true" />
            <span>{nextStation.name}</span>
          </div>

          <footer className="three-controls">
            <div className="three-control-status">
              <span className={location.status === 'tracking' ? 'is-live' : ''}>{locationLabel}</span>
              <span>{audio.status === 'error' ? 'AUDIO ERROR' : audio.status === 'loading' ? 'BUFFERING' : 'STATION AUDIO'}</span>
            </div>
            <div className="three-transport">
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
              <span className="three-control-divider" aria-hidden="true" />
              <button
                className={`icon-button ${location.status === 'tracking' ? 'three-active-control' : ''}`}
                type="button"
                onClick={toggleLocation}
                aria-label={location.status === 'tracking' ? 'Disable location tracking' : 'Use current location'}
                title={location.status === 'tracking' ? 'Disable location' : 'Use location'}
              >
                {location.status === 'tracking' ? <MapPinOff size={18} /> : <LocateFixed size={18} />}
              </button>
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
        </main>
      )}

      <AboutPanel isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
