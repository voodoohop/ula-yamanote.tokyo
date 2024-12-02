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

export function StationInfo({ isGpsActive }: Props) {
  const [info, setInfo] = useState<string>('');
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

    const compassHTML = hasCompass ? `
      <div class="compass">
        <div class="compass-arrow"></div>
      </div>
    ` : '';

    const distanceInMeters = Math.round(minDistance);

    setInfo(`
      <div class="current-station">
        <div class="proximity-info">
          <div class="closest-station-label">最寄り駅 / NEAREST STATION</div>
          <div class="station-name-display">
            ${japaneseName}
            <div class="romaji">${closestStation.name}</div>
          </div>
          <div class="distance">${distanceInMeters}m</div>
          ${compassHTML}
          <div class="direction">Head ${direction}</div>
          <div class="status ${distanceInMeters > 100 ? 'out-of-range' : 'in-range'}">
            ${distanceInMeters > 100 ? '駅の範囲外です / Not within station range' : '駅の範囲内です / Within station range'}
          </div>
        </div>
      </div>
    `);

    // Update beep interval
    if (beepIntervalId) {
      clearInterval(beepIntervalId);
    }
    const newIntervalId = window.setInterval(playBeep, getBeepInterval(distanceInMeters));
    setBeepIntervalId(newIntervalId);
  }, [hasCompass, beepIntervalId]);

  useEffect(() => {
    if (!isGpsActive) {
      setInfo(`
        <div class="current-station">
          <div class="system-alert">
            システム アラート:<br>
            <span class="highlight">ウラ YAMANOTE</span><br>
            ローンチング アット<br>
            TRAFFIC TOKYO<br>
            六本木<br>
            12月7日 / DEC 7<br>
            2024
          </div>
        </div>
      `);
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
  }, [isGpsActive, updateInfo]);

  return (
    <div 
      className={`station-info ${isGpsActive ? 'gps-active' : ''}`}
      dangerouslySetInnerHTML={{ __html: info }}
    />
  );
}