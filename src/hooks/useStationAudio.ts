import { useCallback, useEffect, useRef, useState } from 'react';

type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error' | 'unavailable';

function trackUrl(track: string) {
  return `/assets/tracks/low/${track}-low.mp3`;
}

export function useStationAudio(track: string | null, isActive: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldPlayRef = useRef(false);
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = 'metadata';
      audio.volume = 0.82;
      audio.addEventListener('playing', () => setStatus('playing'));
      audio.addEventListener('pause', () => {
        if (!shouldPlayRef.current) {
          setStatus((current) => current === 'error' ? current : 'paused');
        }
      });
      audio.addEventListener('waiting', () => {
        if (shouldPlayRef.current) setStatus('loading');
      });
      audio.addEventListener('error', () => {
        shouldPlayRef.current = false;
        setStatus('error');
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const play = useCallback(async () => {
    if (!track) {
      audioRef.current?.pause();
      setStatus('unavailable');
      return;
    }

    const audio = getAudio();
    const nextTrack = trackUrl(track);

    shouldPlayRef.current = true;

    if (audio.dataset.track !== track) {
      audio.dataset.track = track;
      audio.src = nextTrack;
      audio.load();
    }

    setStatus('loading');
    try {
      await audio.play();
      setStatus('playing');
    } catch {
      setStatus('error');
    }
  }, [getAudio, track]);

  useEffect(() => {
    if (!track) {
      audioRef.current?.pause();
      setStatus('unavailable');
      return;
    }

    setStatus((current) => current === 'unavailable' ? 'idle' : current);
    if (isActive && shouldPlayRef.current) void play();
  }, [isActive, play, track]);

  useEffect(() => () => {
    const audio = audioRef.current;
    if (!audio) return;
    shouldPlayRef.current = false;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }, []);

  const toggle = useCallback(() => {
    if (!track) {
      setStatus('unavailable');
      return;
    }

    const audio = getAudio();
    if (audio.paused) {
      void play();
    } else {
      shouldPlayRef.current = false;
      audio.pause();
    }
  }, [getAudio, play, track]);

  const toggleMute = useCallback(() => {
    const audio = getAudio();
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  }, [getAudio]);

  return { status, isAvailable: track !== null, isMuted, toggle, toggleMute };
}
