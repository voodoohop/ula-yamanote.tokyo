import React, { useEffect, useState } from 'react';
import { SystemAlert } from './SystemAlert';
import { stationPlayer, initializeAudio } from '../utils/audio';
import { wakeLockManager } from '../utils/wakeLock';
import { useGPSTracking } from '../hooks/useGPSTracking';
import { useSpeedRate } from '../hooks/useSpeedRate';
import stationDisplayImage from '../assets/glitchstationdisplaysmaller.webp';
import '../styles/StationInfo.css';

interface Props {
  isGpsActive: boolean;
}

interface StationData {
  name: string;
  japaneseName: string;
  distance: number;
  direction: string;
  speed: number | null;
}

export function StationInfo({ isGpsActive }: Props) {
  const [glitchText, setGlitchText] = useState('');
  const [glitchClass, setGlitchClass] = useState('');
  const [currentPlayingStation, setCurrentPlayingStation] = useState<string | null>(null);
  
  const stationData = useGPSTracking(isGpsActive);
  useSpeedRate(stationData?.speed ?? null);

  useEffect(() => {
    initializeAudio();
  }, []);

  useEffect(() => {
    if (stationData && stationData.name !== currentPlayingStation) {
      const playStationTrack = async () => {
        try {
          console.log(`Transitioning from ${currentPlayingStation} to ${stationData.name}`);
          await stationPlayer.loadTrack(stationData.name);
          await stationPlayer.play();
          await wakeLockManager.acquire(); // Acquire wake lock when playing
          setCurrentPlayingStation(stationData.name);
          console.log(`Successfully transitioned to ${stationData.name}`);
        } catch (error) {
          console.error('Error during station transition:', error);
        }
      };
      playStationTrack();
    }
  }, [stationData?.name, currentPlayingStation]);

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
      <div className="scanline"></div>
      <div className="noise"></div>
      <div className="crt-effect"></div>
      
      <div className="current-station">
        <div className="proximity-info">
          <div className="closest-station-label">
            <img src={stationDisplayImage} alt="Station Display" className="station-display-image" />
          </div>
          
          <div className="station-name-display">
            <span className="glitch" data-text={`${stationData.japaneseName} (${stationData.name})`}>
              {stationData.japaneseName} ({stationData.name})
            </span>
          </div>
          
          <div className="distance">
            <span className="glitch" data-text={`${stationData.distance}m`}>{stationData.distance}m</span>
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
      </div>
    </div>
  );
}