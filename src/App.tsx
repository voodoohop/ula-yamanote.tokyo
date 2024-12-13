import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Effects } from './components/Effects';
import { StationInfo } from './components/StationInfo';
import { EventInfo } from './components/EventInfo';
import { Info } from './components/Info';
import { PlayButton } from './components/PlayButton';
import { useAudioControl } from './hooks/useAudioControl';
import './styles/global.css';
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

  const handleAudioControl = useAudioControl({
    isPlaying,
    setIsPlaying,
    setIsGpsActive,
    setIsLoading
  });

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
        <PlayButton 
          onClick={handleAudioControl}
          isLoading={isLoading}
          isPlaying={isPlaying}
        />
        <Effects />
        <EventInfo />
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