import React, { useState, useEffect } from 'react';
import '../styles/SystemAlert.css';
import uraYamanoteQr from '../assets/ura-yamanote-animated-qr-square.webp';

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
      <div className="artwork-container">
        <img 
          src={uraYamanoteQr} 
          alt="Ura Yamanote QR Animation" 
          className="traffic-animation"
        />
      </div>
      <div className="launch-info">
        <div className="glitch" data-text="サイバーゾーン">サイバーゾーン</div>
        <div className="glitch" data-text="アクティベート">アクティベート</div>
        <div className="location glitch" data-text="山手線">山手線</div>
        <div className="location-jp glitch" data-text="LOOP 01">LOOP 01</div>
      </div>
      <div className="experience-info">
        <div className="info-text">
          <p className="glitch" data-text="まもなく、山手線オーディオシステムが起動いたします。位置情報に応じて変化する音響空間をお楽しみください。">
            まもなく、山手線オーディオシステムが起動いたします。位置情報に応じて変化する音響空間をお楽しみください。
          </p>
          <p className="glitch" data-text="The Yamanote Line audio system will commence shortly. Please enjoy the evolving soundscape as you travel.">
            The Yamanote Line audio system will commence shortly. Please enjoy the evolving soundscape as you travel.
          </p>
        </div>
        <div className="privacy-notice">
          <p className="glitch" data-text="位置情報は匿名で使用され、体験のためだけに使用されます。">
            位置情報は匿名で使用され、体験のためだけに使用されます。
          </p>
          <p className="glitch" data-text="Location data is used anonymously and solely for this experience.">
            Location data is used anonymously and solely for this experience.
          </p>
        </div>
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
