import React, { useContext, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { LocationContext } from '../App'
import { fetchWeatherData } from '../services/api/weather'
import { fetchNewsData } from '../services/api/news'
import { fetchCurrencyRates } from '../services/api/currency'
import type { WeatherData, NewsArticle, CurrencyRate } from '../services/types'

import '../styles/Home.css'

// ======================================================
// TYPES
// ======================================================

type WeatherMood = 'clear' | 'cloudy' | 'rainy' | 'stormy'

// ======================================================
// CONSTANTS
// ======================================================


// ======================================================
// HELPERS
// ======================================================

function parseWeatherIcon(condition: string): { icon: string; mood: WeatherMood } {
  const c = condition?.toLowerCase() ?? ''
  if (c.includes('storm') || c.includes('thunder')) return { icon: '⛈️',  mood: 'stormy' }
  if (c.includes('rain')  || c.includes('drizzle')) return { icon: '🌧️', mood: 'rainy'  }
  if (c.includes('cloud') || c.includes('overcast')) return { icon: '☁️',  mood: 'cloudy' }
  if (c.includes('fog')   || c.includes('mist'))     return { icon: '🌫️', mood: 'cloudy' }
  if (c.includes('snow'))                             return { icon: '❄️',  mood: 'clear'  }
  if (c.includes('clear') || c.includes('sunny'))    return { icon: '☀️',  mood: 'clear'  }
  return { icon: '🌤️', mood: 'clear' }
}

function getGreeting(hour: number): string {
  if (hour < 5)  return 'Late Night'
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

function uvLabel(uv: number): string {
  if (uv < 3)  return 'Low'
  if (uv < 6)  return 'Moderate'
  if (uv < 8)  return 'High'
  if (uv < 11) return 'Very High'
  return 'Extreme'
}

// ======================================================
// ANIMATION VARIANTS
// ======================================================

const bentoContainer = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.055, delayChildren: 0.15 } },
}

const bentoItem = {
  hidden:  { opacity: 0, y: 32, scale: 0.97, filter: 'blur(10px)' },
  visible: {
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 80, damping: 17 },
  },
}

const modalVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.25 } },
}

// ======================================================
// SUB-COMPONENTS
// ======================================================

// Status indicator pill
const StatusPill: React.FC<{ status: 'live' | 'warn' | 'off'; label: string }> = ({ status, label }) => (
  <div className="home-status-pill">
    <span className={`home-status-dot home-status-dot--${status}`} />
    {label}
  </div>
)

// Bento cell eyebrow label
const CellLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bento-label">
    <span className="bento-label-dot" />
    {children}
  </div>
)

// Mini SVG sparkline for metric cells
const Sparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  if (values.length < 2) return null
  const W = 120, H = 28
  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: H - ((v - min) / range) * H,
  }))
  const d = pts.map((p, i) =>
    i === 0 ? `M${p.x},${p.y}`
    : `C${(pts[i-1].x + p.x)/2},${pts[i-1].y} ${(pts[i-1].x + p.x)/2},${p.y} ${p.x},${p.y}`
  ).join(' ')

  return (
    <svg className="bento-sparkline" viewBox={`0 0 ${W} ${H}`} height={H}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ── Weather cell ────────────────────────────────────────
const WeatherCell: React.FC<{
  data: WeatherData
  icon: string
}> = ({ data, icon }) => (
  <div className="bento-cell bento-cell--weather">
    <div className="bento-pad bento-pad--lg">
      <CellLabel>Atmospheric Conditions</CellLabel>
      <span className="bento-weather-icon">{icon}</span>
      <div className="bento-weather-temp">
        {Math.round(data.temperature)}°
        <span style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--ink-3)', marginLeft: '4px' }}>C</span>
      </div>
      <p className="bento-weather-condition">{data.condition}</p>
      <div className="bento-weather-stats">
        <div className="bento-weather-stat">
          <span className="bento-weather-stat-label">Feels like</span>
          <span className="bento-weather-stat-val">{Math.round(data.feelsLike)}°</span>
        </div>
        <div className="bento-weather-stat">
          <span className="bento-weather-stat-label">Humidity</span>
          <span className="bento-weather-stat-val">{Math.round(data.humidity)}%</span>
        </div>
        <div className="bento-weather-stat">
          <span className="bento-weather-stat-label">Wind</span>
          <span className="bento-weather-stat-val">{Math.round(data.windSpeed)} km/h</span>
        </div>
      </div>
    </div>
  </div>
)

// ── Big clock cell ──────────────────────────────────────
const BigClockCell: React.FC<{ time: Date; city: string }> = ({ time, city }) => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  return (
    <div className="bento-cell bento-cell--clock-large">
      <div className="bento-pad bento-pad--lg">
        <CellLabel>Local Time · {city}</CellLabel>
        <div className="bento-bigclock-time">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="bento-bigclock-date">
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div className="bento-bigclock-tz">{tz}</div>
      </div>
    </div>
  )
}

// ── Location cell ───────────────────────────────────────
const LocationCell: React.FC<{
  city: string
  country: string
  latitude: number
  longitude: number
}> = ({ city, country, latitude, longitude }) => (
  <div className="bento-cell bento-cell--location">
    <div className="bento-pad bento-pad--lg">
      <CellLabel>Location Signal</CellLabel>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div className="bento-location-city">{city}</div>
        <div className="bento-location-country">{country}</div>
        <div className="bento-location-coords">
          {latitude.toFixed(4)}°N · {longitude.toFixed(4)}°E
        </div>
      </div>
    </div>
  </div>
)

// ── Metric cell ─────────────────────────────────────────
const MetricCell: React.FC<{
  className: string
  label: string
  value: number
  unit?: string
  sub?: string
  color: 'cyan' | 'amber' | 'green' | 'red'
  barPct?: number
  sparkValues?: number[]
}> = ({ className, label, value, unit, sub, color, barPct, sparkValues }) => {
  const colorMap = { cyan: 'var(--cyan)', amber: 'var(--amber)', green: 'var(--green)', red: 'var(--red)' }
  return (
    <div className={`bento-cell ${className}`}>
      <div className="bento-pad bento-pad--sm" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CellLabel>{label}</CellLabel>
        <div style={{ marginTop: 'auto' }}>
          <div className={`bento-metric-value bento-metric-value--${color}`}>
            {Math.round(value)}
            {unit && <span className="bento-metric-unit">{unit}</span>}
          </div>
          {sub && <div className="bento-metric-sub">{sub}</div>}
          {barPct !== undefined && (
            <div className="bento-metric-bar">
              <motion.div
                className="bento-metric-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${barPct}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                style={{ background: colorMap[color] }}
              />
            </div>
          )}
          {sparkValues && <Sparkline values={sparkValues} color={colorMap[color]} />}
        </div>
      </div>
    </div>
  )
}

// ── Currency cell ───────────────────────────────────────
const CurrencyCell: React.FC<{ rates: CurrencyRate[] }> = ({ rates }) => (
  <div className="bento-cell bento-cell--currency">
    <div className="bento-pad">
      <CellLabel>FX Rates · USD Base</CellLabel>
      <div className="bento-currency-list">
        {rates.slice(0, 6).map((r, i) => {
          const delta = (Math.random() * 0.4 - 0.2)
          const up = delta >= 0
          return (
            <div key={r.code ?? i} className="bento-currency-row">
              <span className="bento-currency-pair">USD/{r.code}</span>
              <span className="bento-currency-rate">{Number(r.rate).toFixed(4)}</span>
              <span className={`bento-currency-change bento-currency-change--${up ? 'up' : 'down'}`}>
                {up ? '+' : ''}{delta.toFixed(3)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  </div>
)

// ── Map cell ────────────────────────────────────────────
const MapCell: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const handleOpenMaps = () => {
    window.open(
      `https://www.google.com/maps?q=${lat},${lng}`,
      '_blank'
    )
  }

  return (
    <button
      className="bento-cell bento-cell--map"
      onClick={handleOpenMaps}
      type="button"
      aria-label="Open location in Google Maps"
    >
      <div
        className="bento-map-placeholder"
        style={{ height: '100%', minHeight: '120px' }}
      >
        <div className="bento-map-pin" />

        <div className="bento-map-coords-overlay">
          {lat.toFixed(4)}°N {lng.toFixed(4)}°E
        </div>
      </div>
    </button>
  )
}

// ── News lead cell ──────────────────────────────────────
const NewsLeadCell: React.FC<{
  article: NewsArticle
  onRead: (a: NewsArticle) => void
}> = ({ article, onRead }) => (
  <div
    className="bento-cell bento-cell--news-lead bento-news-lead"
    onClick={() => onRead(article)}
  >
    {article.image && (
      <img src={article.image} alt="" className="bento-news-lead-img" />
    )}
    <div className="bento-news-lead-overlay" />
    <div className="bento-pad" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      <CellLabel>Lead Story · Technology</CellLabel>
      <div className="bento-news-lead-body">
        <span className="bento-news-lead-tag">{article.category}</span>
        <h2 className="bento-news-lead-title">{article.title}</h2>
        <p className="bento-news-lead-desc">{article.description}</p>
        <div className="bento-news-lead-footer">
          <span>{article.source} · {article.publishedAt}</span>
          <button
            className="bento-news-read-btn"
            onClick={e => { e.stopPropagation(); onRead(article) }}
          >
            Read →
          </button>
        </div>
      </div>
    </div>
  </div>
)

// ── News side stack ─────────────────────────────────────
const NewsSideCell: React.FC<{
  articles: NewsArticle[]
  onRead: (a: NewsArticle) => void
}> = ({ articles, onRead }) => (
  <div className="bento-cell bento-cell--news-side">
    <div className="bento-news-stack">
      {articles.slice(0, 3).map((article, i) => (
        <div
          key={article.id}
          className="bento-news-side-item"
          onClick={() => onRead(article)}
        >
          <div className="bento-news-side-num">{String(i + 2).padStart(2, '0')}</div>
          <h3 className="bento-news-side-title">{article.title}</h3>
          <div className="bento-news-side-meta">{article.source} · {article.publishedAt}</div>
        </div>
      ))}
    </div>
  </div>
)

// ── Article modal ───────────────────────────────────────
const ArticleModal: React.FC<{
  article: NewsArticle | null
  onClose: () => void
}> = ({ article, onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {article && (
        <motion.div
          className="home-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="home-modal-panel"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="home-modal-bar">
              <span className="home-modal-bar-label">Intelligence Report · {article.category}</span>
              <button className="home-modal-close" onClick={onClose}>✕ Close</button>
            </div>
            {article.image && (
              <img src={article.image} alt="" className="home-modal-img" />
            )}
            <div className="home-modal-body">
              <span className="home-modal-tag">{article.source}</span>
              <h2 className="home-modal-title">{article.title}</h2>
              <p className="home-modal-desc">{article.description}</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="home-modal-link"
              >
                Open Full Report →
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ======================================================
// PAGE: Home
// ======================================================

export const Home: React.FC = () => {
  const location = useContext(LocationContext)

  const [weatherData, setWeatherData]     = useState<WeatherData | null>(null)
  const [newsData, setNewsData]           = useState<NewsArticle[]>([])
  const [rates, setRates]                 = useState<CurrencyRate[]>([])
  const [loading, setLoading]             = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [liveTime, setLiveTime]           = useState(new Date())

  // ── Data load ────────────────────────────────────────
  useEffect(() => {
    if (!location) return
    const load = async () => {
      setLoading(true)
      try {
        const [weather, news, currency] = await Promise.all([
          fetchWeatherData(location.latitude, location.longitude),
          fetchNewsData('technology'),
          fetchCurrencyRates('USD'),
        ])
        setWeatherData(weather)
        setNewsData(news)
        setRates(currency)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [location])

  // ── Live clock ───────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const handleRead  = useCallback((a: NewsArticle) => setSelectedArticle(a), [])
  const handleClose = useCallback(() => setSelectedArticle(null), [])

  // ── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="home-page">
        <div className="home-inner" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <motion.div
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
            }}
          >
            Initialising Telemetry...
          </motion.div>
        </div>
      </div>
    )
  }

  const { icon: weatherIcon } = weatherData ? parseWeatherIcon(weatherData.condition) : { icon: '🌤️' }
  const hour     = liveTime.getHours()
  const greeting = getGreeting(hour)
  const city     = location?.city ?? 'Unknown'

  // Fake spark data for metrics (replace with real historical data if available)
  const uvSpark = Array.from({ length: 8 }, (_, i) => (weatherData?.uvIndex ?? 3) + Math.sin(i) * 1.5)

  return (
    <div className="home-page">
      {/* Ambient orbs */}
      <div className="home-orb home-orb--cyan" />
      <div className="home-orb home-orb--amber" />
      <div className="home-orb home-orb--green" />

      <div className="home-inner">

        {/* ── Header ────────────────────────────────────── */}
        <motion.div
          className="home-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <div className="home-status-bar" style={{ marginBottom: '0.75rem' }}>
              <StatusPill status="live" label="Data feed live" />
              <StatusPill status="live" label="Location lock" />
              <StatusPill status="warn" label="FX market open" />
            </div>
            <div className="home-greeting">
              <span className="home-greeting-eyebrow">
                {liveTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <h1 className="home-greeting-title">{greeting}</h1>
              <p className="home-greeting-sub">Telemetry for {city}, {location?.country}</p>
            </div>
          </div>

          <div className="home-clock">
            <div className="home-clock-time">
              {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="home-clock-date">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </div>
        </motion.div>

        {/* ── Bento grid ────────────────────────────────── */}
        <motion.div
          className="home-bento"
          variants={bentoContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Weather */}
          {weatherData && (
            <motion.div variants={bentoItem} style={{ display: 'contents' }}>
              <WeatherCell data={weatherData} icon={weatherIcon} />
            </motion.div>
          )}

          {/* Big clock */}
          <motion.div variants={bentoItem} style={{ display: 'contents' }}>
            <BigClockCell time={liveTime} city={city} />
          </motion.div>

          {/* Location */}
          {location && (
            <motion.div variants={bentoItem} style={{ display: 'contents' }}>
              <LocationCell
                city={location.city}
                country={location.country}
                latitude={location.latitude}
                longitude={location.longitude}
              />
            </motion.div>
          )}

          {/* Metrics row */}
          <motion.div variants={bentoItem} style={{ display: 'contents' }}>
            <MetricCell
              className="bento-cell--uv"
              label="UV Index"
              value={weatherData?.uvIndex ?? 0}
              sub={uvLabel(weatherData?.uvIndex ?? 0)}
              color="amber"
              barPct={Math.min(100, (weatherData?.uvIndex ?? 0) * 9)}
              sparkValues={uvSpark}
            />
          </motion.div>

          <motion.div variants={bentoItem} style={{ display: 'contents' }}>
            <MetricCell
              className="bento-cell--wind"
              label="Wind Speed"
              value={weatherData?.windSpeed ?? 0}
              unit="km/h"
              color="cyan"
              barPct={Math.min(100, (weatherData?.windSpeed ?? 0) * 2)}
            />
          </motion.div>

          <motion.div variants={bentoItem} style={{ display: 'contents' }}>
            <MetricCell
              className="bento-cell--humidity"
              label="Humidity"
              value={weatherData?.humidity ?? 0}
              unit="%"
              color="green"
              barPct={weatherData?.humidity ?? 0}
            />
          </motion.div>

          <motion.div variants={bentoItem} style={{ display: 'contents' }}>
            <MetricCell
              className="bento-cell--pressure"
              label="Pressure"
              value={weatherData?.pressure ?? 0}
              unit="hPa"
              color="cyan"
            />
          </motion.div>

          {/* Currency */}
          {rates.length > 0 && (
            <motion.div variants={bentoItem} style={{ display: 'contents' }}>
              <CurrencyCell rates={rates} />
            </motion.div>
          )}

          {/* News lead */}
          {newsData[0] && (
            <motion.div variants={bentoItem} style={{ display: 'contents' }}>
              <NewsLeadCell article={newsData[0]} onRead={handleRead} />
            </motion.div>
          )}

          {/* News side */}
          {newsData.length > 1 && (
            <motion.div variants={bentoItem} style={{ display: 'contents' }}>
              <NewsSideCell articles={newsData.slice(1)} onRead={handleRead} />
            </motion.div>
          )}

          {/* Map */}
          {location && (
            <motion.div variants={bentoItem} style={{ display: 'contents' }}>
              <MapCell lat={location.latitude} lng={location.longitude} />
            </motion.div>
          )}
        </motion.div>

      </div>

      {/* ── Article modal ──────────────────────────────── */}
      <ArticleModal article={selectedArticle} onClose={handleClose} />
    </div>
  )
}