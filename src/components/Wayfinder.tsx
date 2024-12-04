import React, { useEffect, useState } from 'react';
import { checkWayfinderSupport, handleOrientation } from '../utils/wayfinder';

interface WayfinderProps {
  direction: number;
}

export function Wayfinder({ direction }: WayfinderProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [hasWayfinder, setHasWayfinder] = useState(false);

  useEffect(() => {
    const initWayfinder = async () => {
      const supported = await checkWayfinderSupport();
      setHasWayfinder(supported);
    };
    initWayfinder();
  }, []);

  useEffect(() => {
    if (!hasWayfinder) return;

    const onOrientation = (event: DeviceOrientationEvent) => {
      const newHeading = handleOrientation(event);
      if (newHeading !== null) {
        setHeading(newHeading);
      }
    };

    window.addEventListener('deviceorientation', onOrientation);
    return () => window.removeEventListener('deviceorientation', onOrientation);
  }, [hasWayfinder]);

  if (!hasWayfinder) {
    return (
      <>
        <div className="direction">
          <span className="glitch" data-text="ウェイファインダーが利用できません">
            ウェイファインダーが利用できません
          </span>
        </div>
        <div className="direction">
          <span className="glitch" data-text={`${direction}へ進んでください`}>
            {direction}へ進んでください
          </span>
        </div>
      </>
    );
  }

  // Correct the relative angle calculation to point towards the station
  let wayfinderRelativeAngle = ((heading || 0) - direction + 360) % 360;
  // Ensure we always use the smallest angle (no more than 180 degrees)
  if (wayfinderRelativeAngle > 180) {
    wayfinderRelativeAngle -= 360;
  }

  // Convert bearing to cardinal direction
  const getCardinalDirection = (angle: number) => {
    const directions = ['北 (North)', '北東 (Northeast)', '東 (East)', '南東 (Southeast)', 
                       '南 (South)', '南西 (Southwest)', '西 (West)', '北西 (Northwest)'];
    const index = Math.round(angle / 45) % 8;
    return directions[index];
  };

  return (
    <div className="wayfinder">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        style={{
          transform: heading !== null ? `rotate(${wayfinderRelativeAngle}deg)` : 'none',
          transition: 'transform 0.2s ease-out',
          transformOrigin: 'center',
        }}
      >
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
        <circle cx="60" cy="60" r="1.5" fill="rgba(255, 255, 255, 0.2)" />
        <path d="M60 25 L75 75 L60 65 L45 75 Z" fill="#4AFF4A" stroke="none" />
      </svg>

      <div className="direction">
        {getCardinalDirection(direction)}
      </div>

      <div className="alert maintenance">
        JR東日本からのお知らせ：コンパスセンサーのメンテナンス中です。ご不便をおかけして申し訳ございません。
      </div>

      <div className="alert party">
        コンパスに従ってパーティーを見つけよう
      </div>
    </div>
  );
}
