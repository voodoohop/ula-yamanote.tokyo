import * as Tone from 'tone';
import { stationTrackMap } from '../data/stations';

class StationPlayer {
  private currentPlayer: Tone.Player | null = null;
  private nextPlayer: Tone.Player | null = null;
  private currentTrack: string | null = null;
  private isLoading: boolean = false;
  private crossfadeDuration: number = 8;
  private preloadedTracks: Map<string, Tone.Player> = new Map();

  private async createPlayer(trackPath: string): Promise<Tone.Player> {
    const player = new Tone.Player({
      url: trackPath,
      loop: true,
      autostart: false,
    }).toDestination();
    
    // Start with silence
    player.volume.value = -Infinity;
    return player;
  }

  private getTrackPath(stationName: string): string | null {
    const trackFilename = stationTrackMap[stationName];
    if (!trackFilename) {
      console.log(`No track available for station: ${stationName}`);
      return null;
    }
    return `/assets/tracks/low/${trackFilename}-low.mp3`;
  }

  async preloadTrack(stationName: string) {
    if (this.preloadedTracks.has(stationName)) {
      return;
    }

    const trackPath = this.getTrackPath(stationName);
    if (!trackPath) return;

    try {
      const player = await this.createPlayer(trackPath);
      await Tone.loaded();
      this.preloadedTracks.set(stationName, player);
      console.log(`Preloaded track for station: ${stationName}`);
    } catch (error) {
      console.error(`Error preloading track for ${stationName}:`, error);
    }
  }

  async loadTrack(stationName: string) {
    // Don't reload if we're already playing this track
    if (this.currentTrack === stationName && this.currentPlayer) {
      return;
    }

    // Don't start another load if we're already loading
    if (this.isLoading) {
      return;
    }

    console.log(`Loading track for station: ${stationName}`);
    const trackPath = this.getTrackPath(stationName);
    if (!trackPath) return;
    
    this.isLoading = true;
    
    try {
      // Get or create the new player
      let newPlayer = this.preloadedTracks.get(stationName);
      if (!newPlayer) {
        newPlayer = await this.createPlayer(trackPath);
        await Tone.loaded();
      } else {
        this.preloadedTracks.delete(stationName);
      }

      // Start Tone.js context
      await Tone.start();

      // First track case
      if (!this.currentPlayer) {
        this.currentPlayer = newPlayer;
        this.currentTrack = stationName;
        await this.currentPlayer.start();
        this.currentPlayer.volume.rampTo(0, 0.1); // Quick fade in for first track
        return;
      }

      // Start crossfade
      this.nextPlayer = newPlayer;
      await this.nextPlayer.start();
      
      // Calculate volume curves for crossfade
      const now = Tone.now();
      const initialVolume = 0;  // 0 dB is full volume
      const silentVolume = -Infinity;

      // Start both volume ramps at the same time
      this.currentPlayer.volume.cancelScheduledValues(now);
      this.nextPlayer.volume.cancelScheduledValues(now);
      
      // Set initial volumes
      this.currentPlayer.volume.setValueAtTime(initialVolume, now);
      this.nextPlayer.volume.setValueAtTime(silentVolume, now);
      
      // Perform the crossfade
      this.currentPlayer.volume.linearRampToValueAtTime(silentVolume, now + this.crossfadeDuration);
      this.nextPlayer.volume.linearRampToValueAtTime(initialVolume, now + this.crossfadeDuration);

      // Schedule cleanup of old player
      setTimeout(() => {
        if (this.currentPlayer) {
          this.currentPlayer.stop();
          this.currentPlayer.dispose();
        }
        this.currentPlayer = this.nextPlayer;
        this.nextPlayer = null;
        this.currentTrack = stationName;
      }, this.crossfadeDuration * 1000 + 100); // Add a small delay to ensure both tracks fade simultaneously

    } catch (error) {
      console.error(`Error loading track for ${stationName}:`, error);
    } finally {
      this.isLoading = false;
    }
  }

  stop() {
    if (this.currentPlayer) {
      this.currentPlayer.stop();
      this.currentPlayer.dispose();
      this.currentPlayer = null;
    }
    if (this.nextPlayer) {
      this.nextPlayer.stop();
      this.nextPlayer.dispose();
      this.nextPlayer = null;
    }
    this.currentTrack = null;
    
    // Clean up preloaded tracks
    this.preloadedTracks.forEach(player => player.dispose());
    this.preloadedTracks.clear();
  }

  setVolume(volume: number) {
    if (this.currentPlayer) {
      this.currentPlayer.volume.value = Tone.gainToDb(volume);
    }
  }

  setPlaybackRate(rate: number) {
    if (this.currentPlayer) {
      this.currentPlayer.playbackRate = rate;
    }
    if (this.nextPlayer) {
      this.nextPlayer.playbackRate = rate;
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