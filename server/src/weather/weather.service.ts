// ======================================================
// GEOBOARD — WEATHER SERVICE (Backend proxy)
// Open-Meteo API (free, no key required)
// All external API calls centralized here
// ======================================================

import { getCache, CacheService } from '../cache/index.js'
import { config } from '../config/index.js'
import type { WeatherData, ForecastDay, HourlyForecast } from '../types/index.js'

// Weather code to condition mapping (WMO codes)
const WEATHER_CONDITIONS: Record<number, string> = {
  0: 'Clear',
  1: 'Partly Cloudy',
  2: 'Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  71: 'Slight Snow',
  73: 'Moderate Snow',
  75: 'Heavy Snow',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  85: 'Slight Snow Showers',
  86: 'Heavy Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Hail',
  99: 'Thunderstorm with Hail',
}

const FORECAST_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export class WeatherService {
  // ── Current Weather ─────────────────────────────────

  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    const cache = getCache()
    const cacheKey = CacheService.weatherCoordKey(lat, lng)

    const { data, cached } = await cache.getOrFetch(
      cacheKey,
      config.cache.ttlWeather,
      async () => this.fetchCurrentWeather(lat, lng),
    )

    return data as WeatherData
  }

  private async fetchCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,visibility&daily=sunrise,sunset,uv_index_max&timezone=auto`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`)
    const json = await response.json() as {
      current?: {
        temperature_2m: number
        apparent_temperature: number
        weather_code: number
        relative_humidity_2m: number
        wind_speed_10m: number
        pressure_msl: number
        visibility?: number
      }
      daily?: {
        sunrise: string[]
        sunset: string[]
        uv_index_max: number[]
      }
      timezone?: string
    }

    if (!json.current) throw new Error('Invalid weather response')

    return {
      temperature: json.current.temperature_2m,
      feelsLike: json.current.apparent_temperature,
      condition: WEATHER_CONDITIONS[json.current.weather_code] || 'Unknown',
      humidity: json.current.relative_humidity_2m,
      windSpeed: json.current.wind_speed_10m,
      pressure: json.current.pressure_msl,
      visibility: Math.round((json.current.visibility || 10000) / 1000),
      uvIndex: Math.round(json.daily?.uv_index_max?.[0] || 0),
      sunrise: json.daily?.sunrise?.[0] || 'N/A',
      sunset: json.daily?.sunset?.[0] || 'N/A',
      timezone: json.timezone,
    }
  }

  // ── 7-Day Forecast ─────────────────────────────────

  async get7DayForecast(lat: number, lng: number): Promise<ForecastDay[]> {
    const cache = getCache()
    const cacheKey = `${CacheService.weatherCoordKey(lat, lng)}:forecast`

    const { data } = await cache.getOrFetch(
      cacheKey,
      config.cache.ttlWeather,
      async () => this.fetch7DayForecast(lat, lng),
    )

    return data as ForecastDay[]
  }

  private async fetch7DayForecast(lat: number, lng: number): Promise<ForecastDay[]> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weather_code,relative_humidity_2m_max,precipitation_sum,wind_speed_10m_max&timezone=auto`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`)
    const json = await response.json() as {
      daily?: {
        time: string[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        weather_code: number[]
        relative_humidity_2m_max: number[]
        precipitation_sum: number[]
        wind_speed_10m_max: number[]
      }
    }

    if (!json.daily) throw new Error('Invalid forecast response')

    return json.daily.time.slice(0, 7).map((date: string, index: number) => ({
      day: FORECAST_DAYS[(new Date(date).getDay() + 6) % 7],
      date,
      temp: Math.round((json.daily!.temperature_2m_max[index] + json.daily!.temperature_2m_min[index]) / 2),
      tempMin: Math.round(json.daily!.temperature_2m_min[index]),
      tempMax: Math.round(json.daily!.temperature_2m_max[index]),
      condition: WEATHER_CONDITIONS[json.daily!.weather_code[index]] || 'Unknown',
      icon: this.getWeatherIcon(WEATHER_CONDITIONS[json.daily!.weather_code[index]] || 'Unknown'),
      humidity: json.daily!.relative_humidity_2m_max[index],
      windSpeed: Math.round(json.daily!.wind_speed_10m_max[index]),
      precipitation: Math.round(json.daily!.precipitation_sum[index] * 10) / 10,
    }))
  }

  // ── Hourly Forecast ────────────────────────────────

  async getHourlyForecast(lat: number, lng: number, hours = 24): Promise<HourlyForecast[]> {
    const cache = getCache()
    const cacheKey = `${CacheService.weatherCoordKey(lat, lng)}:hourly`

    const { data } = await cache.getOrFetch(
      cacheKey,
      config.cache.ttlWeather,
      async () => this.fetchHourlyForecast(lat, lng, hours),
    )

    return data as HourlyForecast[]
  }

  private async fetchHourlyForecast(lat: number, lng: number, hours: number): Promise<HourlyForecast[]> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`)
    const json = await response.json() as {
      hourly?: {
        time: string[]
        temperature_2m: number[]
        weather_code: number[]
        relative_humidity_2m: number[]
        wind_speed_10m: number[]
      }
    }

    if (!json.hourly) throw new Error('Invalid hourly response')

    return json.hourly.time.slice(0, hours).map((time: string, index: number) => ({
      hour: new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      temp: Math.round(json.hourly!.temperature_2m[index]),
      condition: WEATHER_CONDITIONS[json.hourly!.weather_code[index]] || 'Unknown',
      humidity: json.hourly!.relative_humidity_2m[index],
      windSpeed: Math.round(json.hourly!.wind_speed_10m[index]),
    }))
  }

  // ── Helpers ─────────────────────────────────────────

  private getWeatherIcon(condition: string): string {
    const c = condition.toLowerCase()
    if (c.includes('rain') || c.includes('drizzle')) return '🌧️'
    if (c.includes('cloud')) return '☁️'
    if (c.includes('clear') || c.includes('sunny')) return '☀️'
    if (c.includes('snow')) return '❄️'
    if (c.includes('storm') || c.includes('thunder')) return '⛈️'
    if (c.includes('fog')) return '🌫️'
    if (c.includes('partly')) return '⛅'
    return '🌤️'
  }
}

export const weatherService = new WeatherService()