import React, { useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Navigation, MapPin } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapPicker.css'

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, city?: string) => void
  initialPosition?: [number, number]
  onClose: () => void
}

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )
    const data = await res.json()
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      'Unknown'
    )
  } catch {
    return 'Unknown'
  }
}

const LocationMarker: React.FC<{
  position: [number, number] | null
  onLocationSelect: (lat: number, lng: number) => void
}> = ({ position, onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected location</Popup>
    </Marker>
  )
}

export const MapPicker: React.FC<MapPickerProps> = ({
  onLocationSelect,
  initialPosition = [30.0444, 31.2357], // Default: Cairo
  onClose,
}) => {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const pendingCity = useRef<string | undefined>(undefined)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng])
    pendingCity.current = undefined
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0]
        const latNum = parseFloat(lat)
        const lonNum = parseFloat(lon)
        setPosition([latNum, lonNum])
        pendingCity.current = display_name
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setPosition([latitude, longitude])
          pendingCity.current = undefined
        },
        (error) => {
          console.error('Geolocation error:', error)
        }
      )
    }
  }

  const handleConfirm = async () => {
    if (!position) return
    setConfirming(true)
    const city = pendingCity.current || await reverseGeocode(position[0], position[1])
    onLocationSelect(position[0], position[1], city)
    setConfirming(false)
    onClose()
  }

  return (
    <motion.div
      className="map-picker-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="map-picker-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="map-picker-header">
          <h2 className="map-picker-title">Select Location</h2>
          <button className="map-picker-close" onClick={onClose}>✕</button>
        </div>

        <div className="map-picker-search">
          <div className="map-picker-search-input-wrap">
            <Search className="map-picker-search-icon" size={18} />
            <input
              type="text"
              className="map-picker-search-input"
              placeholder="Search for a city or place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <motion.button
            className="map-picker-search-btn"
            onClick={handleSearch}
            disabled={searching}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {searching ? 'Searching...' : 'Search'}
          </motion.button>
          <motion.button
            className="map-picker-location-btn"
            onClick={handleUseCurrentLocation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Use current location"
          >
            <Navigation size={18} />
          </motion.button>
        </div>

        <div className="map-picker-container">
          <MapContainer
            center={position || initialPosition}
            zoom={position ? 13 : 10}
            className="map-picker-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
              position={position}
              onLocationSelect={handleMapClick}
            />
          </MapContainer>

          {position && (
            <div className="map-picker-selected">
              <MapPin size={16} />
              <span>
                {position[0].toFixed(4)}°N, {position[1].toFixed(4)}°E
              </span>
            </div>
          )}
        </div>

        <div className="map-picker-footer">
          <p className="map-picker-hint">
            Click on the map or search for a location
          </p>
          <motion.button
            className="map-picker-confirm"
            onClick={handleConfirm}
            disabled={!position || confirming}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {confirming ? 'Resolving…' : 'Confirm Location'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}