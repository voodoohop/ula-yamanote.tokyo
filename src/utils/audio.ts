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