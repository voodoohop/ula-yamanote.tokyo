import React from 'react';
import '../styles/PlayButton.css';

interface PlayButtonProps {
  onClick: () => void;
  isLoading: boolean;
  isPlaying: boolean;
}

export const PlayButton: React.FC<PlayButtonProps> = ({ onClick, isLoading, isPlaying }) => (
  <button 
    onClick={onClick}
    className={`play-button ${isLoading ? 'loading' : ''} ${isPlaying ? 'playing' : ''}`}
    disabled={isLoading}
  >
    {isLoading ? '読み込み中...' : isPlaying ? '停止 STOP' : '発車 START'}
  </button>
);
