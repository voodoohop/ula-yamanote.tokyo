import { useState, useEffect } from 'react';
import { stationPlayer } from '../utils/audio';

export function useSpeedRate(speed: number | null) {
  const [smoothedRate, setSmoothedRate] = useState(1.0);

  useEffect(() => {
    const updateRate = () => {
      let targetRate = 1.0;
      
      if (speed !== null) {
        if (speed <= 0) {
          targetRate = 0.5;  // Minimum rate
        } else if (speed >= 5) {
          targetRate = 1.0;  // Maximum rate
        } else {
          targetRate = 0.5 + (speed / 5) * 0.5;  // Linear interpolation
        }
      }

      const smoothing = 0.99;  // Less aggressive smoothing (1% of new value each update)
      const newRate = smoothing * smoothedRate + (1 - smoothing) * targetRate;
      
      if (Math.abs(newRate - smoothedRate) > 0.0001) {
        setSmoothedRate(newRate);
        stationPlayer.setPlaybackRate(newRate);
      }
    };

    const interval = setInterval(updateRate, 50);  // Update every 50ms
    return () => clearInterval(interval);
  }, [speed, smoothedRate]);

  return smoothedRate;
}
