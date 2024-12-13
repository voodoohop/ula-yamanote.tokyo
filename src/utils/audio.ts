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

      // Start Tone.js context if needed
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // First track case
      if (!this.currentPlayer) {
        this.currentPlayer = newPlayer;
        this.currentTrack = stationName;
        this.currentPlayer.volume.value = this.isMuted ? -Infinity : -60;
        await this.currentPlayer.start();
        this.currentPlayer.volume.rampTo(this.isMuted ? -Infinity : 0, 0.1);
        return;
      }

      // Prepare the crossfade
      this.nextPlayer = newPlayer;
      this.nextPlayer.volume.value = -60;
      await this.nextPlayer.start();

      // Use a single now reference for all scheduling
      const now = Tone.now();
      const fadeOutDuration = this.crossfadeDuration;
      const fadeInDuration = this.crossfadeDuration;

      // Schedule the crossfade
      this.currentPlayer?.volume.rampTo(-60, fadeOutDuration, now);
      this.nextPlayer.volume.rampTo(this.isMuted ? -Infinity : 0, fadeInDuration, now);

      // Clean up after the fade
      Tone.Transport.scheduleOnce(() => {
        if (this.currentPlayer) {
          this.currentPlayer.stop().dispose();
        }
        this.currentPlayer = this.nextPlayer;
        this.nextPlayer = null;
        this.currentTrack = stationName;
      }, `+${fadeOutDuration + 0.1}`);

    } catch (error) {
      console.error(`Error loading track for ${stationName}:`, error);
      // Only retry if this is still the current track request
      if (this.currentTrack === stationName || !this.currentTrack) {
        this.retryLoadTrack(stationName);
      }
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