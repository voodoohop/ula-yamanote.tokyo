import React from 'react';
import { useState, useEffect } from 'react';
import { Train } from './components/Train';
import { Effects, Track } from './components/Effects';
import { StationInfo } from './components/StationInfo';
import { EventInfo } from './components/EventInfo';
import { SystemAlert } from './components/SystemAlert';
import { japaneseStations } from './data/stations';
import './styles/global.css';
import './styles/PlayButton.css';
import './styles/StationName.css';

function App() {
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStationIndex((prev) => (prev + 1) % japaneseStations.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleAudioControl = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setIsGpsActive(false);
      return;
    }

    setIsLoading(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsGpsActive(true);
          setIsPlaying(true);
          setIsLoading(false);
        },
        () => {
          setIsGpsActive(false);
          setIsPlaying(true);
          setIsLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIsGpsActive(false);
      setIsPlaying(true);
      setIsLoading(false);
    }
  };

  if (!isStarted) {
    return (
      <div className="app" style={{ background: '#e0f7e9' }}>
        <SystemAlert showStartButton onStart={handleStart} />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="station-header">
        <div className="header-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/anPV_7yrekE?autoplay=1&mute=1&controls=0&loop=1&playlist=anPV_7yrekE&start=${Math.floor(Math.random() * 100)}`}
            title="Header Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      <StationInfo 
        isGpsActive={isGpsActive} 
      />
      <button 
            onClick={handleAudioControl}
            className={`play-button ${isLoading ? 'loading' : ''} ${isPlaying ? 'playing' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '読み込み中...' : isPlaying ? '停止 STOP' : '発車 START'}
        </button>
      <Track />
      <Train />
      <EventInfo />
      <Effects />
      <style>{`
        .app {
          width: 100%;
          min-height: 100vh;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .initial-screen {
          justify-content: center;
          background: #000;
        }
      `}</style>
    </div>
  );
}

export default App;