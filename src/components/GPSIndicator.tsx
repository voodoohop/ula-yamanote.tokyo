import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

interface Props {
  isActive: boolean;
  speed?: number | null;
  distance?: number | null;
}

export function GPSIndicator({ isActive, speed, distance }: Props) {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const synth = useRef<Tone.Synth | null>(null);
  const lastUpdateTime = useRef<Date | null>(null);
  const [updateFrequency, setUpdateFrequency] = useState<string>('');
  const lastSpeed = useRef<number | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      await Tone.start();
      
      // Create a synth with a soft, pleasant timbre
      synth.current = new Tone.Synth({
        oscillator: { 
          type: 'sine4', // Softer, rounder sound
        },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.1,
          release: 0.3
        },
        volume: -15
      }).toDestination();

      setIsAudioInitialized(true);
    };

    initAudio().catch(console.error);
    return () => {
      if (synth.current) {
        synth.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      // Clear any existing timeout
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      setIsFlashing(true);
      flashTimeoutRef.current = setTimeout(() => {
        setIsFlashing(false);
        flashTimeoutRef.current = null;
      }, 500); // Increased to 500ms for more visibility

      // Calculate update frequency
      const now = new Date();
      if (lastUpdateTime.current) {
        const timeDiff = now.getTime() - lastUpdateTime.current.getTime();
        setUpdateFrequency(`${(timeDiff / 1000).toFixed(1)}s`);
      }
      lastUpdateTime.current = now;

      // Play a cute ascending arpeggio in C major
      if (isAudioInitialized && synth.current) {
        const now = Tone.now();
        synth.current.triggerAttackRelease('C5', '0.1', now);
        synth.current.triggerAttackRelease('E5', '0.1', now + 0.1);
      }
    }

    // Cleanup timeout on unmount or when isActive changes
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [isActive, isAudioInitialized]);

  // Play a different sound when speed changes
  useEffect(() => {
    if (speed !== lastSpeed.current && isAudioInitialized && synth.current) {
      lastSpeed.current = speed;
      
      // Only play if we have a valid speed
      if (speed !== null && speed !== undefined) {
        const now = Tone.now();
        // Play a descending third in C major
        synth.current.triggerAttackRelease('G4', '0.1', now);
        synth.current.triggerAttackRelease('E4', '0.1', now + 0.1);
      }
    }
  }, [speed, isAudioInitialized]);

  return (
    <div className="gps-indicator">
      <div className={`led ${isActive ? 'active' : ''} ${isFlashing ? 'flash' : ''}`} />
      <div className="legend">
        <div className="legend-item">
          <div className="led-example off" />
          <span>GPS Off</span>
        </div>
        <div className="legend-item">
          <div className="led-example on" />
          <span>GPS Active</span>
        </div>
        {speed !== undefined && speed !== null && (
          <div className="stats-item">
            <span>🚶 {speed} km/h</span>
          </div>
        )}
        {updateFrequency && (
          <div className="stats-item">
            <span>📍 {updateFrequency}</span>
          </div>
        )}
      </div>
      <style>{`
        .gps-indicator {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.8);
          padding: 12px;
          border-radius: 8px;
          color: white;
          font-size: 12px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          min-width: 120px;
        }
        .led {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: #333;
          box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
          margin-bottom: 10px;
          position: relative;
        }
        .led.active {
          background-color: #00ff00;
          box-shadow: 0 0 8px #00ff00;
        }
        .led.flash {
          background-color: #ffffff;
          box-shadow: 0 0 20px #ffffff;
          transform: scale(1.2);
        }
        .legend {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.9;
        }
        .led-example {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .led-example.off {
          background-color: #333;
        }
        .led-example.on {
          background-color: #00ff00;
          box-shadow: 0 0 5px #00ff00;
        }
        .stats-item {
          font-family: monospace;
          opacity: 0.8;
          padding-left: 4px;
        }
      `}</style>
    </div>
  );
}
