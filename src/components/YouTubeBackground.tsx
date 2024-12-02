import React, { useEffect, useState } from 'react';

interface YouTubeBackgroundProps {
  videoId: string;
}

const YouTubeBackground: React.FC<YouTubeBackgroundProps> = ({ videoId }) => {
  // Video is 19 minutes = 1140 seconds
  const [startTime] = useState(() => Math.floor(Math.random() * 1140));

  return (
    <div className="youtube-background">
      <div className="youtube-container">
        <iframe
          title="YouTube background"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&iv_load_policy=3&playsinline=1&rel=0&showinfo=0&enablejsapi=1&volume=0&start=${startTime}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          muted
        />
      </div>
      <style>{`
        .youtube-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          z-index: -1;
          pointer-events: none;
          overflow: hidden;
          background: black;
        }
        .youtube-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100vw;
          height: 100vh;
          padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
        }
        .youtube-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform: scale(1.5);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default YouTubeBackground;
