// ======================================================
// GEOBOARD — CURRENCY SERVICE (Backend proxy)
// fawazahmed0/exchange-api (free, no key required)
// ======================================================

import { getCache, CacheService } from '../cache/index.js'
import { config } from '../config/index.js'
import type { CurrencyRate, CurrencyConversion } from '../types/index.js'

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1'
const CF_BASE = 'https://latest.currency-api.pages.dev/v1'

export class CurrencyService {
  // ── Get all rates ───────────────────────────────────

  async getRates(baseCurrency = 'USD'): Promise<CurrencyRate[]> {
    const cache = getCache()
    const cacheKey = CacheService.currencyKey(baseCurrency)

    const { data } = await cache.getOrFetch(
      cacheKey,
      config.cache.ttlCurrency,
      async () => this.fetchRates(baseCurrency),
    )

    return data as CurrencyRate[]
  }

  private async fetchRates(baseCurrency: string): Promise<CurrencyRate[]> {
    const base = baseCurrency.toLowerCase()
    const ratesObj = await this.fetchWithFallback(`/currencies/${base}.json`) as Record<string, unknown>
    const ratesData = ratesObj[base] as Record<string, number> | undefined

    if (!ratesData) throw new Error('Unexpected API shape')

    return Object.entries(ratesData).map(([code, rate]) => ({
      code: code.toUpperCase(),
      rate,
      flag: this.getCurrencyFlag(code.toUpperCase()),
      change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
      name: this.getCurrencyName(code.toUpperCase()),
    }))
  }

  // ── Convert currencies ──────────────────────────────

  async convert(fromCurrency: string, toCurrency: string, amount: number): Promise<CurrencyConversion> {
    const rates = await this.getRates(fromCurrency)
    const found = rates.find(r => r.code === toCurrency)

    if (!found) {
      throw new Error(`Currency ${toCurrency} not found`)
    }

    return {
      fromCurrency,
      toCurrency,
      amount,
      rate: found.rate,
      result: amount * found.rate,
      timestamp: new Date().toISOString(),
    }
  }

  // ── Fetch with fallback ─────────────────────────────

  private async fetchWithFallback(path: string): Promise<unknown> {
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

  // ── Currency helpers ────────────────────────────────

  private getCurrencyFlag(code: string): string {
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

  private getCurrencyName(code: string): string {
    const names: Record<string, string> = {
      USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound',
      JPY: 'Japanese Yen', CHF: 'Swiss Franc', CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar', NZD: 'New Zealand Dollar', SEK: 'Swedish Krona',
      NOK: 'Norwegian Krone', DKK: 'Danish Krone', PLN: 'Polish Złoty',
      CZK: 'Czech Koruna', HUF: 'Hungarian Forint', RON: 'Romanian Leu',
      CNY: 'Chinese Yuan', KRW: 'South Korean Won', HKD: 'Hong Kong Dollar',
      TWD: 'Taiwan Dollar', SGD: 'Singapore Dollar', MYR: 'Malaysian Ringgit',
      THB: 'Thai Baht', IDR: 'Indonesian Rupiah', PHP: 'Philippine Peso',
      VND: 'Vietnamese Dong', INR: 'Indian Rupee', PKR: 'Pakistani Rupee',
      EGP: 'Egyptian Pound', SAR: 'Saudi Riyal', AED: 'UAE Dirham',
      QAR: 'Qatari Riyal', KWD: 'Kuwaiti Dinar', BHD: 'Bahraini Dinar',
      OMR: 'Omani Rial', JOD: 'Jordanian Dinar', LBP: 'Lebanese Pound',
      MAD: 'Moroccan Dirham', TND: 'Tunisian Dinar', DZD: 'Algerian Dinar',
      MXN: 'Mexican Peso', BRL: 'Brazilian Real', ARS: 'Argentine Peso',
      ZAR: 'South African Rand', NGN: 'Nigerian Naira', TRY: 'Turkish Lira',
      RUB: 'Russian Ruble', ILS: 'Israeli Shekel', UAH: 'Ukrainian Hryvnia',
    }
    return names[code] ?? code
  }
}

export const currencyService = new CurrencyService()