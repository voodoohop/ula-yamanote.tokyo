import * as Tone from 'tone';
import { stations, stationTrackMap } from '../data/stations';

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
        this.currentPlayer.volume.value = targetVolume;  // Ensure final volume is at 0 dB
        this.nextPlayer = null;
        this.currentTrack = stationName;
      }, this.crossfadeDuration * 1000 + 100);

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

// Track initialization state
let isInitializing = false;
let isInitialized = false;

// Initialize audio context and preload tracks
export async function initializeAudio() {
  // Prevent multiple simultaneous initializations
  if (isInitializing || isInitialized) {
    return;
  }
  
  isInitializing = true;
  console.log('Starting audio initialization');
  
  // Get all station names in order
  const stationNames = stations.map(station => station.name);
  
  // Load stations in small batches to not overwhelm the network
  const BATCH_SIZE = 3;
  for (let i = 0; i < stationNames.length; i += BATCH_SIZE) {
    const batch = stationNames.slice(i, i + BATCH_SIZE);
    console.log(`Loading stations batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(stationNames.length/BATCH_SIZE)}: ${batch.join(', ')}`);
    await Promise.all(
      batch.map(station => stationPlayer.preloadTrack(station))
    );
  }
  
  console.log('All station tracks preloaded');
  isInitialized = true;
  isInitializing = false;
}