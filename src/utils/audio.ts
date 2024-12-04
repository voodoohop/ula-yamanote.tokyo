import * as Tone from 'tone';

const synth = new Tone.Synth({
  oscillator: {
    type: 'sine'
  },
  envelope: {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.1,
    release: 0.1
  }
}).toDestination();
synth.volume.value = -30;

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
  const baseInterval = 1000;  
  const maxInterval = 2000;   
  const minInterval = 100;    
    
  if (distance > 500) { 
    return Infinity;    
  } else {
    return Math.max(minInterval, Math.min(maxInterval, baseInterval * (distance / 500))); 
  }
}

export function playBeep() {
  synth.triggerAttackRelease("G5", "64n");
}