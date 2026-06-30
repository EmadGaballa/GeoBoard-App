import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPicker } from './MapPicker'
import { Navigation, MapPin } from 'lucide-react'
import './LocationModal.css'

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (lat: number, lng: number, city?: string) => void
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
}) => {
  const [mode, setMode] = useState<'choice' | 'map' | 'search'>('choice')

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          onLocationSelect(latitude, longitude, 'Current Location')
          onClose()
        },
        (error) => {
          console.error('Geolocation error:', error)
          alert('Unable to get your location. Please select manually.')
          setMode('map')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
      setMode('map')
    }
  }

  const handleManualSelect = () => {
    setMode('map')
  }

  const handleMapLocationSelect = (lat: number, lng: number, city?: string) => {
    onLocationSelect(lat, lng, city)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="location-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="location-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {mode === 'choice' && (
              <>
                <div className="location-modal-header">
                  <MapPin className="location-modal-icon" size={32} />
                  <h2 className="location-modal-title">Choose Your Location</h2>
                  <p className="location-modal-subtitle">
                    Select how you'd like to set your location
                  </p>
                </div>

                <div className="location-modal-options">
                  <motion.button
                    className="location-option-btn"
                    onClick={handleUseCurrentLocation}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="location-option-icon">
                      <Navigation size={24} />
                    </div>
                    <div className="location-option-text">
                      <h3>Use Current Location</h3>
                      <p>Automatically detect your location using GPS</p>
                    </div>
                  </motion.button>

                  <motion.button
                    className="location-option-btn"
                    onClick={handleManualSelect}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="location-option-icon">
                      <MapPin size={24} />
                    </div>
                    <div className="location-option-text">
                      <h3>Select Manually</h3>
                      <p>Choose a location from the map or search</p>
                    </div>
                  </motion.button>
                </div>

                <button className="location-modal-skip" onClick={onClose}>
                  Skip for now
                </button>
              </>
            )}

            {mode === 'map' && (
              <MapPicker
                onLocationSelect={handleMapLocationSelect}
                onClose={onClose}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}