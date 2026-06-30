// ======================================================
// BARREL EXPORTS: All Components
// ======================================================

// Layouts
export { default as Navbar } from './layouts/Navbar'
export { default as Sidebar } from './layouts/Sidebar'
export { default as AnimatedBackground } from './layouts/AnimatedBackground'

// UI Components
export { default as HeroSection } from './ui/HeroSection'
export { default as LoadingScreen } from './ui/LoadingScreen'
export { default as MetricCard } from './ui/MetricCard'
export { default as Modal } from './ui/Modal'
export { default as SearchBar } from './ui/SearchBar'
export { default as DashboardGrid } from './ui/DashboardGrid'

// Card Components
export { default as CurrencyCard } from './cards/CurrencyCard'
export { default as ForecastCard } from './cards/ForecastCard'
export { default as LocationCard } from './cards/LocationCard'
export { default as NewsCard } from './cards/NewsCard'
export { default as WeatherCard } from './cards/WeatherCard'

// Widgets
export { default as CalendarWidget } from './widgets/CalendarWidget'

// New Components
export { LocationModal } from './LocationModal'
export { MapPicker } from './MapPicker'

// Types
export type {
  WeatherCardProps,
  NewsCardProps,
  CurrencyCardProps,
  LocationCardProps,
  ForecastCardProps,
  MetricCardProps,
  ModalProps,
  SearchBarProps,
  NavbarProps,
  SidebarProps,
  DashboardGridProps,
  CalendarWidgetProps,
} from '../services/types'
