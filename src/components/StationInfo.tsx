import React, { useEffect, useCallback, useState } from 'react';
import { SystemAlert } from './SystemAlert';
import { YamanoteLine } from './YamanoteLine';
import { GPSIndicator } from './GPSIndicator';
import { stationPlayer } from '../utils/audio';
import { debounce } from '../utils/debounce';
import { wakeLockManager } from '../utils/wakeLock';
import { useGPSTracking } from '../hooks/useGPSTracking';
import { useSpeedRate } from '../hooks/useSpeedRate';
import { stationTrackMap } from '../data/stations';
import stationDisplayImage from '../assets/glitchstationdisplaysmaller.webp';
import * as Tone from 'tone';
import '../styles/StationInfo.css';

interface Props {
  currentStationIndex: number;
  setCurrentStationIndex: (index: number) => void;
  isGpsActive: boolean;
  setIsGpsActive: (active: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface StationData {
  name: string;
  japaneseName: string;
  distance: number;
  direction: string;
  speed: number | null;
  userLat: number;
  userLng: number;
}

export function StationInfo({ 
  currentStationIndex,
  setCurrentStationIndex,
  isGpsActive,
  setIsGpsActive,
  isPlaying,
  setIsPlaying,
  isLoading,
  setIsLoading
}: Props) {
  const [glitchText, setGlitchText] = useState('');
  const [glitchClass, setGlitchClass] = useState('');
  const [currentPlayingStation, setCurrentPlayingStation] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  
  const { stationData, gpsUpdateReceived } = useGPSTracking(isGpsActive);
  useSpeedRate(stationData?.speed ?? null);

  const transitionToStation = useCallback(async (stationName: string) => {
    console.log('Transitioning from', currentPlayingStation, 'to', stationName);
    
    try {
      if (!isAudioInitialized) {
        await Tone.start();
        setIsAudioInitialized(true);
      }
      
      if (stationName) {
        setIsLoading(true);
        await stationPlayer?.loadTrack(stationName);
        setCurrentPlayingStation(stationName);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error transitioning to station:', error);
      setIsLoading(false);
    }
  }, [currentPlayingStation, isAudioInitialized]);

  // Create debounced version of transition function
  const debouncedTransition = useCallback(
    debounce(transitionToStation, 1000),
    [transitionToStation]
  );

  useEffect(() => {
    const stations = Object.keys(stationTrackMap);
    const currentStation = stations[currentStationIndex];
    
    if (currentStation) {
      debouncedTransition(currentStation);
    }

    // Cleanup
    return () => {
      debouncedTransition.cancel?.();
    };
  }, [currentStationIndex, debouncedTransition]);

  useEffect(() => {
    return () => {
      wakeLockManager.release();
    };
  }, []);

  useEffect(() => {
    if (!isGpsActive) {
      wakeLockManager.release();
    }
  }, [isGpsActive]);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        setGlitchText(Math.random().toString(36).substring(2, 4));
        setGlitchClass('glitch-active');
        setTimeout(() => setGlitchClass(''), 100);
      } else {
        setGlitchText('');
        setGlitchClass('');
      }
    }, 200);

    return () => clearInterval(glitchInterval);
  }, []);

  const handleMuteToggle = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    stationPlayer.setMuted(newMutedState);
  }, [isMuted]);

  // Only show system alert if GPS is not active AND we have no previous station data
  if (!isGpsActive && !stationData) {
    return (
      <div className="current-station">
        <SystemAlert />
      </div>
    );
  }

  // Only show loading state on initial load
  if (!stationData) {
    return (
      <div className="station-info">
        <div className="scanline"></div>
        <div className="noise"></div>
        <div className="crt-effect"></div>
        <div className="current-station">
          <div className="proximity-info">
            <div className="closest-station-label">
              <img src={stationDisplayImage} alt="Station Display" className="station-display-image" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`station-info ${isGpsActive ? 'gps-active' : ''} ${glitchClass}`}>
      <GPSIndicator 
        isActive={gpsUpdateReceived} 
        speed={stationData?.speed}
        distance={stationData?.distance}
      />
      <div className="scanline"></div>
      <div className="noise"></div>
      <div className="crt-effect"></div>
      <img src={stationDisplayImage} alt="Station Display" className="station-display-image" />
      <button 
        onClick={handleMuteToggle}
        className={`mute-button ${isMuted ? 'muted' : ''}`}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      <div className="welcome-message">
        <div className="message-text">JR East wishes you a good trip ✈️</div>
        <div className="message-text-jp">JR東日本は、良い旅をお祈りします。</div>
      </div>
      <div className="current-station">
        <div className="proximity-info">
          <div className="station-name-display">
            <span className="glitch" data-text={`${stationData.japaneseName} (${stationData.name})`}>
              {stationData.japaneseName} ({stationData.name})
            </span>
          </div>
          
          <div className="distance">
            <span className="glitch" data-text={
              stationData.distance >= 1000 
                ? `${(stationData.distance / 1000).toFixed(1)}km` 
                : `${Math.round(stationData.distance)}m`
            }>
              {stationData.distance >= 1000 
                ? `${(stationData.distance / 1000).toFixed(1)}km` 
                : `${Math.round(stationData.distance)}m`}
            </span>
          </div>

          <div className="direction">
            <span className="glitch" data-text={`${stationData.direction}へ進んでください`}>
              {stationData.direction}へ進んでください
            </span>
          </div>
          
          {stationData.speed !== null && (
            <div className="speed">
              <span className="glitch" data-text={`現在速度: ${stationData.speed} km/h`}>
                現在速度: {stationData.speed} km/h
              </span>
            </div>
          )}

          <div className={`status ${stationData.distance > 100 ? 'out-of-range' : 'in-range'}`}>
            <span className="glitch" data-text={stationData.distance > 100 ? '駅の範囲外です' : '駅の範囲内です'}>
              {stationData.distance > 100 ? '駅の範囲外です' : '駅の範囲内です'}
            </span>
          </div>
        </div>
        
        <div className="yamanote-map-container">
          <YamanoteLine 
            width={280} 
            height={280} 
            userPosition={stationData ? { lat: stationData.userLat, lng: stationData.userLng } : undefined}
            closestStation={stationData?.name}
          />
        </div>
      </div>
    </div>
  );
}