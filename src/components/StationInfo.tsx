import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { calculateDistance, getDirection } from '../utils/location';
import { stationCoordinates, japaneseStations } from '../data/stations';
import { SystemAlert } from './SystemAlert';
import { stationPlayer, initializeAudio } from '../utils/audio';
import { wakeLockManager } from '../utils/wakeLock';
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
  const [stationData, setStationData] = useState<StationData | null>(null);
  const [glitchText, setGlitchText] = useState('');
  const [glitchClass, setGlitchClass] = useState('');
  const [currentPlayingStation, setCurrentPlayingStation] = useState<string | null>(null);

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

  const updateInfo = useCallback((position: GeolocationPosition) => {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    
    let closestStation = null;
    let minDistance = Infinity;
    
    stationCoordinates.forEach((station, index) => {
      const distance = calculateDistance(userLat, userLng, station.lat, station.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStation = index;
      }
    });

    if (closestStation === null) return;

    const direction = getDirection(
      { lat: userLat, lng: userLng },
      { lat: stationCoordinates[closestStation].lat, lng: stationCoordinates[closestStation].lng }
    );

    setStationData({
      name: stationCoordinates[closestStation].name,
      japaneseName: japaneseStations[closestStation][0],
      distance: Math.round(minDistance),
      direction,
      speed: position.coords.speed !== null ? Math.round(position.coords.speed * 3.6) : null, // Convert m/s to km/h
    });
  }, []);

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
    if (!isGpsActive) {
      setStationData(null);
      return;
    }

    // First get the initial position
    navigator.geolocation.getCurrentPosition(updateInfo, (error) => {
      console.error('GPS Error:', error);
      setStationData(null);
    });

    // Then watch for position updates
    const watchId = navigator.geolocation.watchPosition(updateInfo, (error) => {
      console.error('GPS Watch Error:', error);
      setStationData(null);
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isGpsActive, updateInfo]);

  if (!isGpsActive) {
    return (
      <div className="current-station">
        <SystemAlert />
      </div>
    );
  }

  if (!stationData) {
    return <div className="station-info">Loading...</div>;
  }

  return (
    <div className={`station-info ${isGpsActive ? 'gps-active' : ''} ${glitchClass}`}>
      <div className="scanline"></div>
      <div className="noise"></div>
      <div className="crt-effect"></div>
      
      <div className="current-station">
        <div className="proximity-info">
          <div className="closest-station-label">
            <img src="/src/assets/glitchstationdisplaysmaller.webp" alt="Station Display" className="station-display-image" />
            <span className="glitch-text">{glitchText}</span>
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