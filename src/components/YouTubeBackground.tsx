import React, { useState, useEffect } from 'react';

interface YouTubeBackgroundProps {
  videoId: string;
}

const YouTubeBackground: React.FC<YouTubeBackgroundProps> = ({ videoId }) => {
  const [startTime] = useState(() => Math.floor(Math.random() * 1140));
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) {
      setIsPlaying(true);
    }

    // Listen for any user interaction
    const handleInteraction = () => {
      setHasInteracted(true);
      setIsPlaying(true);
      // Remove listeners after first interaction
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };

    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('click', handleInteraction);

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, []);

  return (
    <>
      {!isPlaying && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f0',
            textAlign: 'center',
            padding: '10px',
            fontSize: '14px',
            fontFamily: "'DotGothic16', monospace"
          }}
        >
          {hasInteracted ? 'Loading...' : 'タップして開始 / Tap to start'}
        </div>
      )}
      <iframe
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          objectFit: 'cover',
          opacity: isPlaying ? 1 : 0
        }}
        title="YouTube background"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&iv_load_policy=3&playsinline=1&rel=0&showinfo=0&enablejsapi=1&volume=0&start=${startTime}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        muted
      />
    </>
  );
};

export default YouTubeBackground;
