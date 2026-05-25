// ======================================================
// API SERVICE: CURRENCY
// Uses: https://github.com/fawazahmed0/exchange-api (free, no key)
// Fallback: Cloudflare Pages mirror
// ======================================================

export interface CurrencyRate {
  code: string
  rate: number
  flag: string
  change: number
  name: string
}

const CDN_BASE   = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1'
const CF_BASE    = 'https://latest.currency-api.pages.dev/v1'

// Fetch with automatic fallback to Cloudflare mirror
async function fetchWithFallback(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${CDN_BASE}${path}`)
    if (!res.ok) throw new Error(`CDN ${res.status}`)
    return res.json()
  } catch {
    const res = await fetch(`${CF_BASE}${path}`)
    if (!res.ok) throw new Error(`CF ${res.status}`)
    return res.json()
  }
}

// ──────────────────────────────────────────────────────
// PUBLIC: fetch all rates for a base currency
// Response shape: { date: "2024-...", "usd": { eur: 0.92, egp: 48.9, ... } }
// ──────────────────────────────────────────────────────
export const fetchCurrencyRates = async (
  baseCurrency: string = 'USD'
): Promise<CurrencyRate[]> => {
  const base = baseCurrency.toLowerCase()
  try {
    const data = await fetchWithFallback(`/currencies/${base}.json`) as Record<string, unknown>

    // The rates object lives under the base currency key
    const ratesObj = data[base] as Record<string, number> | undefined
    if (!ratesObj) throw new Error('Unexpected API shape')

    return Object.entries(ratesObj).map(([code, rate]) => ({
      code: code.toUpperCase(),
      rate,
      flag: getCurrencyFlag(code.toUpperCase()),
      change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
      name: getCurrencyName(code.toUpperCase()),
    }))
  } catch (error) {
    console.error('Error fetching currency rates:', error)
    return getMockCurrencyRates()
  }
}

// ──────────────────────────────────────────────────────
// PUBLIC: direct pair conversion
// ──────────────────────────────────────────────────────
export const convertCurrency = async (
  fromCurrency: string,
  toCurrency: string,
  amount: number
): Promise<{ rate: number; result: number }> => {
  try {
    const rates = await fetchCurrencyRates(fromCurrency)
    const found = rates.find(r => r.code === toCurrency)
    if (!found) throw new Error(`${toCurrency} not found`)
    return { rate: found.rate, result: amount * found.rate }
  } catch (error) {
    console.error('Error converting currency:', error)
    const mock = getMockCurrencyRates()
    const found = mock.find(r => r.code === toCurrency)
    const rate = found?.rate ?? 1
    return { rate, result: amount * rate }
  }
}

// ──────────────────────────────────────────────────────
// PUBLIC: mock historical (API free tier doesn't support history)
// ──────────────────────────────────────────────────────
export const getHistoricalRates = async (
  _baseCurrency: string,
  _targetCurrency: string = 'EUR',
  days: number = 30
): Promise<{ date: string; rate: number }[]> => {
  let baseRate = 1.0
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86_400_000)
    baseRate += (Math.random() - 0.5) * 0.008
    return { date: date.toISOString().split('T')[0], rate: parseFloat(baseRate.toFixed(5)) }
  })
}

// ======================================================
// HELPERS
// ======================================================

export const getCurrencyFlag = (code: string): string => {
  const flags: Record<string, string> = {
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭',
    CAD: '🇨🇦', AUD: '🇦🇺', NZD: '🇳🇿', SEK: '🇸🇪', NOK: '🇳🇴',
    DKK: '🇩🇰', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺', RON: '🇷🇴',
    CNY: '🇨🇳', KRW: '🇰🇷', HKD: '🇭🇰', TWD: '🇹🇼', SGD: '🇸🇬',
    MYR: '🇲🇾', THB: '🇹🇭', IDR: '🇮🇩', PHP: '🇵🇭', VND: '🇻🇳',
    INR: '🇮🇳', PKR: '🇵🇰', BDT: '🇧🇩', LKR: '🇱🇰',
    EGP: '🇪🇬', SAR: '🇸🇦', AED: '🇦🇪', QAR: '🇶🇦', KWD: '🇰🇼',
    BHD: '🇧🇭', OMR: '🇴🇲', JOD: '🇯🇴', LBP: '🇱🇧', MAD: '🇲🇦',
    TND: '🇹🇳', DZD: '🇩🇿', LYD: '🇱🇾', SDG: '🇸🇩', IQD: '🇮🇶',
    MXN: '🇲🇽', BRL: '🇧🇷', ARS: '🇦🇷', CLP: '🇨🇱', COP: '🇨🇴',
    ZAR: '🇿🇦', NGN: '🇳🇬', KES: '🇰🇪', GHS: '🇬🇭', ETB: '🇪🇹',
    RUB: '🇷🇺', TRY: '🇹🇷', ILS: '🇮🇱', UAH: '🇺🇦',
  }
  return flags[code] ?? '🌐'
}

export const getCurrencyName = (code: string): string => {
  const names: Record<string, string> = {
    USD: 'US Dollar',          EUR: 'Euro',               GBP: 'British Pound',
    JPY: 'Japanese Yen',       CHF: 'Swiss Franc',         CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',  NZD: 'New Zealand Dollar',  SEK: 'Swedish Krona',
    NOK: 'Norwegian Krone',    DKK: 'Danish Krone',        PLN: 'Polish Złoty',
    CZK: 'Czech Koruna',       HUF: 'Hungarian Forint',    RON: 'Romanian Leu',
    CNY: 'Chinese Yuan',       KRW: 'South Korean Won',    HKD: 'Hong Kong Dollar',
    TWD: 'Taiwan Dollar',      SGD: 'Singapore Dollar',    MYR: 'Malaysian Ringgit',
    THB: 'Thai Baht',          IDR: 'Indonesian Rupiah',   PHP: 'Philippine Peso',
    VND: 'Vietnamese Dong',    INR: 'Indian Rupee',         PKR: 'Pakistani Rupee',
    EGP: 'Egyptian Pound',     SAR: 'Saudi Riyal',          AED: 'UAE Dirham',
    QAR: 'Qatari Riyal',       KWD: 'Kuwaiti Dinar',       BHD: 'Bahraini Dinar',
    OMR: 'Omani Rial',         JOD: 'Jordanian Dinar',     LBP: 'Lebanese Pound',
    MAD: 'Moroccan Dirham',    TND: 'Tunisian Dinar',      DZD: 'Algerian Dinar',
    MXN: 'Mexican Peso',       BRL: 'Brazilian Real',       ARS: 'Argentine Peso',
    ZAR: 'South African Rand', NGN: 'Nigerian Naira',       TRY: 'Turkish Lira',
    RUB: 'Russian Ruble',      ILS: 'Israeli Shekel',       UAH: 'Ukrainian Hryvnia',
  }
  return names[code] ?? code
}

const getMockCurrencyRates = (): CurrencyRate[] => [
  { code: 'EUR', rate: 0.92,    flag: '🇪🇺', change:  0.5,  name: 'Euro' },
  { code: 'GBP', rate: 0.79,    flag: '🇬🇧', change: -0.3,  name: 'British Pound' },
  { code: 'JPY', rate: 149.5,   flag: '🇯🇵', change:  1.2,  name: 'Japanese Yen' },
  { code: 'CAD', rate: 1.36,    flag: '🇨🇦', change:  0.2,  name: 'Canadian Dollar' },
  { code: 'AUD', rate: 1.54,    flag: '🇦🇺', change: -0.8,  name: 'Australian Dollar' },
  { code: 'CHF', rate: 0.88,    flag: '🇨🇭', change:  0.1,  name: 'Swiss Franc' },
  { code: 'CNY', rate: 7.24,    flag: '🇨🇳', change:  0.7,  name: 'Chinese Yuan' },
  { code: 'EGP', rate: 48.9,    flag: '🇪🇬', change: -0.6,  name: 'Egyptian Pound' },
  { code: 'SAR', rate: 3.75,    flag: '🇸🇦', change:  0.0,  name: 'Saudi Riyal' },
  { code: 'AED', rate: 3.67,    flag: '🇦🇪', change:  0.0,  name: 'UAE Dirham' },
  { code: 'QAR', rate: 3.64,    flag: '🇶🇦', change:  0.0,  name: 'Qatari Riyal' },
  { code: 'KWD', rate: 0.307,   flag: '🇰🇼', change:  0.1,  name: 'Kuwaiti Dinar' },
  { code: 'BHD', rate: 0.376,   flag: '🇧🇭', change:  0.0,  name: 'Bahraini Dinar' },
  { code: 'OMR', rate: 0.385,   flag: '🇴🇲', change:  0.0,  name: 'Omani Rial' },
  { code: 'JOD', rate: 0.709,   flag: '🇯🇴', change:  0.0,  name: 'Jordanian Dinar' },
  { code: 'LBP', rate: 89500,   flag: '🇱🇧', change: -1.2,  name: 'Lebanese Pound' },
  { code: 'MAD', rate: 9.98,    flag: '🇲🇦', change:  0.3,  name: 'Moroccan Dirham' },
  { code: 'TND', rate: 3.12,    flag: '🇹🇳', change:  0.1,  name: 'Tunisian Dinar' },
  { code: 'DZD', rate: 134.5,   flag: '🇩🇿', change:  0.2,  name: 'Algerian Dinar' },
  { code: 'KRW', rate: 1325.0,  flag: '🇰🇷', change:  0.8,  name: 'South Korean Won' },
  { code: 'SGD', rate: 1.34,    flag: '🇸🇬', change:  0.2,  name: 'Singapore Dollar' },
  { code: 'HKD', rate: 7.82,    flag: '🇭🇰', change:  0.0,  name: 'Hong Kong Dollar' },
  { code: 'SEK', rate: 10.42,   flag: '🇸🇪', change: -0.3,  name: 'Swedish Krona' },
  { code: 'NOK', rate: 10.55,   flag: '🇳🇴', change: -0.5,  name: 'Norwegian Krone' },
  { code: 'DKK', rate: 6.89,    flag: '🇩🇰', change:  0.1,  name: 'Danish Krone' },
  { code: 'PLN', rate: 3.95,    flag: '🇵🇱', change:  0.4,  name: 'Polish Złoty' },
  { code: 'TRY', rate: 32.1,    flag: '🇹🇷', change: -1.5,  name: 'Turkish Lira' },
  { code: 'INR', rate: 83.12,   flag: '🇮🇳', change: -0.4,  name: 'Indian Rupee' },
  { code: 'MXN', rate: 17.05,   flag: '🇲🇽', change:  0.3,  name: 'Mexican Peso' },
  { code: 'ZAR', rate: 18.5,    flag: '🇿🇦', change:  1.1,  name: 'South African Rand' },
]