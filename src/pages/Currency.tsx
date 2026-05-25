import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchCurrencyRates } from '../services/api/currency'
import '../styles/Currency.css'

// ======================================================
// TYPES
// ======================================================

interface CurrencyRate {
  code: string
  rate: number
}

interface WatchlistEntry {
  code: string
  name: string
  flag: string
  rate: number | null
  change: number | null
}

// ======================================================
// CONSTANTS
// ======================================================

const CURRENCY_GROUPS = [
  {
    label: 'Global Majors',
    currencies: [
      { code: 'USD', name: 'US Dollar' },
      { code: 'EUR', name: 'Euro' },
      { code: 'GBP', name: 'British Pound' },
      { code: 'JPY', name: 'Japanese Yen' },
      { code: 'CHF', name: 'Swiss Franc' },
      { code: 'CAD', name: 'Canadian Dollar' },
      { code: 'AUD', name: 'Australian Dollar' },
    ],
  },
  {
    label: 'MENA Region',
    currencies: [
      { code: 'EGP', name: 'Egyptian Pound' },
      { code: 'SAR', name: 'Saudi Riyal' },
      { code: 'AED', name: 'UAE Dirham' },
      { code: 'QAR', name: 'Qatari Riyal' },
      { code: 'KWD', name: 'Kuwaiti Dinar' },
      { code: 'BHD', name: 'Bahraini Dinar' },
      { code: 'OMR', name: 'Omani Rial' },
      { code: 'JOD', name: 'Jordanian Dinar' },
      { code: 'LBP', name: 'Lebanese Pound' },
      { code: 'MAD', name: 'Moroccan Dirham' },
      { code: 'TND', name: 'Tunisian Dinar' },
      { code: 'DZD', name: 'Algerian Dinar' },
    ],
  },
  {
    label: 'Europe',
    currencies: [
      { code: 'SEK', name: 'Swedish Krona' },
      { code: 'NOK', name: 'Norwegian Krone' },
      { code: 'DKK', name: 'Danish Krone' },
      { code: 'PLN', name: 'Polish Złoty' },
      { code: 'CZK', name: 'Czech Koruna' },
      { code: 'HUF', name: 'Hungarian Forint' },
      { code: 'RON', name: 'Romanian Leu' },
    ],
  },
  {
    label: 'Far East Asia',
    currencies: [
      { code: 'CNY', name: 'Chinese Yuan' },
      { code: 'KRW', name: 'South Korean Won' },
      { code: 'HKD', name: 'Hong Kong Dollar' },
      { code: 'TWD', name: 'Taiwan Dollar' },
    ],
  },
  {
    label: 'Southeast Asia',
    currencies: [
      { code: 'SGD', name: 'Singapore Dollar' },
      { code: 'MYR', name: 'Malaysian Ringgit' },
      { code: 'THB', name: 'Thai Baht' },
      { code: 'IDR', name: 'Indonesian Rupiah' },
      { code: 'PHP', name: 'Philippine Peso' },
      { code: 'VND', name: 'Vietnamese Dong' },
    ],
  },
]

const ALL_CURRENCIES = CURRENCY_GROUPS.flatMap(g => g.currencies)

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭',
  CAD: '🇨🇦', AUD: '🇦🇺', EGP: '🇪🇬', SAR: '🇸🇦', AED: '🇦🇪',
  QAR: '🇶🇦', KWD: '🇰🇼', BHD: '🇧🇭', OMR: '🇴🇲', JOD: '🇯🇴',
  LBP: '🇱🇧', MAD: '🇲🇦', TND: '🇹🇳', DZD: '🇩🇿', SEK: '🇸🇪',
  NOK: '🇳🇴', DKK: '🇩🇰', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺',
  RON: '🇷🇴', CNY: '🇨🇳', KRW: '🇰🇷', HKD: '🇭🇰', TWD: '🇹🇼',
  SGD: '🇸🇬', MYR: '🇲🇾', THB: '🇹🇭', IDR: '🇮🇩', PHP: '🇵🇭',
  VND: '🇻🇳',
}

const QUICK_AMOUNTS = [1, 10, 100, 1000, 10000]
const WATCHLIST_CODES = ['EGP', 'SAR', 'AED', 'QAR', 'KWD', 'BHD']

// ======================================================
// HELPERS
// ======================================================

function getCurrencyName(code: string): string {
  return ALL_CURRENCIES.find(c => c.code === code)?.name ?? code
}

function getFlag(code: string): string {
  return CURRENCY_FLAGS[code] ?? '🌐'
}

function fmtRate(rate: number, to: string): string {
  const highVolume = ['JPY', 'KRW', 'IDR', 'VND', 'HUF', 'CZK', 'DZD', 'EGP', 'LBP', 'TND']
  const decimals = highVolume.includes(to) ? 2 : 4
  return rate.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtResult(value: number, code: string): string {
  const highVolume = ['JPY', 'KRW', 'IDR', 'VND', 'HUF', 'CZK', 'DZD', 'EGP', 'LBP']
  const decimals = highVolume.includes(code) ? 0 : 2
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

// ======================================================
// SPARKLINE — mock 30-day visual
// ======================================================

const Sparkline: React.FC<{ seed: string }> = ({ seed }) => {
  const points = useMemo(() => {
    let v = 50
    const pts: number[] = []
    let h = seed.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
    for (let i = 0; i < 30; i++) {
      h = ((h * 1664525 + 1013904223) | 0) >>> 0
      v = Math.max(10, Math.min(90, v + ((h % 20) - 10) * 0.5))
      pts.push(v)
    }
    return pts
  }, [seed])

  const w = 244; const h = 40
  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys = points.map(p => h - (p / 100) * h)
  const pathD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  const isUp = (points[points.length - 1] ?? 50) >= (points[0] ?? 50)

  return (
    <svg className="fx-sparkline-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <motion.path
        d={pathD}
        fill="none"
        stroke={isUp ? 'var(--fx-green)' : 'var(--fx-red)'}
        strokeWidth="1"
        strokeOpacity="0.7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  )
}

// ======================================================
// ANIMATION VARIANTS
// ======================================================

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  show: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.22, 0.68, 0, 1.2] },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export const Currency: React.FC = () => {
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency,   setToCurrency]   = useState('EGP')
  const [amount,       setAmount]       = useState<number>(100)
  const [rate,         setRate]         = useState<number>(0)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [lastUpdated,  setLastUpdated]  = useState<string | null>(null)
  const [watchlistRates, setWatchlistRates] = useState<Record<string, number>>({})

  // Tracks the in-flight fetch so a currency change mid-request doesn't clobber new results
  const fetchIdRef = useRef(0)

  const result = rate > 0 ? amount * rate : 0

  // ── Core fetch — called by the effect and the manual refresh button ──
  const doFetch = useCallback(async (from: string, to: string) => {
    const id = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      // fetchCurrencyRates now hits the fawazahmed0 free API with CF fallback
      const rates: CurrencyRate[] = await fetchCurrencyRates(from)

      if (id !== fetchIdRef.current) return

      // FIX: the new API returns codes in lowercase — find case-insensitively
      const found = rates.find(r => r.code.toUpperCase() === to.toUpperCase())
      if (found) {
        setRate(found.rate)
        setLastUpdated(
          new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        )
      } else {
        setError(`Rate for ${to} not available`)
        setRate(0)
      }

      // Populate watchlist from the same single response — no extra request
      const next: Record<string, number> = {}
      WATCHLIST_CODES.forEach(code => {
        const r = rates.find(r => r.code.toUpperCase() === code)
        if (r) next[code] = r.rate
      })
      setWatchlistRates(next)

    } catch (err) {
      if (id !== fetchIdRef.current) return
      console.error('Currency fetch error:', err)
      setError('Failed to fetch exchange rates. Please try again.')
      setRate(0)
    } finally {
      if (id === fetchIdRef.current) setLoading(false)
    }
  }, [])

  // ── Re-fetch whenever either currency changes (and on mount) ──
  useEffect(() => {
    doFetch(fromCurrency, toCurrency)
  }, [fromCurrency, toCurrency, doFetch])

  // ── Manual refresh button ──
  const handleConvert = useCallback(() => {
    doFetch(fromCurrency, toCurrency)
  }, [fromCurrency, toCurrency, doFetch])

  // ── Swap — FIX: don't try to invert a stale local rate.
  //    Just flip the currency selectors; the useEffect will re-fetch the real rate.
  const handleSwap = useCallback(() => {
    setRate(0)  // clear stale rate so UI shows "—" while fetching
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }, [fromCurrency, toCurrency])

  // ── Watchlist click → switch toCurrency ──
  const handleWatchlistClick = useCallback((code: string) => {
    setToCurrency(code)
    // Optimistically show cached watchlist rate while the effect re-fetches
    const cached = watchlistRates[code]
    if (cached !== undefined) setRate(cached)
    else setRate(0)
  }, [watchlistRates])

  const pairLabel   = `${fromCurrency} / ${toCurrency}`
  const rateDisplay = rate > 0 ? fmtRate(rate, toCurrency) : '—'

  // ── Watchlist entries ──
  const watchlistEntries: WatchlistEntry[] = useMemo(() =>
    WATCHLIST_CODES.map((code, i) => ({
      code,
      name: getCurrencyName(code),
      flag: getFlag(code),
      rate: watchlistRates[code] ?? null,
      change: ((i * 37 + code.charCodeAt(0)) % 21) - 10,
    })),
    [watchlistRates]
  )

  return (
    <>
      <div className="fx-scanlines" aria-hidden="true" />

      <div className="fx-page">

        {/* ── HERO ── */}
        <motion.header
          className="fx-hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            className="fx-hero-ticker"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="fx-live-dot" />
            FX Engine · Live Market Data
          </motion.div>

          <motion.h1
            className="fx-hero-title"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
          >
            Cur<em>rency</em>
          </motion.h1>

          <motion.div
            className="fx-hero-meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div className="fx-hero-stat">
              <span className="fx-hero-stat-label">Pair</span>
              <span className="fx-hero-stat-value">{pairLabel}</span>
            </div>
            <div className="fx-hero-divider" />
            <div className="fx-hero-stat">
              <span className="fx-hero-stat-label">Rate</span>
              <span className="fx-hero-stat-value">{rateDisplay}</span>
            </div>
            <div className="fx-hero-divider" />
            <div className="fx-hero-stat">
              <span className="fx-hero-stat-label">Updated</span>
              <span className="fx-hero-stat-value">{lastUpdated ?? '—'}</span>
            </div>
            <div className="fx-hero-divider" />
            <div className="fx-hero-stat">
              <span className="fx-hero-stat-label">Markets</span>
              <span className="fx-hero-stat-value">{ALL_CURRENCIES.length} pairs</span>
            </div>
          </motion.div>
        </motion.header>

        {/* ── MAIN LAYOUT ── */}
        <div className="fx-layout">

          {/* ── CONVERTER ── */}
          <motion.main
            className="fx-converter"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="fx-section-label">
              FX Conversion Core
            </motion.div>

            {/* FROM row */}
            <motion.div variants={fadeUp}>
              <div style={{ marginBottom: 6 }}>
                <span className="fx-input-label">From</span>
              </div>
              <div className="fx-input-row">
                <div className="fx-input-group">
                  <select
                    className="fx-select"
                    value={fromCurrency}
                    onChange={e => {
                      setRate(0)
                      setFromCurrency(e.target.value)
                    }}
                    aria-label="From currency"
                  >
                    {CURRENCY_GROUPS.map(group => (
                      <optgroup key={group.label} label={group.label}>
                        {group.currencies.map(c => (
                          <option key={c.code} value={c.code}>
                            {getFlag(c.code)}  {c.code} — {c.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="fx-input-group">
                  <input
                    className="fx-input"
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="0.00"
                    aria-label="Amount to convert"
                  />
                </div>
              </div>

              {/* Quick amount chips */}
              <div className="fx-amount-chips">
                {QUICK_AMOUNTS.map(v => (
                  <motion.button
                    key={v}
                    className={`fx-chip ${amount === v ? 'active' : ''}`}
                    onClick={() => setAmount(v)}
                    whileTap={{ scale: 0.94 }}
                  >
                    {v.toLocaleString()}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Swap */}
            <motion.div variants={fadeUp} className="fx-swap-row">
              <div className="fx-swap-line" />
              <motion.button
                className="fx-swap-btn"
                onClick={handleSwap}
                aria-label="Swap currencies"
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              >
                ⇅
              </motion.button>
              <div className="fx-swap-line" />
            </motion.div>

            {/* TO row */}
            <motion.div variants={fadeUp}>
              <div style={{ marginBottom: 6 }}>
                <span className="fx-input-label">To</span>
              </div>
              <div className="fx-input-row">
                <div className="fx-input-group">
                  <select
                    className="fx-select"
                    value={toCurrency}
                    onChange={e => {
                      setRate(0)
                      setToCurrency(e.target.value)
                    }}
                    aria-label="To currency"
                  >
                    {CURRENCY_GROUPS.map(group => (
                      <optgroup key={group.label} label={group.label}>
                        {group.currencies.map(c => (
                          <option key={c.code} value={c.code}>
                            {getFlag(c.code)}  {c.code} — {c.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="fx-input-group">
                  <input
                    className="fx-input"
                    value={result > 0 ? fmtResult(result, toCurrency) : ''}
                    readOnly
                    placeholder="0.00"
                    aria-label="Converted amount"
                  />
                </div>
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="fx-error-banner"
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  role="alert"
                >
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rate display */}
            <motion.div variants={fadeUp} className="fx-rate-display">
              <div className="fx-rate-main">
                {amount.toLocaleString()} <em>{fromCurrency}</em>{' '}
                ={' '}
                {result > 0 ? fmtResult(result, toCurrency) : '—'}{' '}
                <em>{toCurrency}</em>
              </div>
              <div className="fx-rate-sub">
                <span>1 {fromCurrency} ≈ {rate > 0 ? fmtRate(rate, toCurrency) : '—'} {toCurrency}</span>
                {rate > 0 && (
                  <span className={`fx-rate-badge ${rate > 1 ? 'up' : 'neutral'}`}>
                    {rate > 1 ? '▲' : '▼'} live
                  </span>
                )}
                {lastUpdated && (
                  <span style={{ fontSize: '9px', color: 'var(--fx-ivory-muted)', letterSpacing: '0.06em' }}>
                    as of {lastUpdated}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Convert button */}
            <motion.div variants={fadeUp}>
              <motion.button
                className={`fx-convert-btn ${loading ? 'loading' : ''}`}
                onClick={handleConvert}
                disabled={loading}
                whileTap={{ scale: 0.98 }}
              >
                {loading && <div className="fx-loading-bar" />}
                {loading ? 'Syncing Market Data…' : `Get Live Rate — ${fromCurrency} → ${toCurrency}`}
              </motion.button>
            </motion.div>
          </motion.main>

          {/* ── SIDEBAR: Watchlist ── */}
          <motion.aside
            className="fx-sidebar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="fx-section-label" style={{ marginBottom: 20 }}>
              GCC Watchlist
            </div>

            <motion.div variants={stagger} initial="hidden" animate="show">
              {watchlistEntries.map(entry => (
                <motion.div
                  key={entry.code}
                  className={`fx-watchlist-item ${toCurrency === entry.code ? 'active' : ''}`}
                  variants={fadeUp}
                  onClick={() => handleWatchlistClick(entry.code)}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                >
                  <div className="fx-watchlist-left">
                    <span className="fx-flag" aria-hidden="true">{entry.flag}</span>
                    <div>
                      <div className="fx-currency-code">{entry.code}</div>
                      <div className="fx-currency-name">{entry.name}</div>
                    </div>
                  </div>
                  <div className="fx-watchlist-right">
                    {entry.rate !== null ? (
                      <>
                        <div className="fx-watchlist-rate">
                          {fmtRate(entry.rate, entry.code)}
                        </div>
                        {entry.change !== null && (
                          <div className={`fx-watchlist-change ${entry.change >= 0 ? 'up' : 'down'}`}>
                            {entry.change >= 0 ? '+' : ''}{entry.change.toFixed(2)}%
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="fx-watchlist-rate empty">—</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Sparkline */}
            <div className="fx-sparkline-row">
              <div className="fx-sparkline-label">
                30-day trend — {fromCurrency}/{toCurrency}
              </div>
              <Sparkline seed={`${fromCurrency}${toCurrency}`} />
            </div>
          </motion.aside>

        </div>
      </div>
    </>
  )
}

export default Currency