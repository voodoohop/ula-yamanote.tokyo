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
          targetRate = 0.7;  // Higher minimum rate
        } else if (speed >= 8) {
          targetRate = 1.0;  // Maximum rate at higher speed
        } else {
          targetRate = 0.7 + (speed / 8) * 0.3;  // More gentle slope
        }
      }

      const smoothing = 0.8;  // Faster response (20% of new value each update)
      const newRate = smoothing * smoothedRate + (1 - smoothing) * targetRate;
      
      if (Math.abs(newRate - smoothedRate) > 0.001) {  // Less sensitive threshold
        setSmoothedRate(newRate);
        stationPlayer.setPlaybackRate(newRate);
      }
    };

    const interval = setInterval(updateRate, 200);  // Update less frequently
    return () => clearInterval(interval);
  }, [speed, smoothedRate]);

  return smoothedRate;
}
