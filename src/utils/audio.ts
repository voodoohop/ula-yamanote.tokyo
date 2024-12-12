import * as Tone from 'tone';
import { stationTrackMap } from '../data/stations';

// Audio player for station tracks
class StationPlayer {
  private player: Tone.Player | null = null;
  private currentTrack: string | null = null;
  private isLoading: boolean = false;
  private shouldPlay: boolean = false;

  async loadTrack(stationName: string) {
    // Don't reload if we're already playing this track
    if (this.currentTrack === stationName && this.player) {
      return;
    }

    // Don't start another load if we're already loading
    if (this.isLoading) {
      return;
    }

    console.log(`Attempting to load track for station: ${stationName}`);
    const trackFilename = stationTrackMap[stationName];
    if (!trackFilename) {
      console.log(`No track available for station: ${stationName}`);
      return;
    }

    const trackPath = `/assets/tracks/low/${trackFilename.replace('.mp3', '-low.mp3')}`;
    console.log(`Loading track from path: ${trackPath}`);
    
    this.isLoading = true;
    this.shouldPlay = this.player !== null; // Remember if we should autoplay
    
    try {
      // Create new player but don't dispose the old one yet
      const newPlayer = new Tone.Player({
        url: trackPath,
        loop: true,
        autostart: false,
      }).toDestination();

      // Wait for the new player to load
      await Tone.loaded();

      // Only after new player is loaded, stop and dispose the old one
      if (this.player) {
        this.player.stop();
        this.player.dispose();
      }

      this.player = newPlayer;
      this.currentTrack = stationName;
      
      // Start playing the new track if we should autoplay
      if (this.shouldPlay) {
        await this.play();
      }
    } catch (error) {
      console.error(`Error loading track for ${stationName}:`, error);
      this.player = null;
      this.currentTrack = null;
    } finally {
      this.isLoading = false;
    }
  }

  async play() {
    if (!this.player) return;
    
    try {
      await Tone.start();
      console.log('Starting playback...');
      if (this.player.state !== 'started') {
        this.player.start();
        console.log('Playback started');
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