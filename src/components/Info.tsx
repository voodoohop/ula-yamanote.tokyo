import React from 'react';
import { Link } from 'react-router-dom';
import { Train } from './Train';
import '../styles/Info.css';

export function Info() {
  return (
    <div className="info-page">
      <Link to="/" className="back-link">← 戻る Back</Link>
      <div className="info-content">
        <h1>山手線の情報</h1>
        
        <div className="train-section">
          <h2>車内からの風景</h2>
          <div className="train-wrapper">
            <Train />
          </div>
          <p className="video-description">
            山手線の車内からの風景をリアルタイムでご覧いただけます。
          </p>
        </div>

        <div className="video-grid">
          <div className="video-item">
            <h2>山手線 - 車窓からの風景</h2>
            <div className="video-container">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/anPV_7yrekE?autoplay=0&mute=1&controls=1&loop=1&playlist=anPV_7yrekE`}
                title="Yamanote Line Window View"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <p className="video-description">
              山手線の車窓から見える東京の風景をお楽しみください。
            </p>
          </div>

          <div className="video-item">
            <h2>ウラ山手線 - AI生成映像</h2>
            <div className="video-container">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/mFqBSWvapDU"
                title="ULA Yamanote AI Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <p className="video-description">
              AIが生成した不思議な山手線の世界をご覧ください。
            </p>
          </div>
        </div>

        <div className="info-text">
          <h2>山手線について</h2>
          <p>山手線は、東京都区部を環状に走る鉄道路線です。</p>
          <p>一周約34.5km、所要時間約1時間で、30の駅を結んでいます。</p>
          <p>毎日約400万人が利用する、東京の大動脈とも言える路線です。</p>
        </div>
      </div>
    </div>
  );
}
