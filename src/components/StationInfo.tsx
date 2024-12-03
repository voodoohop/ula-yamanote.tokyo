import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { calculateDistance, getDirection } from '../utils/location';
import { calculateBearing, checkCompassSupport } from '../utils/compass';
import { getBeepInterval, playBeep } from '../utils/audio';
import { stationCoordinates, japaneseStations } from '../data/stations';
import '../styles/StationInfo.css';

interface Position {
  coords: {
    latitude: number;
    longitude: number;
  };
}

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

    // Set the bearing as a CSS custom property
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

    // Update beep interval
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
        <div className="system-alert">
          <div className="alert-header">システム アラート:</div>
          <div className="highlight">ウラ YAMANOTE</div>
          <div className="launch-info">
            ローンチング アット<br />
            裏 Roppongi<br />
            六本木<br />
            12月7日 / DEC 7<br />
            2024
          </div>
        </div>
      </div>
    );
  }

  if (!stationData) {
    return <div className="station-info">Loading...</div>;
  }

  return (
    <div className={`station-info ${isGpsActive ? 'gps-active' : ''}`}>
      <div className="current-station">
        <div className="proximity-info">
          <div className="closest-station-label">最寄り駅 / NEAREST STATION</div>
          <div className="station-name-display">
            {stationData.japaneseName} ({stationData.name})
          </div>
          <div>{stationData.distance}m</div>
          {stationData.hasCompass ? (
            <>
              <div className="compass">
                <div className="compass-arrow" />
              </div>
              <div>{stationData.direction}</div>
              <div className="find-party-alert">コンパスに従ってパーティーを見つけよう</div>
            </>
          ) : (
            <>
              <div>コンパスが利用できません</div>
              <div>{stationData.direction}へ進んでください</div>
              <div className="find-party-alert">コンパスに従ってパーティーを見つけよう</div>
            </>
          )}
          <div className={`status ${stationData.distance > 100 ? 'out-of-range' : 'in-range'}`}>
            {stationData.distance > 100 
              ? '駅の範囲外です' 
              : '駅の範囲内です'}
          </div>
        </div>
      </div>
    </div>
  );
}