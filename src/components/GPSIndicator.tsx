import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

interface Props {
  isActive: boolean;
}

export function GPSIndicator({ isActive }: Props) {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const synth = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    const initAudio = async () => {
      // Initialize Tone.js context
      await Tone.start();
      
      // Initialize synth
      synth.current = new Tone.Synth({
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0,
          release: 0.1
        },
        volume: -20 // Very quiet
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
    if (isActive && isAudioInitialized && synth.current) {
      // Play a very short beep in C4 (middle C)
      synth.current.triggerAttackRelease('C4', '0.1');
    }
  }, [isActive, isAudioInitialized]);

  return (
    <div className="gps-indicator">
      <div className={`led ${isActive ? 'active' : ''}`} />
      <style>{`
        .gps-indicator {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
        .led {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #333;
          box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
          transition: all 0.1s ease;
        }
        .led.active {
          background-color: #00ff00;
          box-shadow: 0 0 5px #00ff00;
        }
      `}</style>
    </div>
  );
}
