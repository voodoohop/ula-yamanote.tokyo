import { useCallback } from 'react';
import { stationPlayer } from '../utils/audio';
import * as Tone from 'tone';

interface UseAudioControlProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  setIsGpsActive: (active: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAudioControl = ({
  isPlaying,
  setIsPlaying,
  setIsGpsActive,
  setIsLoading
}: UseAudioControlProps) => {
  return useCallback(async () => {
    if (isPlaying) {
      stationPlayer.stop();
      setIsPlaying(false);
      setIsGpsActive(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Start audio context for iOS Safari
      await Tone.start();
      
      if ("geolocation" in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          
          if (permissionStatus.state === 'denied') {
            console.error('Geolocation permission is denied');
            setIsGpsActive(false);
            setIsPlaying(false);
            return;
          }

          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              { 
                enableHighAccuracy: true,
                maximumAge: 2000,
                timeout: 10000
              }
            );
          });

          setIsGpsActive(true);
          setIsPlaying(true);
        } catch (error: any) {
          console.error('Geolocation error:', error);
          setIsGpsActive(false);
          setIsPlaying(error.code !== 1);
        }
      } else {
        setIsGpsActive(false);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('GPS error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, setIsPlaying, setIsGpsActive, setIsLoading]);
};
