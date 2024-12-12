import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Effects, Track } from './components/Effects';
import { StationInfo } from './components/StationInfo';
import { EventInfo } from './components/EventInfo';
import { Info } from './components/Info';
import { japaneseStations } from './data/stations';
import './styles/global.css';
import './styles/PlayButton.css';
import './styles/StationName.css';

function App() {
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStationIndex((prev) => (prev + 1) % japaneseStations.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
        (error) => {
          console.error('Geolocation error:', error);
          // If permission denied, don't start playing
          if (error.code === 1) { // PERMISSION_DENIED
            setIsGpsActive(false);
            setIsPlaying(false);
          } else {
            // For other errors, continue without GPS
            setIsGpsActive(false);
            setIsPlaying(true);
          }
          setIsLoading(false);
        },
        { 
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
    } else {
      setIsGpsActive(false);
      setIsPlaying(true);
      setIsLoading(false);
    }
  };

  const MainContent = () => (
    <div className="app">
      <Link to="/info" className="info-link">情報 Info</Link>
      <StationInfo isGpsActive={isGpsActive} />
      <button 
        onClick={handleAudioControl}
        className={`play-button ${isLoading ? 'loading' : ''} ${isPlaying ? 'playing' : ''}`}
        disabled={isLoading}
      >
        {isLoading ? '読み込み中...' : isPlaying ? '停止 STOP' : '発車 START'}
      </button>
      <Track />
      <EventInfo />
      <Effects />
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/info" element={<Info />} />
      </Routes>
    </Router>
  );
}

export default App;