import React from 'react';
import { useEffect, useState } from 'react';
import '../styles/Train.css';
import YouTubeBackground from './YouTubeBackground';

export function Train() {
  const [numCars, setNumCars] = useState(3);

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

    const handleResize = () => {
      setNumCars(window.innerWidth < 768 ? 1 : 2);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    const interval = setInterval(updateUserLocation, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="train-container">
      <div className="train">
        {[...Array(numCars)].map((_, i) => (
          <div key={i} className="carriage">
            <YouTubeBackground videoId="5gfY-EMa1Oc" />
          </div>
        ))}
      </div>
    </div>
  );
}