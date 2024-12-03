import React, { useState, useEffect } from 'react';
import '../styles/SystemAlert.css';

interface SystemAlertProps {
  showStartButton?: boolean;
  onStart?: () => void;
}

export function SystemAlert({ showStartButton, onStart }: SystemAlertProps) {
  const [glitchText, setGlitchText] = useState('');
  const [glitchClass, setGlitchClass] = useState('');

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
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

  return (
    <div className={`system-alert ${glitchClass}`}>
      <div className="scanline"></div>
      <div className="alert-header">
        <span className="glitch" data-text="システム アラート:">システム アラート:</span>
        <span className="glitch-text">{glitchText}</span>
      </div>
      <div className="highlight">
        <span className="glitch" data-text="ウラ YAMANOTE">ウラ YAMANOTE</span>
      </div>
      <div className="launch-info">
        <div className="glitch" data-text="ローンチング アット">ローンチング アット</div>
        <div className="location glitch" data-text="裏 Roppongi">裏 Roppongi</div>
        <div className="location-jp glitch" data-text="六本木">六本木</div>
        <div className="date glitch" data-text="12月7日 / DEC 7">12月7日 / DEC 7</div>
        <div className="year glitch" data-text="2024">2024</div>
      </div>
      {showStartButton && (
        <button 
          className="start-button" 
          onClick={onStart}
        >
          <span className="glitch" data-text="エンター">エンター</span>
          <span className="divider">//</span>
          <span className="glitch" data-text="ENTER">ENTER</span>
          <div className="button-glitch-effect"></div>
        </button>
      )}
      <div className="noise"></div>
      <div className="crt-effect"></div>
    </div>
  );
}
