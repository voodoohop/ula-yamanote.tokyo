import React from 'react';
import '../styles/Effects.css';

export function Track() {
  return <div className="track" />;
}

export function Effects() {
  return (
    <div className="effects-container">
      <div className="grid" />
      <div className="effects" />
      <Track />
    </div>
  );
}