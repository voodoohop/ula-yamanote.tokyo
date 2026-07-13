import { useCallback, useEffect, useRef, useState } from 'react';

type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

function trackUrl(track: string) {
  return `/assets/tracks/low/${track}-low.mp3`;
}

export function useStationAudio(track: string, isActive: boolean) {
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
      audio.addEventListener('pause', () => setStatus((current) => current === 'error' ? current : 'paused'));
      audio.addEventListener('waiting', () => setStatus('loading'));
      audio.addEventListener('error', () => setStatus('error'));
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const play = useCallback(async () => {
    const audio = getAudio();
    const nextTrack = trackUrl(track);

    if (audio.dataset.track !== track) {
      audio.dataset.track = track;
      audio.src = nextTrack;
      audio.load();
    }

    shouldPlayRef.current = true;
    setStatus('loading');
    try {
      await audio.play();
      setStatus('playing');
    } catch {
      setStatus('error');
    }
  }, [getAudio, track]);

  useEffect(() => {
    if (isActive && shouldPlayRef.current) void play();
  }, [isActive, play, track]);

  useEffect(() => () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }, []);

  const toggle = useCallback(() => {
    const audio = getAudio();
    if (audio.paused) {
      void play();
    } else {
      shouldPlayRef.current = false;
      audio.pause();
    }
  }, [getAudio, play]);

  const toggleMute = useCallback(() => {
    const audio = getAudio();
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  }, [getAudio]);

  return { status, isMuted, toggle, toggleMute };
}
