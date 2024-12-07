import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { calculateDistance, getDirection } from '../utils/location';
import { stationCoordinates, japaneseStations } from '../data/stations';
import { SystemAlert } from './SystemAlert';
import '../styles/StationInfo.css';

interface Props {
  isGpsActive: boolean;
}

interface StationData {
  name: string;
  japaneseName: string;
  distance: number;
  direction: string;
}

export function StationInfo({ isGpsActive }: Props) {
  const [stationData, setStationData] = useState<StationData | null>(null);
  const [glitchText, setGlitchText] = useState('');
  const [glitchClass, setGlitchClass] = useState('');

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
    });
  }, []);

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
            <span className="glitch" data-text="パーティー会場 / LAUNCH PARTY">パーティー会場 / LAUNCH PARTY</span>
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