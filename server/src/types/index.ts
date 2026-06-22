// ======================================================
// GEOBOARD — SHARED TYPES & DTOs
// ======================================================

// ── Location ───────────────────────────────────────────
export interface NormalizedLocation {
  city: string
  country: string
  latitude: number
  longitude: number
  source: 'gps' | 'ip' | 'manual' | 'map'
}

export interface LocationDTO {
  id: string
  city: string
  country: string
  latitude: number
  longitude: number
  source: string
  isActive: boolean
}

export interface SavedLocationDTO {
  id: string
  city: string
  country: string
  latitude: number
  longitude: number
  label: string | null
}

// ── Weather ────────────────────────────────────────────
export interface WeatherData {
  temperature: number
  feelsLike: number
  condition: string
  humidity: number
  windSpeed: number
  pressure: number
  visibility: number
  uvIndex: number
  sunrise: string
  sunset: string
  timezone?: string
}

export interface ForecastDay {
  day: string
  date?: string
  temp: number
  tempMin?: number
  tempMax?: number
  condition: string
  icon: string
  humidity: number
  windSpeed?: number
  precipitation?: number
}

export interface HourlyForecast {
  hour: string
  temp: number
  condition: string
  humidity: number
  windSpeed?: number
}

// ── News ───────────────────────────────────────────────
export interface NewsArticle {
  id: string
  title: string
  description: string
  image: string | null
  category: string
  source: string
  publishedAt: string
  url: string
  author?: string
  content?: string
  sentiment?: string
  isBreaking?: boolean
}

// ── Currency ───────────────────────────────────────────
export interface CurrencyRate {
  code: string
  rate: number
  flag: string
  change?: number
  name?: string
}

export interface CurrencyConversion {
  fromCurrency: string
  toCurrency: string
  amount: number
  rate: number
  result: number
  timestamp: string
}

// ── Dashboard ──────────────────────────────────────────
export interface DashboardConfig {
  widgets: string[]
  layout: string
  defaultLocation?: string
  preferences: {
    temperatureUnit: string
    newsCategories: string[]
    currencyBase: string
    timeFormat: string
    theme: string
  }
}

export interface DashboardResponse {
  config: DashboardConfig
  weather: WeatherData | null
  news: NewsArticle[]
  currency: CurrencyRate[]
  location: NormalizedLocation | null
  forecast: ForecastDay[]
}

// ── Auth ───────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  provider: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
  expiresAt: string
}

// ── Analytics ──────────────────────────────────────────
export interface AnalyticsEvent {
  event: string
  metadata?: Record<string, unknown>
}

export interface AnalyticsSummary {
  mostUsedCities: { city: string; count: number }[]
  mostUsedWidgets: { widget: string; count: number }[]
  apiRequestFrequency: { date: string; count: number }[]
}

// ── API Response Wrapper ───────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    page?: number
    pageSize?: number
    totalResults?: number
    cached?: boolean
    timestamp: string
  }
}