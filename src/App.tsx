import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Effects } from './components/Effects';
import { StationInfo } from './components/StationInfo';
import { EventInfo } from './components/EventInfo';
import { Info } from './components/Info';
import { fullscreenManager } from './utils/fullscreen';
import { stationPlayer } from './utils/audio';
import './styles/global.css';
import './styles/PlayButton.css';
import './styles/StationName.css';

function App() {
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleAudioControl = useCallback(async () => {
    if (isPlaying) {
      stationPlayer.stop();
      setIsPlaying(false);
      setIsGpsActive(false);
      return;
    }

    setIsLoading(true);
    
    try {
      await fullscreenManager.requestFullscreen();
      
      if ("geolocation" in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          
          if (permissionStatus.state === 'denied') {
            console.error('Geolocation permission is denied');
            setIsGpsActive(false);
            setIsPlaying(false);
            return;
          }

          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              { 
                enableHighAccuracy: true,
                maximumAge: 2000,
                timeout: 10000
              }
            );
          });

          setIsGpsActive(true);
          setIsPlaying(true);
        } catch (error: any) {
          console.error('Geolocation error:', error);
          setIsGpsActive(false);
          setIsPlaying(error.code !== 1);
        }
      } else {
        setIsGpsActive(false);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Fullscreen or GPS error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying]);

  const MainContent = () => {
    if (isFullscreen) {
      return (
        <div className="app fullscreen">
          <StationInfo 
            currentStationIndex={currentStationIndex}
            setCurrentStationIndex={setCurrentStationIndex}
            isGpsActive={isGpsActive}
            setIsGpsActive={setIsGpsActive}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
          />
        </div>
      );
    }

    return (
      <div className="app">
        <Link to="/info" className="info-link">情報 Info</Link>
        <EventInfo />
        <StationInfo 
          currentStationIndex={currentStationIndex}
          setCurrentStationIndex={setCurrentStationIndex}
          isGpsActive={isGpsActive}
          setIsGpsActive={setIsGpsActive}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
        <button 
          onClick={handleAudioControl}
          className={`play-button ${isLoading ? 'loading' : ''} ${isPlaying ? 'playing' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? '読み込み中...' : isPlaying ? '停止 STOP' : '発車 START'}
        </button>
        <Effects />
      </div>
    );
  };

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