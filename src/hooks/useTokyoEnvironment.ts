import { useEffect, useMemo, useState } from 'react';

const TOKYO_WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=35.6812&longitude=139.7671&current=temperature_2m,weather_code,is_day,cloud_cover,precipitation,rain,snowfall,wind_speed_10m&timezone=Asia%2FTokyo&forecast_days=1';
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

type WeatherStatus = 'loading' | 'live' | 'unavailable';
export type PrecipitationKind = 'none' | 'rain' | 'snow';

interface CurrentWeather {
  cloud_cover: number;
  is_day: number;
  precipitation: number;
  rain: number;
  snowfall: number;
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
}

interface WeatherResponse {
  current?: CurrentWeather;
}

export interface TokyoEnvironment {
  cloudCover: number;
  daylight: number;
  isDay: boolean;
  label: string;
  precipitation: number;
  precipitationKind: PrecipitationKind;
  status: WeatherStatus;
  temperature: number | null;
  tokyoHour: number;
  weatherCode: number | null;
  windSpeed: number | null;
}

function getTokyoHour(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tokyo',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0) % 24;
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hour + minute / 60;
}

function weatherLabel(code: number | null) {
  if (code === null) return 'WEATHER OFFLINE';
  if (code === 0) return 'CLEAR';
  if (code <= 3) return code === 1 ? 'MOSTLY CLEAR' : 'CLOUDY';
  if (code === 45 || code === 48) return 'FOG';
  if (code >= 51 && code <= 57) return 'DRIZZLE';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'RAIN';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'SNOW';
  if (code >= 95) return 'THUNDERSTORM';
  return 'TOKYO WEATHER';
}

function isCurrentWeather(value: unknown): value is CurrentWeather {
  if (!value || typeof value !== 'object') return false;
  const current = value as Partial<CurrentWeather>;
  return [
    current.cloud_cover,
    current.is_day,
    current.precipitation,
    current.rain,
    current.snowfall,
    current.temperature_2m,
    current.weather_code,
    current.wind_speed_10m,
  ].every((field) => typeof field === 'number' && Number.isFinite(field));
}

export function useTokyoEnvironment(clock: Date): TokyoEnvironment {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [status, setStatus] = useState<WeatherStatus>('loading');

  useEffect(() => {
    let controller: AbortController | null = null;

    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(TOKYO_WEATHER_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Weather request failed with ${response.status}`);
        const payload = await response.json() as WeatherResponse;
        if (!isCurrentWeather(payload.current)) throw new Error('Weather response is incomplete');
        setWeather(payload.current);
        setStatus('live');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setStatus('unavailable');
      }
    };

    void load();
    const timer = window.setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      controller?.abort();
    };
  }, []);

  return useMemo(() => {
    const tokyoHour = getTokyoHour(clock);
    const clockIsDay = tokyoHour >= 5 && tokyoHour < 19;
    const isDay = weather ? weather.is_day === 1 : clockIsDay;
    const solarArc = Math.max(0, Math.sin(((tokyoHour - 5) / 14) * Math.PI));
    const precipitationKind: PrecipitationKind = weather?.snowfall
      ? 'snow'
      : weather && (weather.rain > 0 || weather.precipitation > 0)
        ? 'rain'
        : 'none';

    return {
      cloudCover: weather?.cloud_cover ?? 0,
      daylight: isDay ? Math.max(0.16, solarArc) : 0,
      isDay,
      label: status === 'loading' ? 'SYNCING SKY' : weatherLabel(weather?.weather_code ?? null),
      precipitation: weather?.precipitation ?? 0,
      precipitationKind,
      status,
      temperature: weather?.temperature_2m ?? null,
      tokyoHour,
      weatherCode: weather?.weather_code ?? null,
      windSpeed: weather?.wind_speed_10m ?? null,
    };
  }, [clock, status, weather]);
}
