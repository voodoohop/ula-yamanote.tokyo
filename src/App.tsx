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

  const handleAudioControl = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      setIsGpsActive(false);
      return;
    }

    setIsLoading(true);
    
    if ("geolocation" in navigator) {
      try {
        // Check for existing permissions first
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permissionStatus.state === 'denied') {
          console.error('Geolocation permission is denied. Please enable it in your browser settings.');
          setIsGpsActive(false);
          setIsPlaying(false);
          setIsLoading(false);
          return;
        }

        // Request location with a longer timeout
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { 
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 10000 // Increased timeout to 10 seconds
            }
          );
        });

        setIsGpsActive(true);
        setIsPlaying(true);
      } catch (error: any) {
        console.error('Geolocation error:', error);
        // If permission denied or timeout
        if (error.code === 1) { // PERMISSION_DENIED
          console.error('Location permission denied by user or system');
          setIsGpsActive(false);
          setIsPlaying(false);
        } else if (error.code === 3) { // TIMEOUT
          console.error('Location request timed out');
          setIsGpsActive(false);
          setIsPlaying(true);
        } else {
          // For other errors, continue without GPS
          console.error('Other location error:', error.message);
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