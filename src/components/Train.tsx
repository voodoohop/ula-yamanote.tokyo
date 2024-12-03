import React from 'react';
import { useEffect } from 'react';
import '../styles/Train.css';
import YouTubeBackground from './YouTubeBackground';

export function Train() {
  useEffect(() => {
    const updateUserLocation = () => {
      const currentCarriage = document.querySelector('.carriage:last-child');
      const userLocation = document.getElementById('userLocation');
      if (currentCarriage && userLocation) {
        const carriageWidth = currentCarriage.offsetWidth;
        const position = (Math.sin(Date.now() / 1000) + 1) / 2;
        userLocation.style.left = `${position * (carriageWidth - 20)}px`;
      }
    };

    const interval = setInterval(updateUserLocation, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="train-container">
      <div className="train">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="carriage">
            <div className="window">
              <YouTubeBackground videoId="5gfY-EMa1Oc" />
            </div>
            {i < 2 && <div className="connector" />}
          </div>
        ))}
      </div>
    </div>
  );
}