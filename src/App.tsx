import React from 'react';
import { useState, useEffect } from 'react';
import { Train } from './components/Train';
import { Effects } from './components/Effects';
import { StationInfo } from './components/StationInfo';
import YouTubeBackground from './components/YouTubeBackground';
import { japaneseStations } from './data/stations';
import './styles/global.css';
import './styles/PlayButton.css';
import './styles/StationName.css';

function App() {
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStationIndex((prev) => (prev + 1) % japaneseStations.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="container relative min-h-screen">
      <YouTubeBackground videoId="5gfY-EMa1Oc" />
      <Effects isGpsActive={isGpsActive} />
      <div 
        className="station-name" 
        data-romaji={japaneseStations[currentStationIndex][1]}
      >
        {japaneseStations[currentStationIndex][0]}
      </div>
      <Train />
      <button 
        className={`play-button ${isPlaying ? 'playing' : ''}`}
        onClick={handleAudioControl}
      >
        山手線 SOUND
      </button>
      <StationInfo isGpsActive={isGpsActive} />
    </div>
  );
}

export default App;