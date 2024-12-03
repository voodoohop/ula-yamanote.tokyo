import React from 'react';

interface CompassProps {
  direction: string;
  hasCompass: boolean;
  heading: number;
}

export function Compass({ direction, hasCompass, heading }: CompassProps) {
  if (!hasCompass) {
    return (
      <>
        <div className="direction">
          <span className="glitch" data-text="コンパスが利用できません">コンパスが利用できません</span>
        </div>
        <div className="direction">
          <span className="glitch" data-text={`${direction}へ進んでください`}>
            {direction}へ進んでください
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="compass">
        <div
          className="compass-arrow"
          style={{ transform: `translateX(-50%) rotate(${heading}deg)` }}
        />
      </div>
      <div className="direction">
        <span className="glitch" data-text={direction}>{direction}</span>
      </div>
      <div className="maintenance-alert" style={{ textAlign: 'center', width: '100%' }}>
        <span className="glitch" data-text="JR東日本からのお知らせ：コンパスセンサーのメンテナンス中です。ご不便をおかけして申し訳ございません。">
          JR東日本からのお知らせ：コンパスセンサーのメンテナンス中です。ご不便をおかけして申し訳ございません。
        </span>
      </div>
      <div className="find-party-alert">
        <span className="glitch" data-text="コンパスに従ってパーティーを見つけよう">
          コンパスに従ってパーティーを見つけよう
        </span>
      </div>
    </>
  );
}
