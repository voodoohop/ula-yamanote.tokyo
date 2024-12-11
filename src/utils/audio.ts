import * as Tone from 'tone';
import { stationTrackMap } from '../data/stations';

// Audio player for station tracks
class StationPlayer {
  private player: Tone.Player | null = null;
  private currentTrack: string | null = null;

  async loadTrack(stationName: string) {
    console.log(`Attempting to load track for station: ${stationName}`);
    const trackFilename = stationTrackMap[stationName];
    if (!trackFilename) {
      console.log(`No track available for station: ${stationName}`);
      return;
    }

    const trackPath = `/assets/tracks/${trackFilename}`;
    console.log(`Loading track from path: ${trackPath}`);
    
    // Stop current track if playing
    if (this.player) {
      this.player.stop();
      this.player.dispose();
    }

    try {
      // Create new player
      this.player = new Tone.Player({
        url: trackPath,
        loop: true,
        autostart: false,
      }).toDestination();

      this.currentTrack = stationName;
      await Tone.loaded();
    } catch (error) {
      console.error(`Error loading track for ${stationName}:`, error);
      this.player = null;
      this.currentTrack = null;
    }
  }

  async play() {
    if (!this.player) return;
    try {
      await Tone.start();
      if (this.player.state !== 'started') {
        this.player.start();
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  }

  stop() {
    if (this.player) {
      this.player.stop();
    }
  }

  setVolume(volume: number) {
    if (this.player) {
      // Convert volume (0-1) to dB (-Infinity to 0)
      this.player.volume.value = Tone.gainToDb(volume);
    }
  }

  setPlaybackRate(rate: number) {
    if (this.player) {
      this.player.playbackRate = rate;
    }
  }
}

// Create singleton instance
export const stationPlayer = new StationPlayer();

// Initialize audio context on user interaction
export function initializeAudio() {
  document.addEventListener('click', async () => {
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
      console.log('Audio context resumed');
    }
  }, { once: true });
}