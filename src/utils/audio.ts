import * as Tone from 'tone';

const synth = new Tone.Synth().toDestination();
synth.volume.value = -20;

export function initializeAudio() {
  document.addEventListener('click', () => {
    if (Tone.context.state !== 'running') {
      Tone.context.resume().then(() => {
        console.log('Audio context resumed');
      });
    }
  });
}

export function getBeepInterval(distance: number): number {
  const baseInterval = 2000;
  const maxInterval = 5000;
  const minInterval = 200;
  
  if (distance > 1000) { // distance is in meters
    return maxInterval;
  } else {
    return Math.max(minInterval, Math.min(maxInterval, baseInterval * (distance / 1000)));
  }
}

export function playBeep() {
  synth.triggerAttackRelease("C4", "32n");
}