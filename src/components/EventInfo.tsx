import React, { useState, useEffect } from 'react';
import '../styles/EventInfo.css';

const eventContent = {
  en: {
    title: 'ウラ YAMANOTE',
    description: `A hidden frequency resonates through Tokyo's central loop. As you traverse the steel arteries of the city, phantom soundscapes emerge from the electromagnetic field. Each station holds a key to unlock the parallel audio dimension of the Yamanote Line. Your physical presence activates the invisible sound gates.`,
    contact: 'contact@ula-yamanote.tokyo'
  },
  jp: {
    title: 'ウラ YAMANOTE',
    description: `東京の中心ループに隠された周波数が共鳴する。都市の鋼鉄の動脈を進むと、電磁場からゴーストサウンドスケープが浮かび上がる。各駅には山手線のパラレルオーディオディメンションを解き放つ鍵が隠されている。あなたの存在が不可視の音響ゲートを起動させる。`,
    contact: 'contact@ula-yamanote.tokyo'
  }
};

export function EventInfo() {
  const [language, setLanguage] = useState<'en' | 'jp'>('jp');
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

  const content = eventContent[language];

  return (
    <div className={`event-info ${glitchClass}`}>
      <div className="scanline"></div>
      <div className="content">
        <h1 className="glitch" data-text={content.title}>{content.title}</h1>
        <p>{content.description}</p>
        <p className="contact">{content.contact}</p>
        <button
          onClick={() => setLanguage(language === 'en' ? 'jp' : 'en')}
          className="language-toggle"
        >
          {language === 'en' ? '日本語' : 'English'}
        </button>
      </div>
      <div className="video-container">
        <iframe
          width="100%"
          height="315"
          src="https://www.youtube.com/embed/mFqBSWvapDU"
          title="AI Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
