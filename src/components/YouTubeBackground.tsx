import React, { useState } from 'react';

interface YouTubeBackgroundProps {
  videoId: string;
}

const YouTubeBackground: React.FC<YouTubeBackgroundProps> = ({ videoId }) => {
  const [startTime] = useState(() => Math.floor(Math.random() * 1140));

  return (
    <div className="video-box">
      <iframe
        className="video"
        title="YouTube background"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&iv_load_policy=3&playsinline=1&rel=0&showinfo=0&enablejsapi=1&volume=0&start=${startTime}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        muted
      />
      <style>{`
        .video-box {
          width: 400px;
          height: 225px;
          border: 2px solid #0f0;
          border-radius: 4px;
          overflow: hidden;
        }
        .video {
          width: 100%;
          height: 100%;
        }
        @media (max-width: 768px) {
          .video-box {
            width: 320px;
            height: 180px;
          }
        }
      `}</style>
    </div>
  );
};

export default YouTubeBackground;
