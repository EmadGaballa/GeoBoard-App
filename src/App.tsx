import React, { useEffect, useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import {
  Navbar,
  Sidebar,
  AnimatedBackground,
} from './components'

import {
  Home,
  Weather,
  News,
  Currency,
} from './pages'

import {
  saveLocation,
  loadLocation,
} from './utils/locationStorage'

// =========================
// TYPES
// =========================

interface GeolocationState {
  latitude: number
  longitude: number
  city: string
  country: string
  timezone: string
  loading: boolean
  error: string | null
  timestamp?: number
}

export interface UserLocation {
  latitude: number
  longitude: number
  city: string
  country: string
  timezone: string
}

// =========================
// CONTEXT
// =========================

export const LocationContext =
  React.createContext<UserLocation>({
    latitude: 0,
    longitude: 0,
    city: 'Unknown',
    country: 'Unknown',
    timezone: 'UTC',
  })

// =========================
// CONSTANTS
// =========================

const LOCATION_CACHE_MAX_AGE =
  1000 * 60 * 30 // 30 minutes — shorter window so location stays fresh

// =========================
// APP
// =========================

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  const [geolocation, setGeolocation] =
    useState<GeolocationState>({
      latitude: 0,
      longitude: 0,
      city: 'Loading...',
      country: 'Loading...',
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      loading: true,
      error: null,
    })

  // =========================
  // REVERSE GEOCODE HELPER
  // =========================

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number): Promise<{ city: string; country: string }> => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        )
        const data = await response.json()
        return {
          city:
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            'Unknown',
          country: data.address?.country || 'Unknown',
        }
      } catch {
        return { city: 'Unknown', country: 'Unknown' }
      }
    },
    []
  )

  // =========================
  // LOCATION ENGINE
  // =========================

  useEffect(() => {
    let isMounted = true
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // =========================
    // STEP 1: CHECK CACHE FIRST
    // (show immediately while we re-verify)
    // =========================

    const cachedLocation = loadLocation()
    const cacheIsValid =
      cachedLocation &&
      cachedLocation.timestamp &&
      Date.now() - cachedLocation.timestamp < LOCATION_CACHE_MAX_AGE

    if (cacheIsValid && cachedLocation) {
      // Show cached data instantly, but still re-ask silently in background
      setGeolocation({
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        city: cachedLocation.city,
        country: cachedLocation.country,
        timezone: cachedLocation.timezone || timezone,
        loading: false,
        error: null,
        timestamp: cachedLocation.timestamp,
      })
      // Cache is fresh — no need to re-request
      return
    }

    // =========================
    // STEP 2: GEOLOCATION CHECK
    // =========================

    if (!navigator.geolocation) {
      // No geolocation API — use cache if available, else show error
      if (cachedLocation) {
        setGeolocation({
          ...cachedLocation,
          timezone: cachedLocation.timezone || timezone,
          loading: false,
          error: 'Geolocation not supported, using saved location',
        })
      } else {
        setGeolocation((prev) => ({
          ...prev,
          loading: false,
          error: 'Geolocation is not supported by your browser',
        }))
      }
      return
    }

    // =========================
    // STEP 3: ALWAYS REQUEST FRESH LOCATION
    // Show stale cache (if any) while waiting for permission
    // =========================

    if (cachedLocation && !cacheIsValid) {
      // Show stale data temporarily so UI isn't blank
      setGeolocation({
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        city: cachedLocation.city,
        country: cachedLocation.country,
        timezone: cachedLocation.timezone || timezone,
        loading: true, // keep loading=true so components know refresh is in progress
        error: null,
        timestamp: cachedLocation.timestamp,
      })
    }

    navigator.geolocation.getCurrentPosition(
      // =========================
      // SUCCESS
      // =========================
      async (position) => {
        const { latitude, longitude } = position.coords

        const { city, country } = await reverseGeocode(latitude, longitude)

        const newLocation = {
          latitude,
          longitude,
          city,
          country,
          timezone,
          timestamp: Date.now(),
        }

        // Persist to cache
        saveLocation(newLocation)

        if (!isMounted) return

        // Update all consumers via context
        setGeolocation({
          ...newLocation,
          loading: false,
          error: null,
        })
      },

      // =========================
      // ERROR — permission denied or timeout
      // =========================
      (err) => {
        console.warn('Geolocation error:', err.message)

        if (!isMounted) return

        if (cachedLocation) {
          // Fall back to whatever cache we have (even stale)
          setGeolocation({
            latitude: cachedLocation.latitude,
            longitude: cachedLocation.longitude,
            city: cachedLocation.city,
            country: cachedLocation.country,
            timezone: cachedLocation.timezone || timezone,
            loading: false,
            error: 'Could not refresh location — using last known position',
            timestamp: cachedLocation.timestamp,
          })
        } else {
          // No cache and no permission: show error, no hardcoded fallback city
          setGeolocation((prev) => ({
            ...prev,
            loading: false,
            error:
              err.code === 1
                ? 'Location access denied. Please allow location access and reload.'
                : 'Unable to determine your location. Please reload.',
          }))
        }
      },

      // =========================
      // OPTIONS — always get a fresh fix
      // =========================
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // ← KEY FIX: never accept a cached GPS fix from the browser
      }
    )

    return () => {
      isMounted = false
    }
  }, [reverseGeocode])

  // =========================
  // CONTEXT VALUE
  // =========================

  const locationValue: UserLocation = {
    latitude: geolocation.latitude,
    longitude: geolocation.longitude,
    city: geolocation.city,
    country: geolocation.country,
    timezone: geolocation.timezone,
  }

  // =========================
  // RENDER
  // =========================

  return (
    <Router>
      <LocationContext.Provider value={locationValue}>
        <div className="app-shell">
          <AnimatedBackground />

          <Sidebar
            open={sidebarOpen}
            setOpen={setSidebarOpen}
          />

          <div className="app-main">
            <Navbar
              onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            />

            <main className="app-content">
              {geolocation.loading && geolocation.latitude === 0 ? (
                // Only block the UI on the very first load (no coords yet)
                <div className="loading-screen">
                  <div className="spinner" />
                  <p>Detecting your location...</p>
                </div>
              ) : geolocation.error && geolocation.latitude === 0 ? (
                // No location at all — show an actionable error
                <div className="loading-screen">
                  <p className="error-message">{geolocation.error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="retry-button"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/weather" element={<Weather />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/currency" element={<Currency />} />
                </Routes>
              )}
            </main>
          </div>
        </div>
      </LocationContext.Provider>
    </Router>
  )
}

export default App