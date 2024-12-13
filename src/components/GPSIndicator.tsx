import React, { useEffect, useRef, useState } from 'react';

interface Props {
  isActive: boolean;
  speed?: number | null;
  distance?: number | null;
}

export function GPSIndicator({ isActive, speed, distance }: Props) {
  const [isFlashing, setIsFlashing] = useState(false);
  const lastUpdateTime = useRef<Date | null>(null);
  const [updateFrequency, setUpdateFrequency] = useState<string>('');
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      // Flash effect
      setIsFlashing(true);
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = setTimeout(() => {
        setIsFlashing(false);
      }, 100);

      // Calculate and display update frequency
      const now = new Date();
      if (lastUpdateTime.current) {
        const timeDiff = now.getTime() - lastUpdateTime.current.getTime();
        setUpdateFrequency(`${(timeDiff / 1000).toFixed(1)}s`);
      }
      lastUpdateTime.current = now;
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className={`gps-indicator ${isFlashing ? 'flash' : ''}`}>
      <div className="gps-info">
        {speed !== null && (
          <div className="speed">
            {speed.toFixed(1)} km/h
          </div>
        )}
        {distance !== null && (
          <div className="distance">
            {distance < 1000 
              ? `${distance.toFixed(0)}m`
              : `${(distance/1000).toFixed(1)}km`}
          </div>
        )}
        <div className="update-frequency">
          {updateFrequency}
        </div>
      </div>
      <style>
      {`
        .gps-indicator {
          background-color: rgba(0, 0, 0, 0.7);
          padding: 10px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          min-width: 120px;
        }
        .gps-indicator.flash {
          background-color: rgba(255, 255, 255, 0.1);
          transition: background-color 0.1s ease;
        }
        .gps-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .speed, .distance, .update-frequency {
          font-family: monospace;
          opacity: 0.8;
          padding-left: 4px;
        }
      `}
      </style>
    </div>
  );
}
