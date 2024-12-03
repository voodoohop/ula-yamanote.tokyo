import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { calculateDistance, getDirection } from '../utils/location';
import { calculateBearing, checkCompassSupport } from '../utils/compass';
import { getBeepInterval, playBeep } from '../utils/audio';
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
  hasCompass: boolean;
}

export function StationInfo({ isGpsActive }: Props) {
  const [stationData, setStationData] = useState<StationData | null>(null);
  const [hasCompass, setHasCompass] = useState(false);
  const [beepIntervalId, setBeepIntervalId] = useState<number>();
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

  const updateInfo = useCallback((position: Position) => {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    
    let closestStation = null;
    let minDistance = Infinity;
    
    stationCoordinates.forEach(station => {
      const distance = calculateDistance(userLat, userLng, station.lat, station.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestStation = station;
      }
    });

    if (!closestStation) return;

    const bearing = calculateBearing(
      { lat: userLat, lng: userLng },
      { lat: closestStation.lat, lng: closestStation.lng }
    );

    const direction = getDirection(
      { lat: userLat, lng: userLng },
      { lat: closestStation.lat, lng: closestStation.lng }
    );

    document.body.style.setProperty('--bearing', bearing.toString());

    const stationInfo = japaneseStations.find(station => 
      station[1].toLowerCase() === closestStation!.name.toLowerCase()
    );
    const japaneseName = stationInfo ? stationInfo[0] : closestStation.name;
    const distanceInMeters = Math.round(minDistance);

    setStationData({
      name: closestStation.name,
      japaneseName,
      distance: distanceInMeters,
      direction,
      hasCompass
    });

    if (beepIntervalId) {
      clearInterval(beepIntervalId);
    }
    const newIntervalId = window.setInterval(playBeep, getBeepInterval(distanceInMeters));
    setBeepIntervalId(newIntervalId);
  }, [hasCompass, beepIntervalId]);

  useEffect(() => {
    if (!isGpsActive) {
      setStationData(null);
      return;
    }

    checkCompassSupport().then(setHasCompass);
    const watchId = navigator.geolocation.watchPosition(updateInfo);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (beepIntervalId) {
        clearInterval(beepIntervalId);
      }
    };
  }, [isGpsActive, updateInfo, beepIntervalId]);

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
            <span className="glitch" data-text="最寄り駅 / NEAREST STATION">最寄り駅 / NEAREST STATION</span>
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

          {stationData.hasCompass ? (
            <>
              <div className="compass">
                <div className="compass-arrow" />
              </div>
              <div className="direction">
                <span className="glitch" data-text={stationData.direction}>{stationData.direction}</span>
              </div>
              <div className="find-party-alert">
                <span className="glitch" data-text="コンパスに従ってパーティーを見つけよう">
                  コンパスに従ってパーティーを見つけよう
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="direction">
                <span className="glitch" data-text="コンパスが利用できません">コンパスが利用できません</span>
              </div>
              <div className="direction">
                <span className="glitch" data-text={`${stationData.direction}へ進んでください`}>
                  {stationData.direction}へ進んでください
                </span>
              </div>
              <div className="find-party-alert">
                <span className="glitch" data-text="MSTRYPOT パーティーを見つけよう">
                  MSTRYPOT パーティーを見つけよう
                </span>
              </div>
            </>
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