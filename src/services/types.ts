// ======================================================
// TYPES & INTERFACES: Global Application Types
// ======================================================

export interface UserLocation {
  latitude: number
  longitude: number
  city: string
  country: string
  timezone: string
}

export interface GeolocationState {
  latitude: number | null
  longitude: number | null
  city: string | null
  country: string | null
  timezone: string | null
  loading: boolean
  error: string | null
}

// ======================================================
// WEATHER TYPES
// ======================================================

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

// ======================================================
// NEWS TYPES
// ======================================================

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
  isBreaking?: boolean
}

export interface NewsResponse {
  articles: NewsArticle[]
  totalResults: number
  status: string
}

// ======================================================
// CURRENCY TYPES
// ======================================================

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

export interface ExchangeRateResponse {
  base: string
  date: string
  rates: { [key: string]: number }
}

// ======================================================
// CALENDAR TYPES
// ======================================================

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  color: string
  description?: string
  endTime?: string
}

// ======================================================
// API ERROR TYPES
// ======================================================

export interface ApiError {
  message: string
  status?: number
  code?: string
}

// ======================================================
// PAGINATION TYPES
// ======================================================

export interface PaginationMeta {
  page: number
  pageSize: number
  totalResults: number
  totalPages: number
}

// ======================================================
// COMPONENT PROPS TYPES
// ======================================================

export interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  icon: string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  color: 'cyan' | 'purple' | 'pink' | 'green'
}

export interface HeroSectionProps {
  title: string
  subtitle: string
  children?: React.ReactNode
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  value?: string
  onChange?: (value: string) => void
}

export interface NavLink {
  path: string
  label: string
  icon: React.ReactNode
}

export interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export interface NavbarProps {
  onMenuClick: () => void
}

export interface LoadingScreenProps {
  message?: string
}

// ======================================================
// CARD COMPONENT PROPS
// ======================================================

export interface WeatherCardProps {
  temperature: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
  feelsLike: number
  pressure?: number
  uvIndex?: number
}

export interface NewsCardProps {
  article: NewsArticle
  onRead: (article: NewsArticle) => void
}

export interface CurrencyCardProps {
  fromCurrency: string
  toCurrency: string
  rate: number
  amount: number
  result: number
  flag?: string
}

export interface LocationCardProps {
  city: string
  country: string
  timezone: string
  coordinates: { lat: number; lon: number }
}

export interface ForecastCardProps {
  days: ForecastDay[]
  loading?: boolean
}

// ======================================================
// LAYOUT PROPS
// ======================================================

export interface DashboardGridProps {
  children: React.ReactNode
  columns?: number
}

export interface CalendarWidgetProps {
  events: CalendarEvent[]
  onAddEvent: (event: CalendarEvent) => void
  onDeleteEvent: (id: string) => void
}