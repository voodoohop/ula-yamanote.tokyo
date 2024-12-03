import React, { useState, useEffect } from 'react';
import '../styles/EventInfo.css';

const eventContent = {
  en: {
    title: 'NUSIC presents "MSTRYPOT"',
    date: '2024/12/7(sat) 23:00~6:00',
    artists: [
      'Thomash -LIVE&DJ-',
      'Saeko Killy -LIVE&DJ-'
    ],
    sound: 'Sound: HIRANYA ACCESS',
    visual: [
      'Lighting, VJ & Structure:',
      'RGB',
      'mobilespot'
    ],
    location: 'in Nishiazabu, Tokyo ( 35.6624375, 139.7264375)',
    description: `Thomash and Saeko Killy, just the two of them performing live and DJ sets! Thomash will play a 3-hour live set that reimagines Tokyo's Yamanote Line through a psychedelic lens. Ten years ago, Thomash's Voodoohop sound was born in resonance with the landscapes of Brazil. Now, he creates in harmony with the city of Tokyo! And Saeko Killy, who is releasing her new album this week (12/5) via "Bureau B," will deliver her exclusive live set during this Japan tour! The sound engineering will be by HIRANYA ACCESS, we'll bring in equipment like Taguchi subwoofers, which are also used at Bonna Pot, along with mixing console and amplifiers.`,
    door: 'Door: 3,500Yen',
    contact: 'mstrypot.knock.knock@gmail.com'
  },
  jp: {
    title: 'NUSIC presents "MSTRYPOT"',
    date: '2024年12月7日(土) 23:00~6:00',
    artists: [
      'Thomash -LIVE&DJ-',
      'Saeko Killy -LIVE&DJ-'
    ],
    sound: 'Sound: HIRANYA ACCESS',
    visual: [
      'Lighting, VJ & Structure:',
      'RGB',
      'mobilespot'
    ],
    location: '西麻布、東京 ( 35.6624375, 139.7264375)',
    description: `ThomashとSaeko Killy、二人のライブ/DJセットのみでオールナイトロングやります！今回のThomashのライブは東京の山手線をサイケデリックな視点で再解釈した3時間のセットです。10年前にブラジルの土地と共鳴して生まれたThomashのVoodoohopサウンドは、今回東京の街とどんな音を生み出すのか必聴です！また今週12/5に"Bureau B"からニューアルバムをリリースするSaeko Killyは今回の来日で唯一のライブセットをプレイします！音響はHIRANYA ACCESS、Bonna Potでも使用しているTaguchiのサブウーファーをはじめ、PA卓やアンプ等の音響機材持ち込みます！`,
    door: '料金: 3,500円',
    contact: 'mstrypot.knock.knock@gmail.com'
  }
};

export function EventInfo() {
  const [language, setLanguage] = useState<'en' | 'jp'>('jp');
  const [glitchText, setGlitchText] = useState('');
  const content = eventContent[language];

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.9) {
        setGlitchText(Math.random().toString(36).substring(2, 4));
      } else {
        setGlitchText('');
      }
    }, 100);

    return () => clearInterval(glitchInterval);
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'jp' : 'en');
  };

  return (
    <div className="event-info">
      <button onClick={toggleLanguage} className="language-toggle">
        {language.toUpperCase()}{glitchText}
      </button>
      <div className="event-content">
        <h2>{content.title}</h2>
        <div className="date">{content.date}</div>
        
        <div className="artists">
          {content.artists.map((artist, i) => (
            <div key={i} className="artist">
              {i === 0 ? (
                <a 
                  href="https://soundcloud.com/thomash_voodoohop" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {artist}
                </a>
              ) : (
                <a 
                  href="https://www.bureau-b.com/saeko_killy.php" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {artist}
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="sound">{content.sound}</div>

        <div className="visual">
          {content.visual.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>

        <div className="location">{content.location}</div>

        <div className="description">{content.description}</div>

        <div className="footer">
          <div className="door">{content.door}</div>
          <div className="contact">{content.contact}</div>
          <a 
            href="https://www.instagram.com/bonnapot_nusic/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="instagram-link"
          >
            @bonnapot_nusic
          </a>
        </div>

        <div className="video-container">
          <iframe
            width="100%"
            height="315"
            src="https://www.youtube.com/embed/AEsRs1DUSOs"
            title="Saeko Killy Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        <div className="video-container">
          <iframe
            width="100%"
            height="315"
            src="https://www.youtube.com/embed/mFqBSWvapDU"
            title="Thomash Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}
