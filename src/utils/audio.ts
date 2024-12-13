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
  private isDisposed = false;
  private loadQueue: string[] = [];

  constructor() {
    // Initialize Tone.js with safe defaults
    Tone.setContext(new Tone.Context({ latencyHint: 'playback' }));
    window.addEventListener('unload', () => this.dispose());
  }

  private async ensureContext() {
    if (Tone.context.state !== 'running') {
      try {
        await Tone.start();
        console.log('Tone.js context started');
      } catch (error) {
        console.error('Failed to start Tone.js context:', error);
        throw error;
      }
    }
  }

  private cleanupOldPlayer() {
    if (this.currentPlayer) {
      try {
        this.currentPlayer.stop();
        this.currentPlayer.dispose();
      } catch (error) {
        console.error('Error cleaning up old player:', error);
      }
      this.currentPlayer = null;
    }
  }

  public dispose() {
    this.isDisposed = true;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    // Clean up all audio resources
    this.cleanupOldPlayer();
    if (this.nextPlayer) {
      try {
        this.nextPlayer.stop();
        this.nextPlayer.dispose();
      } catch (error) {
        console.error('Error disposing next player:', error);
      }
      this.nextPlayer = null;
    }
    
    // Clean up preloaded tracks
    for (const player of this.preloadedTracks.values()) {
      try {
        player.stop();
        player.dispose();
      } catch (error) {
        console.error('Error disposing preloaded track:', error);
      }
    }
    this.preloadedTracks.clear();
    this.loadQueue = [];
  }

  private async safeCreatePlayer(trackPath: string): Promise<Tone.Player | null> {
    if (this.isDisposed) return null;
    
    try {
      const player = new Tone.Player({
        url: trackPath,
        loop: true,
        autostart: false,
        volume: -60,
      }).toDestination();
      
      await new Promise((resolve, reject) => {
        player.onerror = reject;
        player.onstop = resolve;
        player.onload = resolve;
      });
      
      return player;
    } catch (error) {
      console.error('Error creating player:', error);
      return null;
    }
  }

  async loadTrack(stationName: string) {
    if (this.isDisposed) return;

    // Add to queue and return if already loading
    if (this.isLoading) {
      this.loadQueue.push(stationName);
      return;
    }

    // Don't reload if we're already playing this track
    if (this.currentTrack === stationName && this.currentPlayer?.state === 'started') {
      return;
    }

    console.log(`Loading track for station: ${stationName}`);
    const trackPath = this.getTrackPath(stationName);
    if (!trackPath) return;
    
    this.isLoading = true;
    
    try {
      await this.ensureContext();

      // Get or create the new player
      let newPlayer = this.preloadedTracks.get(stationName);
      if (!newPlayer) {
        newPlayer = await this.safeCreatePlayer(trackPath);
        if (!newPlayer) throw new Error('Failed to create player');
      } else {
        this.preloadedTracks.delete(stationName);
      }

      // First track case
      if (!this.currentPlayer) {
        this.currentPlayer = newPlayer;
        this.currentTrack = stationName;
        await this.currentPlayer.start();
        this.currentPlayer.volume.rampTo(this.isMuted ? -Infinity : 0, 0.1);
        return;
      }

      // Prepare the crossfade
      this.nextPlayer = newPlayer;
      await this.nextPlayer.start();

      // Use a single now reference for all scheduling
      const now = Tone.now();
      const fadeOutDuration = this.crossfadeDuration;

      // Schedule the crossfade
      if (this.currentPlayer?.volume) {
        this.currentPlayer.volume.rampTo(-60, fadeOutDuration, now);
      }
      if (this.nextPlayer?.volume) {
        this.nextPlayer.volume.rampTo(this.isMuted ? -Infinity : 0, fadeOutDuration, now);
      }

      // Clean up after the fade using Transport for reliable timing
      Tone.Transport.scheduleOnce(() => {
        if (!this.isDisposed) {
          this.cleanupOldPlayer();
          this.currentPlayer = this.nextPlayer;
          this.nextPlayer = null;
          this.currentTrack = stationName;
        }
      }, `+${fadeOutDuration + 0.1}`);

    } catch (error) {
      console.error(`Error loading track for ${stationName}:`, error);
      if (this.currentTrack === stationName || !this.currentTrack) {
        this.retryLoadTrack(stationName);
      }
    } finally {
      this.isLoading = false;
      
      // Process next item in queue if any
      const nextTrack = this.loadQueue.shift();
      if (nextTrack) {
        setTimeout(() => this.loadTrack(nextTrack), 100);
      }
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
      const newPlayer = await this.safeCreatePlayer(trackPath);
      if (!newPlayer) throw new Error('Failed to create player');
      
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
      const player = await this.safeCreatePlayer(trackPath);
      if (!player) throw new Error('Failed to create player');
      await Tone.loaded();
      this.preloadedTracks.set(stationName, player);
      console.log(`Preloaded track for station: ${stationName}`);
    } catch (error) {
      console.error(`Error preloading track for ${stationName}:`, error);
    }
  }

  async startHealthCheck() {
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
    this.dispose();
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

// Initialize audio context on user interaction
export function initializeAudio() {
  let hasInitialized = false;

  const initHandler = async () => {
    if (hasInitialized) return;
    hasInitialized = true;

    try {
      await Tone.start();
      console.log('Audio context initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      hasInitialized = false; // Allow retry on next interaction
    }
  };

  // Handle various user interaction events
  const events = ['click', 'touchstart', 'keydown'];
  events.forEach(event => {
    document.addEventListener(event, initHandler, { once: true });
  });

  // Cleanup on page unload
  window.addEventListener('unload', () => {
    stationPlayer.dispose();
  });
}

// Create singleton instance with error boundary
let stationPlayer: StationPlayer;
try {
  stationPlayer = new StationPlayer();
} catch (error) {
  console.error('Failed to create StationPlayer:', error);
  // Create a dummy player that does nothing
  stationPlayer = {
    loadTrack: () => Promise.resolve(),
    preloadTrack: () => Promise.resolve(),
    setMuted: () => {},
    stop: () => {},
    dispose: () => {},
  } as StationPlayer;
}

export { stationPlayer };