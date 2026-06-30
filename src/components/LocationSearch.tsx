import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin } from 'lucide-react'
import './LocationSearch.css'

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number, city: string) => void
  onClose: () => void
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }, [query])

  const handleSelect = (result: any) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    onLocationSelect(lat, lon, result.display_name)
  }

  return (
    <div className="location-search">
      <div className="location-search-header">
        <h3>Search Location</h3>
        <button className="location-search-close" onClick={onClose}>✕</button>
      </div>

      <div className="location-search-input-wrap">
        <Search className="location-search-icon" size={18} />
        <input
          type="text"
          className="location-search-input"
          placeholder="Enter city or place name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          autoFocus
        />
        <motion.button
          className="location-search-btn"
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {searching ? 'Searching...' : 'Search'}
        </motion.button>
      </div>

      {results.length > 0 && (
        <div className="location-search-results">
          {results.map((result, index) => (
            <motion.button
              key={result.place_id}
              className="location-search-result"
              onClick={() => handleSelect(result)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MapPin size={16} />
              <div className="location-search-result-text">
                <div className="location-search-result-name">
                  {result.display_name.split(',')[0]}
                </div>
                <div className="location-search-result-details">
                  {result.display_name.split(',').slice(1, 3).join(',')}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {query && results.length === 0 && !searching && (
        <div className="location-search-empty">
          No results found. Try a different search term.
        </div>
      )}
    </div>
  )
}