import React, { useState, useEffect } from 'react';
import '../styles/EventInfo.css';

const eventContent = {
  en: {
    title: 'ウラ YAMANOTE',
    description: `A parallel dimension resonates beneath Tokyo's central loop. The electromagnetic field pulses with phantom frequencies, creating an invisible audio landscape that mirrors the physical world. As you traverse the steel arteries of the city, each station becomes a gateway to this hidden realm. Your presence activates these sonic portals, revealing the unseen rhythms of the Yamanote Line.`,
    contact: 'contact@ula-yamanote.tokyo'
  },
  jp: {
    title: 'ウラ YAMANOTE',
    description: `東京の中心ループの下に、もう一つの次元が共鳴している。電磁場は幽霊周波数で脈動し、物理世界を映し出す不可視のオーディオ風景を生み出す。都市の鋼鉄の動脈を進むと、各駅がこの隠された領域への入り口となる。あなたの存在がこれらの音響ポータルを活性化させ、山手線の見えないリズムを明らかにする。`,
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
    </div>
  );
}
