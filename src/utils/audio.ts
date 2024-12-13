import * as Tone from 'tone';
import { stationTrackMap } from '../data/stations';

class StationPlayer {
  private currentPlayer: Tone.Player | null = null;
  private nextPlayer: Tone.Player | null = null;
  private currentTrack: string | null = null;
  private isLoading = false;
  private preloadedTracks = new Map<string, Tone.Player>();
  private crossfadeDuration = 2;
  private isMuted = false;
  private retryTimeout: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start health check interval
    this.startHealthCheck();
  }

  private startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.healthCheckInterval = setInterval(() => {
      this.checkPlaybackHealth();
    }, 5000); // Check every 5 seconds
  }

  private async checkPlaybackHealth() {
    if (this.isMuted || !this.currentTrack || !this.currentPlayer) return;
    
    try {
      // Check if we should be playing but aren't
      if (!this.currentPlayer.state.includes('started')) {
        console.log('Playback stopped unexpectedly, restarting...');
        await this.loadTrack(this.currentTrack);
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  }

  private async retryLoadTrack(stationName: string, retryCount = 0) {
    if (retryCount >= 3) {
      console.error(`Failed to load track for ${stationName} after 3 attempts`);
      return;
    }

    try {
      const trackPath = this.getTrackPath(stationName);
      if (!trackPath) return;

      console.log(`Retry ${retryCount + 1}: Loading track for ${stationName}`);
      const newPlayer = await this.createPlayer(trackPath);
      await Tone.loaded();
      
      // If we're still trying to load the same track
      if (this.currentTrack === stationName) {
        if (this.currentPlayer) {
          this.currentPlayer.stop();
          this.currentPlayer.dispose();
        }
        this.currentPlayer = newPlayer;
        await this.currentPlayer.start();
        this.currentPlayer.volume.value = this.isMuted ? -Infinity : 0;
      } else {
        newPlayer.dispose();
      }
    } catch (error) {
      console.error(`Retry failed for ${stationName}:`, error);
      // Schedule another retry with exponential backoff
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
      this.retryTimeout = setTimeout(() => {
        this.retryLoadTrack(stationName, retryCount + 1);
      }, backoffTime);
    }
  }

  private async createPlayer(trackPath: string): Promise<Tone.Player> {
    const player = new Tone.Player({
      url: trackPath,
      loop: true,
      autostart: false,
      volume: -Infinity, // Start silent but will ramp to 0 dB
    }).toDestination();
    
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
        this.currentPlayer.volume.rampTo(0, 0.1); // Quick fade in to 0 dB
        return;
      }

      // Start crossfade
      this.nextPlayer = newPlayer;
      await this.nextPlayer.start();
      
      // Calculate volume curves for crossfade
      const now = Tone.now();
      const targetVolume = 0;  // Always target 0 dB for full volume
      const silentVolume = -Infinity;

      // Start both volume ramps at the same time
      this.currentPlayer.volume.cancelScheduledValues(now);
      this.nextPlayer.volume.cancelScheduledValues(now);
      
      // Set initial volumes
      this.currentPlayer.volume.setValueAtTime(targetVolume, now);
      this.nextPlayer.volume.setValueAtTime(silentVolume, now);
      
      // Perform the crossfade
      this.currentPlayer.volume.linearRampToValueAtTime(silentVolume, now + this.crossfadeDuration);
      this.nextPlayer.volume.linearRampToValueAtTime(targetVolume, now + this.crossfadeDuration);

      // Schedule cleanup of old player
      setTimeout(() => {
        if (this.currentPlayer) {
          this.currentPlayer.stop();
          this.currentPlayer.dispose();
        }
        this.currentPlayer = this.nextPlayer;
        this.currentPlayer.volume.value = this.isMuted ? -Infinity : 0;  // Ensure final volume is at 0 dB
        this.nextPlayer = null;
        this.currentTrack = stationName;
      }, this.crossfadeDuration * 1000 + 100);

    } catch (error) {
      console.error(`Error loading track for ${stationName}:`, error);
      this.retryLoadTrack(stationName);
    } finally {
      this.isLoading = false;
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    const targetVolume = muted ? -Infinity : 0;
    
    if (this.currentPlayer) {
      this.currentPlayer.volume.rampTo(targetVolume, 0.1);
    }
    if (this.nextPlayer) {
      this.nextPlayer.volume.rampTo(targetVolume, 0.1);
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  stop() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
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