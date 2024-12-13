import { useState, useEffect, useRef } from 'react';
import { stationPlayer } from '../utils/audio';

const MIN_RATE = 0.9;  // Higher minimum rate
const MAX_RATE = 1.0;
const SPEED_THRESHOLD = 8;  // Speed at which we reach max rate
const UPDATE_INTERVAL = 500;  // Less frequent updates
const SMOOTHING = 0.98;  // Even slower response (2% change per update)
const RATE_CHANGE_THRESHOLD = 0.0005;  // Less sensitive to tiny changes

export function useSpeedRate(speed: number | null) {
  const [smoothedRate, setSmoothedRate] = useState(1.0);
  const lastUpdateTime = useRef<number>(Date.now());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDisposed = useRef(false);

  useEffect(() => {
    const updateRate = () => {
      if (isDisposed.current) return;

      try {
        const now = Date.now();
        const timeDelta = now - lastUpdateTime.current;
        
        // Skip update if it's too soon
        if (timeDelta < UPDATE_INTERVAL) {
          return;
        }
        lastUpdateTime.current = now;

        let targetRate = MAX_RATE;
        
        if (speed !== null) {
          if (speed <= 1) {
            targetRate = MIN_RATE;
          } else if (speed >= SPEED_THRESHOLD) {
            targetRate = MAX_RATE;
          } else {
            // More gentle slope with easing
            const progress = speed / SPEED_THRESHOLD;
            const eased = progress * progress * (3 - 2 * progress); // Smooth easing
            targetRate = MIN_RATE + (MAX_RATE - MIN_RATE) * eased;
          }
        }

        const newRate = SMOOTHING * smoothedRate + (1 - SMOOTHING) * targetRate;
        
        // Only update if the change is significant
        if (Math.abs(newRate - smoothedRate) > RATE_CHANGE_THRESHOLD) {
          setSmoothedRate(newRate);
          stationPlayer.setPlaybackRate(newRate);
        }

      } catch (error) {
        console.error('Error updating playback rate:', error);
      }
    };

    // Initial update
    updateRate();

    // Schedule next update
    updateTimeoutRef.current = setInterval(updateRate, UPDATE_INTERVAL);

    return () => {
      isDisposed.current = true;
      if (updateTimeoutRef.current) {
        clearInterval(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      // Reset rate on cleanup if not disposed
      if (!isDisposed.current) {
        try {
          stationPlayer.setPlaybackRate(1.0);
        } catch (error) {
          console.error('Error resetting playback rate:', error);
        }
      }
    };
  }, [speed, smoothedRate]);

  return smoothedRate;
}
