import React, { useEffect, useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import {
  Navbar,
  Sidebar,
  AnimatedBackground,
  LocationModal,
} from './components'

import {
  Home,
  Weather,
  News,
  Currency,
  Login,
  Register,
  Settings,
  ResetPassword,
} from './pages'

import {
  saveLocation,
  loadLocation,
  clearLocation,
} from './utils/locationStorage'

// =========================
// TYPES
// =========================

export interface UserLocation {
  latitude: number
  longitude: number
  city: string
  country: string
  timezone: string
}

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
  1000 * 60 * 30 // 30 minutes

// =========================
// LOCATION PROVIDER
// =========================

const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [geolocation, setGeolocation] = useState<GeolocationState>({
    latitude: 0,
    longitude: 0,
    city: 'Loading...',
    country: 'Loading...',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    loading: true,
    error: null,
  })

  const [showLocationModal, setShowLocationModal] = useState(false)
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false)

  // Check if user has already made a location choice
  useEffect(() => {
    const hasManualLocation = localStorage.getItem('manualLocation')
    const hasSeenModal = localStorage.getItem('hasSeenLocationModal')

    if (!hasSeenModal && !hasManualLocation) {
      // First visit - show modal
      setShowLocationModal(true)
    } else if (hasManualLocation) {
      // User has manually selected location before
      setHasSelectedLocation(true)
    }
  }, [])

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

  const updateLocation = useCallback(async (latitude: number, longitude: number, cityName?: string, countryName?: string) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    let city = cityName || 'Unknown'
    let country = countryName || 'Unknown'

    // If we don't have a country but have a city, still try to reverse geocode to get it
    if (!countryName || countryName === 'Unknown') {
      const geo = await reverseGeocode(latitude, longitude)
      city = geo.city
      country = geo.country
    }

    const newLocation = {
      latitude,
      longitude,
      city,
      country,
      timezone,
      timestamp: Date.now(),
    }

    saveLocation(newLocation)

    setGeolocation({
      ...newLocation,
      loading: false,
      error: null,
    })
  }, [reverseGeocode])

  // Auto-detect location on mount (if no manual location)
  useEffect(() => {
    const hasManualLocation = localStorage.getItem('manualLocation')
    if (hasManualLocation) {
      // Use manual location
      const manual = JSON.parse(localStorage.getItem('manualLocation')!)
      updateLocation(manual.lat, manual.lng, manual.city, manual.country)
      return
    }

    let isMounted = true
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Check cache first
    const cachedLocation = loadLocation()
    const cacheIsValid =
      cachedLocation &&
      cachedLocation.timestamp &&
      Date.now() - cachedLocation.timestamp < LOCATION_CACHE_MAX_AGE

    if (cacheIsValid && cachedLocation) {
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
      return
    }

    if (!navigator.geolocation) {
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

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        await updateLocation(latitude, longitude)
      },
      (err) => {
        console.warn('Geolocation error:', err.message)
        if (cachedLocation) {
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
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )

    return () => {
      isMounted = false
    }
  }, [updateLocation])

  const handleLocationSelect = useCallback((lat: number, lng: number, city?: string) => {
    localStorage.setItem('manualLocation', JSON.stringify({ lat, lng, city: city || 'Unknown' }))
    localStorage.setItem('hasSeenLocationModal', 'true')
    setHasSelectedLocation(true)
    updateLocation(lat, lng, city)
  }, [updateLocation])

  const handleClearLocation = useCallback(() => {
    clearLocation()
    localStorage.removeItem('manualLocation')
    localStorage.removeItem('hasSeenLocationModal')
    setHasSelectedLocation(false)
    window.location.reload()
  }, [])

  const locationValue: UserLocation = {
    latitude: geolocation.latitude,
    longitude: geolocation.longitude,
    city: geolocation.city,
    country: geolocation.country,
    timezone: geolocation.timezone,
  }

  return (
    <LocationContext.Provider value={locationValue}>
      {children}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false)
          localStorage.setItem('hasSeenLocationModal', 'true')
        }}
        onLocationSelect={handleLocationSelect}
      />
    </LocationContext.Provider>
  )
}

// =========================
// PROTECTED ROUTE
// =========================

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// =========================
// APP CONTENT
// =========================

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()

  return (
    <Router>
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
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/weather" element={<Weather />} />
              <Route path="/news" element={<News />} />
              <Route path="/currency" element={<Currency />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

// =========================
// APP
// =========================

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LocationProvider>
        <AppContent />
      </LocationProvider>
    </AuthProvider>
  )
}

export default App