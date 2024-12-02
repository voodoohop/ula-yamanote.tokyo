import React, { useEffect, useState } from 'react';

interface YouTubeBackgroundProps {
  videoId: string;
}

const YouTubeBackground: React.FC<YouTubeBackgroundProps> = ({ videoId }) => {
  // Video is 19 minutes = 1140 seconds
  const [startTime] = useState(() => Math.floor(Math.random() * 1140));

  return (
    <div className="video-wrapper">
      <iframe
        className="background-video"
        title="YouTube background"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&iv_load_policy=3&playsinline=1&rel=0&showinfo=0&enablejsapi=1&volume=0&start=${startTime}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        muted
      />
      <div className="scanlines"></div>
      <style>{`
        .video-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #000;
          z-index: -1;
        }

        .background-video {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 150vw;
          height: 150vh;
          transform: translate(-50%, -50%);
          pointer-events: none;
          opacity: 0.6;
          mix-blend-mode: screen;
          filter: hue-rotate(45deg) saturate(1.5) brightness(0.7);
          animation: psychedelic 10s infinite linear;
        }

        .scanlines {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.05) 0px,
            rgba(255, 255, 255, 0.05) 1px,
            transparent 1px,
            transparent 2px
          );
          pointer-events: none;
          z-index: 2;
          animation: scan 0.05s infinite;
        }

        @keyframes psychedelic {
          0% {
            filter: hue-rotate(0deg) saturate(150%) brightness(0.7);
          }
          50% {
            filter: hue-rotate(180deg) saturate(200%) brightness(0.8);
          }
          100% {
            filter: hue-rotate(360deg) saturate(150%) brightness(0.7);
          }
        }

        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(2px);
          }
        }
      `}</style>
    </div>
  );
};

export default YouTubeBackground;
