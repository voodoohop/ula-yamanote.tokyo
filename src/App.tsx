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
    const audio = new Audio('https://github.com/pollinations/ula-yamanote.tokyo/raw/refs/heads/main/convenience%20store%20-%20shabu%20shabu%20-%20please%20be%20careful.mp3');
    
    if (!isPlaying) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(() => {
          setIsGpsActive(true);
          audio.play();
          setIsPlaying(true);
        }, (error) => {
          console.error("GPS Error:", error);
          audio.play();
          setIsPlaying(true);
        });
      } else {
        audio.play();
        setIsPlaying(true);
      }

      audio.addEventListener('ended', () => {
        audio.currentTime = 0;
        audio.play();
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setIsGpsActive(false);
    }
  };

  if (!isStarted) {
    return (
      <div className="app initial-screen">
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
      <StationInfo isGpsActive={isGpsActive} />
      <button 
        className={`play-button ${isPlaying ? 'playing' : ''}`}
        onClick={handleAudioControl}
      >
        山手線 SOUND
      </button>
      <Track />
      <Train />
      <EventInfo />
      <Effects isGpsActive={isGpsActive} />
      <style>{`
        .app {
          width: 100%;
          min-height: 100vh;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
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