import { useState, useEffect } from 'react';
import { stationPlayer } from '../utils/audio';

export function useSpeedRate(speed: number | null) {
  const [smoothedRate, setSmoothedRate] = useState(1.0);

  useEffect(() => {
    const updateRate = () => {
      let targetRate = 1.0;
      
      if (speed !== null) {
        // More gradual transition for low speeds
        if (speed <= 1) {
          targetRate = 0.85;  // Higher minimum rate for less dramatic slowdown
        } else if (speed >= 8) {
          targetRate = 1.0;  // Maximum rate at higher speed
        } else {
          targetRate = 0.85 + (speed / 8) * 0.15;  // More gentle slope
        }
      }

      const smoothing = 0.95;  // Slower response (5% of new value each update)
      const newRate = smoothing * smoothedRate + (1 - smoothing) * targetRate;
      
      if (Math.abs(newRate - smoothedRate) > 0.001) {  // Less sensitive threshold
        setSmoothedRate(newRate);
        stationPlayer.setPlaybackRate(newRate);
      }
    };

    const interval = setInterval(updateRate, 300);  // Update less frequently
    return () => clearInterval(interval);
  }, [speed, smoothedRate]);

  return smoothedRate;
}
