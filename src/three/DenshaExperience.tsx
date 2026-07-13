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
import { experienceStations } from '../data/stations';
import { useStationAudio } from '../hooks/useStationAudio';
import { useStationLocation } from '../hooks/useStationLocation';
import { useTokyoEnvironment } from '../hooks/useTokyoEnvironment';
import { CityScene } from './CityScene';
import './three.css';

const TOKYO_STATION_INDEX = experienceStations.findIndex((station) => station.name === 'Tokyo');
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
  const environment = useTokyoEnvironment(clock);

  const station = experienceStations[stationIndex];
  const previousStation = experienceStations[(stationIndex - 1 + experienceStations.length) % experienceStations.length];
  const nextStation = experienceStations[(stationIndex + 1) % experienceStations.length];
  const audio = useStationAudio(station.track, hasStarted);

  const selectNearestStation = useCallback((index: number) => setStationIndex(index), []);
  const location = useStationLocation(selectNearestStation);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
      current + direction + experienceStations.length
    ) % experienceStations.length);
  }, [location]);

  const toggleLocation = useCallback(() => {
    if (location.status === 'tracking' || location.status === 'locating') {
      location.stop();
    } else {
      location.start();
    }
  }, [location]);

  const followSceneStation = useCallback((stationName: string) => {
    const index = experienceStations.findIndex((candidate) => candidate.name === stationName);
    if (index >= 0) setStationIndex((current) => current === index ? current : index);
  }, []);

  const locationLabel = location.status === 'tracking'
    ? location.isNearLine
      ? `GPS · ${location.distance === null ? 'LIVE' : `${Math.round(location.distance)} M`}`
      : 'GPS · OFF LOOP'
    : location.status === 'locating'
      ? 'LOCATING'
      : location.status === 'denied'
        ? 'GPS DENIED'
        : location.status === 'error'
          ? 'GPS UNAVAILABLE'
          : location.status === 'unsupported'
            ? 'GPS UNSUPPORTED'
        : 'AUTO LOOP';

  return (
    <div className={`three-experience ${isRiding ? 'is-riding' : 'is-intro'} ${environment.isDay ? 'is-day' : 'is-night'} weather-${environment.precipitationKind}`}>
      <CityScene
        key={sceneAttempt}
        isRiding={isRiding}
        isPaused={audio.status === 'paused' || (location.status === 'tracking' && location.isNearLine)}
        stationName={station.name}
        environment={environment}
        onStationChange={followSceneStation}
        onReady={() => setSceneStatus('ready')}
        onError={() => setSceneStatus('error')}
      />
      <div className="three-scene-tint" aria-hidden="true" />
      <div className="three-scene-noise" aria-hidden="true" />
      <div className="three-attribution">
        <a href="https://www.mlit.go.jp/plateau/" target="_blank" rel="noreferrer">PLATEAU</a>
        <span>|</span>
        <a href="https://mapterhorn.com/" target="_blank" rel="noreferrer">Mapterhorn</a>
        <span>|</span>
        <a href="https://www.gsi.go.jp/" target="_blank" rel="noreferrer">GSI</a>
      </div>

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
          <p className="three-intro-station">
            {station.japaneseName}
            <span>{station.name} · Zone {String(stationIndex + 1).padStart(2, '0')}</span>
          </p>
          <button className="three-board-button" type="button" onClick={board} disabled={sceneStatus !== 'ready'}>
            <TrainFront size={19} />
            BOARD
          </button>
        </main>
      ) : (
        <main className="three-ride-interface">
          <div className="three-line-status">
            <span><i /> 山手線</span>
            <span>
              {tokyoTime(clock)} JST · {environment.temperature === null ? '' : `${Math.round(environment.temperature)}°C `}{environment.label}
            </span>
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
              <span>{!audio.isAvailable ? 'NO STATION AUDIO' : audio.status === 'error' ? 'AUDIO ERROR' : audio.status === 'loading' ? 'BUFFERING' : 'STATION AUDIO'}</span>
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
                disabled={!audio.isAvailable}
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
                disabled={!audio.isAvailable}
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
