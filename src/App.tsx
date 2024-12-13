import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Effects, Track } from './components/Effects';
import { StationInfo } from './components/StationInfo';
import { EventInfo } from './components/EventInfo';
import { Info } from './components/Info';
import { stations } from './data/stations';
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
    } catch (error) {
      console.log('Fullscreen request was denied or failed');
    }
    
    if ("geolocation" in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permissionStatus.state === 'denied') {
          console.error('Geolocation permission is denied');
          setIsGpsActive(false);
          setIsPlaying(false);
          setIsLoading(false);
          return;
        }

        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { 
              enableHighAccuracy: true,
              maximumAge: 2000, // Cache location for 2 seconds
              timeout: 10000
            }
          );
        });

        setIsGpsActive(true);
        setIsPlaying(true);
      } catch (error: any) {
        console.error('Geolocation error:', error);
        if (error.code === 1) {
          setIsGpsActive(false);
          setIsPlaying(false);
        } else {
          setIsGpsActive(false);
          setIsPlaying(true);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsGpsActive(false);
      setIsPlaying(true);
      setIsLoading(false);
    }
  }, [isPlaying]);

  const MainContent = () => (
    <div className={`app ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isFullscreen && (
        <>
          <Link to="/info" className="info-link">情報 Info</Link>
          <EventInfo />
        </>
      )}
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
      {!isFullscreen && (
        <button 
          onClick={handleAudioControl}
          className={`play-button ${isLoading ? 'loading' : ''} ${isPlaying ? 'playing' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? '読み込み中...' : isPlaying ? '停止 STOP' : '発車 START'}
        </button>
      )}
      {!isFullscreen && (
        <>
          <Track />
          <Effects />
        </>
      )}
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