import * as Tone from 'tone';

class WakeLockManager {
  private wakeLock: any = null;
  private silentAudio: HTMLAudioElement | null = null;
  private isActive = false;

  async acquire() {
    if (this.isActive) return;
    this.isActive = true;

    try {
      // Try WakeLock API first (supported on Android Chrome and some desktop browsers)
      if ('wakeLock' in navigator) {
        try {
          this.wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('WakeLock acquired');
          return;
        } catch (err) {
          console.log('WakeLock API not available, falling back to audio');
        }
      }

      // Fallback: Create and play a silent audio track
      if (!this.silentAudio) {
        this.silentAudio = new Audio();
        this.silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        this.silentAudio.loop = true;
        this.silentAudio.playsinline = true;
        this.silentAudio.muted = true;
        this.silentAudio.setAttribute('playsinline', '');
        this.silentAudio.setAttribute('webkit-playsinline', '');
      }

      // iOS requires user interaction to play audio
      document.addEventListener('touchstart', () => {
        this.silentAudio?.play().catch(console.error);
      }, { once: true });

      await this.silentAudio.play();
      console.log('Silent audio playing for wake lock');
    } catch (error) {
      console.error('Error acquiring wake lock:', error);
    }
  }

  release() {
    if (!this.isActive) return;
    this.isActive = false;

    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }

    if (this.silentAudio) {
      this.silentAudio.pause();
      this.silentAudio.currentTime = 0;
    }
  }
}

export const wakeLockManager = new WakeLockManager();
